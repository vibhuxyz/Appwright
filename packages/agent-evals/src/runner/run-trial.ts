import path from "node:path";
import {
  LocalRuntime,
  buildSystemPrompt,
  runAgentLoop,
  type Provider,
} from "@repo/agent-core";
import { ALL_TOOLS } from "@repo/tools";
import {
  MAX_COST_USD,
  MAX_ITERATIONS,
  MAX_TOKENS,
  RUN_DEADLINE_MS,
} from "../core/constants";
import type { EvalCase, RunTrace, TrialResult } from "../core/types";
import { createWorkspace } from "../workspace";
import { createTraceCollector } from "./collect-trace";

export interface RunTrialParams {
  readonly evalCase: EvalCase;
  readonly trial: number;
  readonly provider: Provider;
  readonly templatesRoot: string;
  readonly workspacesRoot: string;
  readonly now: () => number;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export async function runTrial(params: RunTrialParams): Promise<TrialResult> {
  const { evalCase, trial, provider, now } = params;
  const workspace = await createWorkspace({
    templateDir: path.join(params.templatesRoot, evalCase.template),
    workspacesRoot: params.workspacesRoot,
    projectId: `eval-${evalCase.id}-${trial}-${now()}`,
  });
  const startedAt = now();
  try {
    const runtime = new LocalRuntime(workspace.projectId);
    const systemPrompt = await buildSystemPrompt(runtime);
    const collector = createTraceCollector();
    const stopReason = await runAgentLoop({
      messages: [{ role: "user", type: "text", content: `${systemPrompt}\n\n---\n\n${evalCase.prompt}` }],
      tools: ALL_TOOLS,
      provider,
      runtime,
      emit: collector.sink,
      budget: {
        maxIterations: MAX_ITERATIONS,
        maxTokens: MAX_TOKENS,
        maxCostUsd: MAX_COST_USD,
        deadline: startedAt + RUN_DEADLINE_MS,
      },
      signal: new AbortController().signal,
      sessionId: crypto.randomUUID(),
    });
    const trace: RunTrace = {
      stopReason,
      toolCalls: collector.toolCalls(),
      events: collector.events,
      finalText: collector.finalText(),
      costUsd: collector.costUsd(),
      durationMs: now() - startedAt,
      workspaceDir: workspace.directory,
      runtime,
    };
    const grades = await Promise.all(evalCase.graders.map((grader) => grader(trace)));
    return {
      caseId: evalCase.id,
      trial,
      passed: grades.every((grade) => grade.passed),
      grades,
      stopReason,
      toolCallCount: trace.toolCalls.length,
      costUsd: trace.costUsd,
      durationMs: trace.durationMs,
    };
  } catch (error) {
    return {
      caseId: evalCase.id,
      trial,
      passed: false,
      grades: [],
      stopReason: "fatalError",
      toolCallCount: 0,
      costUsd: 0,
      durationMs: now() - startedAt,
      crash: errorMessage(error),
    };
  } finally {
    await workspace.dispose();
  }
}
