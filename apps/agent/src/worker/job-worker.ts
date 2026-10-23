import {
  buildSystemPrompt,
  isProviderCreditsDepleted,
  OpenAiProvider,
  plannerModel,
  PROVIDER_CREDITS_DEPLETED_NOTICE,
  providerFor,
  resolveModelForPlan,
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
import { loadMissingAssetsNotice } from "@repo/assets";
import { applyTheme, chosenThemeFromRows } from "@repo/blueprint";
import { AGENT_LOOP_LIMITS, loopSpendLimits } from "@repo/contracts";
import { prisma, type Job } from "@repo/db";
import { classify, type VerifyOutcome } from "@repo/decision-engine";
import { createLogger } from "@repo/logger";
import { SandboxRuntime, type SandboxProvider } from "@repo/sandbox";
import { ALL_TOOLS } from "@repo/tools";
import { sessionWorktreePath } from "@repo/workspace";
import { restoreWorkspace } from "../recovery";
import { withSelectionApplied } from "./apply-selection";
import { approvedBlueprintIdFromRows } from "./approved-blueprint-id";
import { autoMergeSession } from "./auto-merge-session";
import { isBrowserCheckEnabled, runBrowserCheckStep } from "./browser-check-step";
import { checkpointSession } from "./checkpoint";
import { currentTurnRows, currentTurnText } from "./current-turn-text";
import { createEmitAdapter } from "./emit-adapter";
import { HostMirrorRuntime } from "./host-mirror-runtime";
import { injectProjectRuntimeEnv } from "./inject-project-env";
import { createPersist, publishStatus } from "./persist";
import { reportSandboxStartFailure } from "./report-sandbox-start-failure";
import { runBlueprintPath } from "./run-blueprint-path";
import { shouldRunBlueprintPath } from "./should-run-blueprint";
import type { AgentJobResult } from "./types";
import { runVerifyStep } from "./verify-step";

const log = createLogger("agent-job");
const MAX_VERIFY_ATTEMPTS = 2;
// A backstop above the loop's own deadline: that deadline is cooperative
// (checked between iterations), so it can't catch a single call that never
// returns. This can, because it tears down the sandbox from the outside.
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
    select: { credits: true, plan: true },
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

  const sessionModel = resolveModelForPlan(user.plan, session.model);
  await prisma.session.update({ where: { id: session.id }, data: { status: "RUNNING" } });
  publishStatus(session.id, "RUNNING", "Analyzing request…");

  const worktreeDir = sessionWorktreePath(job.projectId, job.sessionId);
  const controller = new AbortController();
  const sandboxStartedAt = Date.now();

  const sandbox = await sandboxProvider
    .create({
      projectId: job.projectId,
      workspaceDir: worktreeDir,
      maxWallClockMs: AGENT_LOOP_LIMITS.wallClockCapMs,
      onWallClockExceeded: () => controller.abort(),
    })
    .catch((error: unknown) =>
      reportSandboxStartFailure({ jobId: job.id, sessionId: session.id, error, persist }),
    );
  if (!sandbox) {
    return { jobId: job.id, sessionId: job.sessionId, stopReason: "fatalError" };
  }
  log.info("job sandbox attached", {
    jobId: job.id,
    sessionId: session.id,
    projectId: job.projectId,
    sandboxId: sandbox.id,
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
    if (job.retryCount > 0) {
      const restored = await restoreWorkspace(sandbox, {
        remoteUrl: process.env.CHECKPOINT_REMOTE_URL,
      });
      log.info("recovered requeued job", { jobId: job.id, sessionId: session.id, outcome: restored });
    }
    const runtime = new HostMirrorRuntime(
      new SandboxRuntime(sandbox),
      job.projectId,
      job.sessionId,
    );
    await injectProjectRuntimeEnv({
      projectId: job.projectId,
      sessionId: job.sessionId,
      runtime,
    });
    const chosenTheme = chosenThemeFromRows(priorRows);
    if (chosenTheme) {
      const themed = await applyTheme(runtime, chosenTheme);
      log.info("applied chosen theme", { sessionId: session.id, theme: chosenTheme.id, written: themed });
    }
    const effectiveRows = await withSelectionApplied(priorRows, worktreeDir);
    const systemPrompt = await buildSystemPrompt(runtime);
    const systemMessage: CoreMessage = { role: "user", type: "text", content: systemPrompt };
    const messages: CoreMessage[] = [systemMessage, ...effectiveRows.map(toCoreMessage)];

    const { emit } = createEmitAdapter({ sessionId: session.id, userId, persist });

    let verificationPassed = false;
    let verifyGaveUp = false;

    const decisionResult = await classify(
      currentTurnText(effectiveRows),
      provider ?? new OpenAiProvider({ model: plannerModel(user.plan) }),
    );
    const planInDetail = shouldRunBlueprintPath(
      chosenThemeFromRows(currentTurnRows(priorRows)),
      decisionResult,
    );

    if (planInDetail) {
      stopReason = await runBlueprintPath({
        prompt: currentTurnText(effectiveRows),
        projectId: job.projectId,
        sessionId: session.id,
        model: sessionModel,
        credits: user.credits,
        userId,
        userPlan: user.plan,
        theme: chosenTheme,
        runtime,
        signal: controller.signal,
        persist,
        approvedBlueprintId: approvedBlueprintIdFromRows(currentTurnRows(priorRows)),
      });

      if (stopReason === "completed") {
        await runtime.flush();
        const verify = await runVerifyStep({
          sessionId: session.id,
          worktreeDir,
          maxAttempts: MAX_VERIFY_ATTEMPTS,
          history: [],
        });

        if (verify.passed) {
          verificationPassed = true;
          const missingAssets = await loadMissingAssetsNotice(session.id);
          if (missingAssets) {
            await persist({ role: "assistant", type: "text", content: missingAssets });
          }
        } else {
          verifyGaveUp = true;
          stopReason = "fatalError";
          await persist({
            role: "assistant",
            type: "text",
            content: "❌ Built the plan, but verification found real errors. Giving up.",
            data: { stopReason: "fatalError", verification: verify.results },
          });
        }
      }
    } else {
      const verifyHistory: VerifyOutcome[] = [];

      for (let attempt = 0; attempt <= MAX_VERIFY_ATTEMPTS; attempt++) {
        stopReason = await runAgentLoop({
          messages,
          tools: ALL_TOOLS,
          provider: provider ?? new OpenAiProvider({ model: sessionModel }),
          runtime,
          emit,
          budget: {
            maxIterations: AGENT_LOOP_LIMITS.maxIterations,
            ...loopSpendLimits(user.credits),
            deadline: Date.now() + AGENT_LOOP_LIMITS.loopDeadlineMs,
          },
          signal: controller.signal,
          sessionId: session.id,
        });

        if (stopReason !== "completed") break;

        await runtime.flush();
        const verify = await runVerifyStep({
          sessionId: session.id,
          worktreeDir,
          maxAttempts: MAX_VERIFY_ATTEMPTS,
          history: verifyHistory,
        });

        if (verify.passed) {
          verificationPassed = true;
          break;
        }

        if (!verify.shouldRetry) {
          verifyGaveUp = true;
          stopReason = "fatalError";
          await persist({
            role: "assistant",
            type: "text",
            content: verify.stuck
              ? "❌ Verification failed with the same error as the last attempt — retrying wouldn't help. Giving up."
              : `❌ Verification still failing after ${MAX_VERIFY_ATTEMPTS} attempts. Giving up.`,
            data: { stopReason: "fatalError", verification: verify.results },
          });
          break;
        }

        messages.push({
          role: "user",
          type: "text",
          content: `Running verification checks on your changes found real errors — fix them, then\nstop. Do not describe the fix, make it with edit_file/write_file.\n\n${verify.outputText}`,
        });
        await persist({ role: "user", type: "text", content: `Verification failed, retrying:\n${verify.outputText}` });
      }
    }

    if (verificationPassed && isBrowserCheckEnabled()) {
      await runBrowserCheckStep({
        projectId: job.projectId,
        sessionId: session.id,
        worktreeDir,
        persist,
      });
    }

    if (stopReason !== "completed" && !verifyGaveUp) {
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
      try {
        const triggeringPrompt = priorRows.at(-1)?.content ?? "";
        await checkpointSession(sandbox, triggeringPrompt);

        if (verificationPassed) {
          const merge = await autoMergeSession(job.projectId, session.id);
          await persist({
            role: "assistant",
            type: "text",
            content: merge.merged
              ? "✅ Verified (typecheck + lint passed) and merged to main."
              : merge.conflict
                ? `⚠️ Verification passed, but the merge to main hit a conflict: ${merge.message}. Resolve it in the Diff tab.`
                : `⚠️ Verification passed, but merging to main failed: ${merge.message}. Try Merge in the Diff tab.`,
            data: { merge },
          });
        }
      } catch (err) {
        log.warn("post-run checkpoint failed", {
          jobId: job.id,
          sessionId: session.id,
          stopReason,
          err: err instanceof Error ? err.message : String(err),
        });
      }
    }

    await prisma.session.update({
      where: { id: session.id },
      data: { status: stopReason === "fatalError" ? "ERROR" : "IDLE" },
    });
  } catch (err) {
    if (controller.signal.aborted) {
      stopReason = "cancelled";
      const notice = resolveStopNotice("cancelled");
      await prisma.session.update({ where: { id: session.id }, data: { status: "IDLE" } });
      await persist({
        role: "assistant",
        type: "text",
        content: notice.content,
        data: { stopReason: "cancelled" },
      });
    } else {
      stopReason = "fatalError";
      const message = err instanceof Error ? err.message : String(err);
      const providerCreditsDepleted = isProviderCreditsDepleted(message);
      log.error("job run failed", {
        jobId: job.id,
        sessionId: session.id,
        model: session.model,
        provider: providerFor(session.model),
        providerCreditsDepleted,
        message,
      });
      await prisma.session.update({ where: { id: session.id }, data: { status: "ERROR" } });
      await persist({
        role: "assistant",
        type: "text",
        content: providerCreditsDepleted
          ? PROVIDER_CREDITS_DEPLETED_NOTICE
          : `Something went wrong and the run stopped: ${message}`,
      });
    }
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
