import {
  buildSystemPrompt,
  OpenAiProvider,
  resolveStopNotice,
  runAgentLoop,
  toCoreMessage,
  type Message as CoreMessage,
  type Provider,
} from "@repo/agent-core";
import {
  cancelFlagKey,
  del as cacheDel,
  get as cacheGet,
} from "@repo/cache";
import { prisma, type Job } from "@repo/db";
import { SandboxRuntime, type SandboxProvider } from "@repo/sandbox";
import { ALL_TOOLS } from "@repo/tools";
import { sessionWorktreePath } from "@repo/workspace";
import { checkpointSession } from "./checkpoint";
import { createEmitAdapter } from "./emit-adapter";
import { createPersist, publishStatus } from "./persist";
import type { AgentJobResult } from "./types";

const MAX_ITERATIONS = 60;
const MAX_COST_USD = 5;
const LOOP_DEADLINE_MS = 10 * 60_000;
// A backstop above the loop's own deadline: that deadline is cooperative
// (checked between iterations), so it can't catch a single call that never
// returns. This can, because it tears down the sandbox from the outside.
const WALL_CLOCK_CAP_MS = 15 * 60_000;
const CANCEL_POLL_MS = 1000;
const HEARTBEAT_MS = 5000;

export async function executeAgentJob(
  job: Job,
  sandboxProvider: SandboxProvider,
  renewLease: () => Promise<void>,
  provider?: Provider,
): Promise<AgentJobResult> {
  const session = await prisma.session.findUnique({
    where: { id: job.sessionId },
    include: { project: { select: { userId: true } } },
  });
  if (!session) {
    return { jobId: job.id, sessionId: job.sessionId, stopReason: "fatalError" };
  }
  const userId = session.project.userId;

  const priorRows = await prisma.message.findMany({
    where: { sessionId: session.id },
    orderBy: { seq: "asc" },
  });
  const seqStart = (priorRows.at(-1)?.seq ?? -1) + 1;
  const persist = createPersist(session.id, seqStart);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { credits: true },
  });
  if (!user || user.credits <= 0) {
    const notice = resolveStopNotice("outOfCredits");
    publishStatus(session.id, "IDLE", notice.detail, notice.stopReason);
    await persist({
      role: "assistant",
      type: "text",
      content: notice.content,
      data: { stopReason: notice.stopReason },
    });
    return { jobId: job.id, sessionId: job.sessionId, stopReason: notice.stopReason };
  }

  await prisma.session.update({ where: { id: session.id }, data: { status: "RUNNING" } });
  publishStatus(session.id, "RUNNING", "Analyzing request…");

  const worktreeDir = sessionWorktreePath(job.projectId, job.sessionId);
  const controller = new AbortController();
  const sandboxStartedAt = Date.now();

  const sandbox = await sandboxProvider.create({
    projectId: job.projectId,
    workspaceDir: worktreeDir,
    maxWallClockMs: WALL_CLOCK_CAP_MS,
    onWallClockExceeded: () => controller.abort(),
  });

  const heartbeat = setInterval(() => {
    renewLease().catch(() => {});
  }, HEARTBEAT_MS);

  const cancelPoll = setInterval(() => {
    cacheGet<boolean>(cancelFlagKey(session.id))
      .then((cancelled) => {
        if (cancelled) controller.abort();
      })
      .catch(() => {});
  }, CANCEL_POLL_MS);

  let stopReason = "fatalError";
  try {
    const runtime = new SandboxRuntime(sandbox);
    const systemPrompt = await buildSystemPrompt(runtime);
    const systemMessage: CoreMessage = { role: "user", type: "text", content: systemPrompt };
    const messages: CoreMessage[] = [systemMessage, ...priorRows.map(toCoreMessage)];

    const { emit } = createEmitAdapter({ sessionId: session.id, userId, persist });

    stopReason = await runAgentLoop({
      messages,
      tools: ALL_TOOLS,
      provider: provider ?? new OpenAiProvider({ model: session.model }),
      runtime,
      emit,
      budget: {
        maxIterations: MAX_ITERATIONS,
        maxTokens: Math.max(500, Math.min(user.credits, 2_000_000)),
        maxCostUsd: MAX_COST_USD,
        deadline: Date.now() + LOOP_DEADLINE_MS,
      },
      signal: controller.signal,
      sessionId: session.id,
    });

    if (stopReason !== "completed") {
      const postRunUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { credits: true },
      });
      const notice = resolveStopNotice(stopReason, (postRunUser?.credits ?? 0) <= 0);
      await persist({
        role: "assistant",
        type: "text",
        content: notice.content,
        data: { stopReason: notice.stopReason },
      });
      stopReason = notice.stopReason;
    }

    if (stopReason !== "fatalError") {
      const triggeringPrompt = priorRows.at(-1)?.content ?? "";
      await checkpointSession(sandbox, triggeringPrompt);
    }

    await prisma.session.update({
      where: { id: session.id },
      data: { status: stopReason === "fatalError" ? "ERROR" : "IDLE" },
    });
  } catch (err) {
    stopReason = "fatalError";
    await prisma.session.update({ where: { id: session.id }, data: { status: "ERROR" } });
    await persist({
      role: "assistant",
      type: "text",
      content: `Something went wrong and the run stopped: ${err instanceof Error ? err.message : String(err)}`,
    });
  } finally {
    clearInterval(heartbeat);
    clearInterval(cancelPoll);
    publishStatus(session.id, stopReason === "fatalError" ? "ERROR" : "IDLE", undefined, stopReason);
    await sandboxProvider.destroy(sandbox.id);
    const sandboxSeconds = Math.round((Date.now() - sandboxStartedAt) / 1000);
    await prisma.session
      .update({ where: { id: session.id }, data: { sandboxSeconds: { increment: sandboxSeconds } } })
      .catch(() => {});
    await cacheDel(cancelFlagKey(session.id)).catch(() => {});
  }

  return { jobId: job.id, sessionId: job.sessionId, stopReason };
}
