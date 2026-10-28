import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { OpenAiProvider } from "@repo/agent-core";
import { runBuild } from "@repo/verify";
import { MeteredProvider, SpendLedger } from "../budget";
import { captureSite } from "../capture";
import { cloneTemplate } from "../paths";
import { MAX_GENERATION_COST_USD, MAX_TOTAL_COST_USD, SITE_MODEL, SITE_TEMPLATE, SMOKE_PROMPT } from "../constants";
import { assertIsolatedDatabase, assertModelKey } from "./guards";

export interface SmokeResult {
  readonly modelReplied: string;
  readonly usageReported: boolean;
  readonly smokeCostUsd: number;
  readonly captured: { readonly shots: number; readonly findings: number };
}

async function callModel(ledger: SpendLedger): Promise<string> {
  ledger.beginGeneration("smoke");
  const provider = new MeteredProvider(new OpenAiProvider({ model: SITE_MODEL }), ledger);
  const messages = [{ role: "user" as const, type: "text" as const, content: SMOKE_PROMPT }];
  let text = "";
  for await (const chunk of provider.stream(messages, [], { signal: AbortSignal.timeout(60_000) })) {
    if (chunk.type === "text_delta") text += chunk.delta;
  }
  return text.trim();
}

async function captureTemplate(templatesRoot: string, shotsDir: string): Promise<SmokeResult["captured"]> {
  const templateDir = path.join(templatesRoot, SITE_TEMPLATE);
  const workspaceDir = await mkdtemp(path.join(tmpdir(), "appwright-site-smoke-"));
  try {
    await cloneTemplate(templateDir, workspaceDir);
    const build = await runBuild(workspaceDir);
    if (!build.ok) throw new Error(`Template build failed: ${JSON.stringify(build.errors).slice(0, 600)}`);
    const capture = await captureSite({ workspaceDir, shotsDir });
    return { shots: capture.shots.length, findings: capture.findings.length };
  } finally {
    await rm(workspaceDir, { recursive: true, force: true });
  }
}

export async function runSmoke(options: { templatesRoot: string; resultsRoot: string }): Promise<SmokeResult> {
  assertIsolatedDatabase(process.env);
  assertModelKey(process.env);
  const ledger = new SpendLedger({ generationUsd: MAX_GENERATION_COST_USD, totalUsd: MAX_TOTAL_COST_USD });
  const modelReplied = await callModel(ledger);
  const entries = ledger.entries();
  const usageReported = entries.length > 0 && entries.every((entry) => entry.inputTokens > 0);
  if (!usageReported) throw new Error(`Model ${SITE_MODEL} reported no token usage, so spend caps cannot be enforced`);
  const captured = await captureTemplate(options.templatesRoot, path.join(options.resultsRoot, "smoke-shots"));
  return { modelReplied, usageReported, smokeCostUsd: ledger.totalSpentUsd(), captured };
}
