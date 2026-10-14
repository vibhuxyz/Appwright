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

const PROMPT = `Classify the user's request below. Reply with ONLY a JSON object, no prose, matching:
{"intent": "create"|"modify"|"debug"|"delete"|"test"|"unknown",
 "changeType": "style"|"text"|"component"|"api"|"database"|"config"|"unknown",
 "risk": "low"|"medium"|"high",
 "route": "frontend"|"backend"|"database"|"devops"|"none" ("none" = a simple, self-contained text/style/prop tweak that needs no reasoning about a broader system, even if the file happens to live in a frontend or backend directory — otherwise the layer the change actually requires understanding),
 "component": ${COMPONENT_OPTIONS} (the existing UI primitive this request most directly targets — never a name outside this list; use "none" if no single primitive applies, e.g. backend work or a change spanning many components),
 "complexity": number 0-10 (0 = trivial one-line edit, 10 = major cross-cutting change),
 "ambiguity": number 0-10 (0 = fully specified, 10 = no actionable detail),
 "confidence": number between 0 and 1}

Request:
`;

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
export async function classify(
  message: string,
  provider: Provider,
): Promise<DecisionResult> {
  let text = "";
  const controller = new AbortController();
  try {
    for await (const chunk of provider.stream(
      [{ role: "user", type: "text", content: `${PROMPT}${message}` }],
      [],
      { signal: controller.signal },
    )) {
      if (chunk.type === "text_delta") text += chunk.delta;
    }
  } catch {
    return { status: "provider_error", decision: UNKNOWN_DECISION };
  }

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return { status: "invalid", decision: UNKNOWN_DECISION };

  try {
    const parsed = DecisionSchema.safeParse(JSON.parse(jsonMatch[0]));
    if (!parsed.success) return { status: "invalid", decision: UNKNOWN_DECISION };
    if (parsed.data.confidence < 0.5) {
      return { status: "low_confidence", decision: parsed.data };
    }
    return { status: "accepted", decision: parsed.data };
  } catch {
    return { status: "invalid", decision: UNKNOWN_DECISION };
  }
}

