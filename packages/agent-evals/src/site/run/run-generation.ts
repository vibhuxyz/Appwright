import path from "node:path";
import { OpenAiProvider, priceFor, type Message, type Provider } from "@repo/agent-core";
import type { Plan } from "@repo/planner";
import { runBuild, runTsc } from "@repo/verify";
import { BudgetExceededError, MeteredProvider, type SpendLedger } from "../budget";
import { AppFailedError, captureSite, findMissingImports, readWorkspaceSource } from "../capture";
import { MAX_GENERATION_COST_USD } from "../constants";
import { GROUP_CONFIGS } from "../groups";
import { prepareWorkspace, runSinglePassPath, runTaskPath, type PathOutcome } from "../paths";
import type { SiteBrief, SiteGroup } from "../types";
import type { FailureKind, GenerationResult, PromptRecord } from "./result-types";
import { writeGenerationResult } from "./write-result";

const PROMPT_ROLES = new Set(["user", "system"]);
const MAX_PROMPT_MESSAGES_SCANNED = 3;
const EMPTY_OUTCOME: PathOutcome = {
  stopReason: "not-run",
  toolCalls: [],
  errors: [],
  deliveredFiles: [],
  deliverySkipped: [],
};

export interface RunGenerationInput {
  readonly runId: string;
  readonly model: string;
  readonly group: SiteGroup;
  readonly brief: SiteBrief;
  readonly plan: Plan;
  readonly ledger: SpendLedger;
  readonly outputDir: string;
  readonly templatesRoot: string;
  readonly workspacesRoot: string;
  readonly signal: AbortSignal;
}

function collectPrompts(into: Map<string, PromptRecord>): (messages: Message[]) => void {
  return (messages) => {
    for (const message of messages.slice(0, MAX_PROMPT_MESSAGES_SCANNED)) {
      if (message.type !== "text" || !PROMPT_ROLES.has(message.role)) continue;
      if (!into.has(message.content)) into.set(message.content, { role: message.role, text: message.content });
    }
  };
}

function failureOf(error: unknown): { kind: FailureKind; message: string } {
  const message = error instanceof Error ? error.message : String(error);
  return { kind: error instanceof BudgetExceededError ? "budget" : error instanceof AppFailedError ? "app-failed" : "generation", message };
}

async function runPath(input: RunGenerationInput, context: Parameters<typeof runTaskPath>[0]): Promise<PathOutcome> {
  const config = GROUP_CONFIGS[input.group];
  return config.pipeline === "task" ? runTaskPath(context) : runSinglePassPath(context, config, input.brief.prompt);
}

export async function runGeneration(input: RunGenerationInput): Promise<GenerationResult> {
  const { runId, model, group, brief, plan, ledger } = input;
  const label = `${group}-${brief.id}`;
  const startedAt = Date.now();
  ledger.beginGeneration(label);
  const workspace = await prepareWorkspace({ templatesRoot: input.templatesRoot, workspacesRoot: input.workspacesRoot, briefId: brief.id, group, runId });
  const prompts = new Map<string, PromptRecord>();
  const provider = new MeteredProvider(new OpenAiProvider({ model }), ledger, collectPrompts(prompts));
  let failure: GenerationResult["failure"];
  let outcome = EMPTY_OUTCOME;
  try {
    outcome = await runPath(input, {
      plan,
      projectId: workspace.projectId,
      workspaceDir: workspace.directory,
      runtime: workspace.runtime,
      provider,
      signal: input.signal,
      generationCapUsd: MAX_GENERATION_COST_USD,
    });
    if (outcome.stopReason !== "completed") failure = { kind: "generation", message: `Generation stopped: ${outcome.stopReason}` };
  } catch (error) {
    failure = failureOf(error);
  }
  const tsc = [await runTsc(workspace.directory)];
  const build = await runBuild(workspace.directory);
  if (!failure && !build.ok) failure = { kind: "app-failed", message: `next build failed: ${JSON.stringify(build.errors).slice(0, 600)}` };
  const source = await readWorkspaceSource(workspace.directory);
  const missingImports = findMissingImports(source.files);
  if (!failure && missingImports.length > 0) {
    failure = { kind: "missing-imports", message: `${missingImports.length} import(s) point at files that do not exist` };
  }
  const directory = path.join(input.outputDir, label);
  const capture = failure?.kind === "missing-imports" || failure?.kind === "budget" || !build.ok ? undefined : await captureSite({ workspaceDir: workspace.directory, shotsDir: path.join(directory, "shots") }).catch((error: unknown) => {
    if (error instanceof AppFailedError) {
      failure ??= failureOf(error);
      return undefined;
    }
    throw error;
  });
  const entries = ledger.entriesFor(label);
  const price = priceFor(model);
  const result: GenerationResult = {
    runId,
    label,
    briefId: brief.id,
    config: GROUP_CONFIGS[group],
    model: { id: model, usdPerMillionInput: price.in, usdPerMillionOutput: price.out },
    status: failure ? "failed" : "succeeded",
    ...(failure ? { failure } : {}),
    costUsd: ledger.generationSpentUsd(),
    tokens: {
      input: entries.reduce((sum, entry) => sum + entry.inputTokens, 0),
      output: entries.reduce((sum, entry) => sum + entry.outputTokens, 0),
      cachedInput: entries.reduce((sum, entry) => sum + entry.cachedInputTokens, 0),
      calls: entries.length,
    },
    durationMs: Date.now() - startedAt,
    path: outcome,
    tsc,
    build,
    missingImports,
    shots: capture?.shots ?? [],
    findings: capture?.findings ?? [],
    spend: entries,
    sourceFileCount: source.files.size,
    prompts: [...prompts.values()],
    transportRetries: provider.transportEvents,
  };
  await writeGenerationResult({ directory, result, sources: source.files });
  await workspace.dispose();
  return result;
}
