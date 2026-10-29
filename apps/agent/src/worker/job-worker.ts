import {
  buildSystemPrompt,
  formatProjectMemory,
  isProviderCreditsDepleted,
  OpenAiProvider,
  plannerModel,
  PROVIDER_CREDITS_DEPLETED_NOTICE,
  providerFor,
  resolveModelForPlan,
  resolveStopNotice,
  runAgentLoop,
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
import { AGENT_LOOP_LIMITS, loopSpendLimits, type Attachment, type VerificationResult } from "@repo/contracts";
import { loadProjectMemoryRows, prisma, type Job } from "@repo/db";
import { classify, type VerifyOutcome } from "@repo/decision-engine";
import { createLogger } from "@repo/logger";
import { SandboxRuntime, type SandboxProvider } from "@repo/sandbox";
import { ALL_TOOLS, guardTools } from "@repo/tools";
import { sessionWorktreePath, worktreeSessionIdOf } from "@repo/workspace";
import { restoreWorkspace } from "../recovery";
import { answersFromRows } from "./answers-from-rows";
import { withSelectionApplied } from "./apply-selection";
import { approvedBlueprintIdFromRows } from "./approved-blueprint-id";
import { autoMergeSession } from "./auto-merge-session";
import { checkpointSession } from "./checkpoint";
import { currentTurnRows, currentTurnText } from "./current-turn-text";
import { createEmitAdapter } from "./emit-adapter";
import { hintMessageForTurn } from "./error-hints";
import { historyMessages } from "./history";
import { HostMirrorRuntime } from "./host-mirror-runtime";
import { isAutoImageChoice } from "./image-choice";
import { injectProjectRuntimeEnv } from "./inject-project-env";
import { createJobInteractiveTools } from "./interactive-tools";
import { createPersist, publishStatus } from "./persist";
import { recordTurnCommit } from "./record-turn-commit";
import { reportSandboxStartFailure } from "./report-sandbox-start-failure";
import { runBlueprintPath } from "./run-blueprint-path";
import { shouldRunBlueprintPath } from "./should-run-blueprint";
import { freshStoredAnalysis } from "./stored-analysis";
import type { AgentJobResult } from "./types";
import { runHandoffAgent } from "./handoff-agent";
import { reviewAfterVerification } from "./testing-agent";
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

  const worktreeSessionId = worktreeSessionIdOf(session);
  const worktreeDir = sessionWorktreePath(job.projectId, worktreeSessionId);
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
      worktreeSessionId,
    );
    await injectProjectRuntimeEnv({
      projectId: job.projectId,
      worktreeSessionId,
      runtime,
    });
    const chosenTheme = chosenThemeFromRows(priorRows);
    if (chosenTheme) {
      const themed = await applyTheme(runtime, chosenTheme);
      log.info("applied chosen theme", { sessionId: session.id, theme: chosenTheme.id, written: themed });
    }
    const [effectiveRows, memoryRows] = await Promise.all([
      withSelectionApplied(priorRows, worktreeDir),
      loadProjectMemoryRows(job.projectId),
    ]);
    const memorySection = formatProjectMemory(memoryRows);
    log.info("project memory assembled", { sessionId: session.id, memoryBytes: Buffer.byteLength(memorySection, "utf8") });
    const systemPrompt = await buildSystemPrompt(runtime, { memorySection });
    const systemMessage: CoreMessage = { role: "user", type: "text", content: systemPrompt };
    const messages: CoreMessage[] = [systemMessage, ...historyMessages(effectiveRows)];

    const { emit } = createEmitAdapter({ sessionId: session.id, userId, persist });

    let verificationPassed = false;
    let verifyGaveUp = false;
    let verifyResults: VerificationResult[] = [];

    const turnRows = currentTurnRows(priorRows);
    const approvedBlueprintId = approvedBlueprintIdFromRows(turnRows);
    const storedAnalysis = await freshStoredAnalysis(job.analysis, turnRows);
    log.info("routing analysis", { sessionId: session.id, reused: storedAnalysis !== undefined });
    const planInDetail = await shouldRunBlueprintPath(
      { theme: chosenThemeFromRows(turnRows), approvedBlueprintId, analysis: storedAnalysis },
      () =>
        classify(
          currentTurnText(effectiveRows),
          provider ?? new OpenAiProvider({ model: plannerModel(user.plan) }),
        ),
    );

    const userRow = turnRows.find((r) => r.role === "user");
    const turnAttachments = (userRow?.data as { attachments?: Attachment[] } | null | undefined)?.attachments;
    const blueprintOutcome = planInDetail
      ? await runBlueprintPath({
          prompt: currentTurnText(effectiveRows),
          attachments: turnAttachments,
          projectId: job.projectId,
          sessionId: session.id,
          worktreeSessionId,
          model: sessionModel,
          credits: user.credits,
          userId,
          userPlan: user.plan,
          theme: chosenTheme,
          runtime,
          signal: controller.signal,
          persist,
          approvedBlueprintId,
          isAutoImageChoice: isAutoImageChoice(turnRows),
          answers: answersFromRows(turnRows),
        })
      : undefined;

    if (blueprintOutcome?.kind === "ran") {
      stopReason = blueprintOutcome.stopReason;
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
          verifyResults = verify.results;
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
      if (blueprintOutcome?.kind === "single-pass") {
        messages.push({ role: "user", type: "text", content: blueprintOutcome.brief });
      }
      const errorHints = await hintMessageForTurn(currentTurnText(effectiveRows), worktreeDir);
      if (errorHints.skipped.length > 0) log.info("error hints skipped", { sessionId: session.id, skipped: errorHints.skipped });
      if (errorHints.message) messages.push({ role: "user", type: "text", content: errorHints.message });
      const verifyHistory: VerifyOutcome[] = [];

      for (let attempt = 0; attempt <= MAX_VERIFY_ATTEMPTS; attempt++) {
        const deadlineAt = Date.now() + AGENT_LOOP_LIMITS.loopDeadlineMs;
        const interactiveTools = createJobInteractiveTools({
          projectId: job.projectId,
          sessionId: session.id,
          worktreeSessionId,
          signal: controller.signal,
          deadlineAt,
          persist,
        });
        const guard = guardTools([...ALL_TOOLS, ...interactiveTools]);
        stopReason = await runAgentLoop({
          messages,
          tools: guard.tools,
          provider: provider ?? new OpenAiProvider({ model: sessionModel }),
          runtime,
          emit,
          budget: {
            maxIterations: AGENT_LOOP_LIMITS.maxIterations,
            ...loopSpendLimits(user.credits),
            deadline: deadlineAt,
          },
          signal: controller.signal,
          sessionId: session.id,
        });
        log.info("run guard stats", { sessionId: session.id, attempt, ...guard.stats() });

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
          verifyResults = verify.results;
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
        await persist({
          role: "user",
          type: "text",
          content: `Verification failed, retrying:\n${verify.outputText}`,
          data: { verificationRetry: true },
        });
      }
    }

    if (verificationPassed) {
      const review = await reviewAfterVerification({
        projectId: job.projectId,
        sessionId: session.id,
        userId,
        worktreeDir,
        verifyResults,
        sessionModel,
        ...(provider ? { provider } : {}),
        runtime,
        emit,
        signal: controller.signal,
        persist,
        messages,
      });
      if (review.passed) {
        await runHandoffAgent({
          sessionId: session.id,
          sessionModel,
          worktreeDir,
          memory: memorySection,
          verifyResults,
          testingNotes: review.notes,
          ...(provider ? { provider } : {}),
          runtime,
          emit,
          signal: controller.signal,
          persist,
        });
      }
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

    const triggeringPrompt = priorRows.at(-1)?.content ?? "";
    await runtime.flush();
    const turnCommit = await recordTurnCommit({ sessionId: session.id, worktreeDir, prompt: triggeringPrompt });
    log.info("turn commit", { sessionId: session.id, ...turnCommit });

    if (stopReason !== "fatalError") {
      try {
        await checkpointSession(sandbox, triggeringPrompt);

        if (verificationPassed) {
          const merge = await autoMergeSession(
            job.projectId,
            worktreeSessionId,
          );
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
