import { IntentSchema, type Intent } from "@repo/contracts";
import type { PlanResult } from "../shared";

export type IntentClassifier = (
  prompt: string,
  signal: AbortSignal,
) => Promise<unknown>;

export function parseIntent(raw: unknown): PlanResult<Intent> {
  const parsed = IntentSchema.safeParse(raw);
  if (parsed.success) return { ok: true, value: parsed.data };
  return {
    ok: false,
    issues: parsed.error.issues.map((issue) => ({
      code: "INVALID_INTENT",
      message: `Intent field "${issue.path.join(".")}": ${issue.message}`,
    })),
  };
}

export async function classifyIntent(
  classifier: IntentClassifier,
  prompt: string,
  signal: AbortSignal,
): Promise<PlanResult<Intent>> {
  if (prompt.trim().length === 0) {
    return {
      ok: false,
      issues: [{ code: "EMPTY_PROMPT", message: "Cannot classify an empty prompt" }],
    };
  }
  return parseIntent(await classifier(prompt, signal));
}
