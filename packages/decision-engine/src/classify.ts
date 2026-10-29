import type { Provider } from "@repo/agent-core";
import {
  ComponentSchema,
  DecisionSchema,
  type Decision,
  type DecisionResult,
} from "./types";

// Built from the schema, not hand-typed, so the prompt can't drift from what
// ComponentSchema will actually accept (D10's "one definition" argument).
const COMPONENT_OPTIONS = ComponentSchema.options
  .map((name) => `"${name}"`)
  .join("|");

export const CLASSIFY_INSTRUCTIONS = `Classify the user's request below. Use intent "chat" when the message is a greeting, small talk, a thank-you, or a question that needs no change to the project (for example "hi", "hy how are you", "what can you do?"). Use "create" only when the user asks for a new app or site to be built. Reply with ONLY a JSON object, no prose, matching:
{"intent": "chat"|"create"|"modify"|"debug"|"delete"|"test"|"unknown",
 "changeType": "style"|"text"|"component"|"api"|"database"|"config"|"unknown",
 "risk": "low"|"medium"|"high",
 "route": "frontend"|"backend"|"database"|"devops"|"none" ("none" = a simple, self-contained text/style/prop tweak that needs no reasoning about a broader system, even if the file happens to live in a frontend or backend directory — otherwise the layer the change actually requires understanding),
 "component": ${COMPONENT_OPTIONS} (the existing UI primitive this request most directly targets — never a name outside this list; use "none" if no single primitive applies, e.g. backend work or a change spanning many components),
 "complexity": number 0-10 (0 = trivial one-line edit, 10 = major cross-cutting change),
 "ambiguity": number 0-10 (0 = fully specified, 10 = no actionable detail),
 "confidence": number between 0 and 1}`;

// The placeholder Decision carried by a non-"accepted" DecisionResult.
// Never read directly for policy — resolvePolicy() checks `status` first
// and short-circuits to "review" before these fields matter at all. This
// used to be the sole fallback signal (confidence: 0 coincidentally forcing
// review); status is now the explicit fail-closed signal instead.
export const UNKNOWN_DECISION: Decision = {
  intent: "unknown",
  changeType: "unknown",
  risk: "medium",
  route: "none",
  component: "none",
  complexity: 5,
  ambiguity: 10,
  confidence: 0,
};

// Falls open on any classification failure — this signal is observational
// (docs/versions/V1_2_DECISION_ENGINE.md), never a hard dependency of the
// agent turn it's describing. Same reasoning as the Redis rate limiter
// failing open rather than blocking login over an auxiliary dependency.
// "Falls open" means classify() always resolves, never throws — resolvePolicy()
// is what actually closes the gate to "review" on a non-"accepted" status.
export const CLASSIFY_TIMEOUT_MS = 10_000;

export async function classify(
  message: string,
  provider: Provider,
  signal: AbortSignal = AbortSignal.timeout(CLASSIFY_TIMEOUT_MS),
): Promise<DecisionResult> {
  const { result } = await readDecision(`${CLASSIFY_INSTRUCTIONS}\n\nRequest:\n${message}`, provider, signal);
  return result;
}

export interface DecisionReading {
  result: DecisionResult;
  json: unknown;
}

async function streamText(content: string, provider: Provider, signal: AbortSignal): Promise<string> {
  let text = "";
  for await (const chunk of provider.stream([{ role: "user", type: "text", content }], [], { signal })) {
    if (chunk.type === "text_delta") text += chunk.delta;
  }
  return text;
}

function parseJson(text: string): unknown {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return undefined;
  try {
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    if (error instanceof SyntaxError) return undefined;
    throw error;
  }
}

export async function readDecision(
  content: string,
  provider: Provider,
  signal: AbortSignal,
): Promise<DecisionReading> {
  let text: string;
  try {
    text = await streamText(content, provider, signal);
  } catch (error) {
    return {
      result: {
        status: "provider_error",
        decision: UNKNOWN_DECISION,
        errorMessage: error instanceof Error ? error.message : String(error),
      },
      json: undefined,
    };
  }
  const json = parseJson(text);
  const parsed = DecisionSchema.safeParse(json);
  if (!parsed.success) return { result: { status: "invalid", decision: UNKNOWN_DECISION }, json };
  if (parsed.data.confidence < 0.5) return { result: { status: "low_confidence", decision: parsed.data }, json };
  return { result: { status: "accepted", decision: parsed.data }, json };
}
