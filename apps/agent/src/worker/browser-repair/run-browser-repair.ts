import type { VisualIssue } from "@repo/agent-core";
import type { BrowserCheckResult, BrowserRecheck } from "@repo/browser";
import { formatSkills } from "@repo/ui-system";
import { loadSkills } from "@repo/ui-system/server";
import type { PersistFields } from "../persist";
import { blockingFindings, describeRemaining, formatRepairPrompt, planRepair } from "./plan-repair";

export type BrowserRepairOutcome = "not-needed" | "fixed" | "still-failing" | "repair-failed" | "recheck-unavailable";

export interface BrowserRepairParams {
  readonly check: BrowserCheckResult | undefined;
  readonly issues: readonly VisualIssue[];
  readonly changedPaths: readonly string[];
  readonly extraMustFix?: readonly string[];
  readonly runRepairTurn: (prompt: string) => Promise<boolean>;
  readonly recheck: (scope: BrowserRecheck) => Promise<BrowserCheckResult | undefined>;
  readonly persist: (fields: PersistFields) => Promise<unknown>;
}

async function repairSkill(): Promise<string> {
  return formatSkills(await loadSkills(["visual-quality-review"])).text;
}

export async function runBrowserRepair(params: BrowserRepairParams): Promise<BrowserRepairOutcome> {
  const { check, issues, changedPaths, extraMustFix, runRepairTurn, recheck, persist } = params;
  if (!check || check.status !== "checked") return "not-needed";
  const plan = planRepair(check.report.findings, issues);
  if (!plan) return "not-needed";
  const prompt = formatRepairPrompt(plan, {
    skill: await repairSkill(),
    changedPaths,
    ...(extraMustFix && extraMustFix.length > 0 ? { extraMustFix } : {}),
  });
  await persist({ role: "user", type: "text", content: prompt, data: { verificationRetry: true, browserRepair: true } });
  if (!(await runRepairTurn(prompt))) {
    await persist({ role: "assistant", type: "text", content: "❌ The browser repair attempt did not pass typecheck and build, so the problems above remain." });
    return "repair-failed";
  }
  const after = await recheck(plan.recheck);
  if (!after || after.status !== "checked") return "recheck-unavailable";
  const remaining = blockingFindings(after.report.findings);
  const visualNote = plan.issues.length > 0 ? " Visual review issues were fixed by the agent but not re-reviewed." : "";
  if (remaining.length > 0) {
    await persist({ role: "assistant", type: "text", content: `❌ ${remaining.length} browser problem(s) remain after one repair attempt: ${describeRemaining(remaining)}.${visualNote}` });
    return "still-failing";
  }
  await persist({ role: "assistant", type: "text", content: `✅ The recheck found no blocking browser problems.${visualNote}` });
  return "fixed";
}
