import { registry } from "@repo/ui-system";
import { z } from "zod";

// Fixed fields, not an extensible question registry — a registry earns its
// keep once a second classifier needs one (docs/versions/V1_2_DECISION_ENGINE.md).
export const IntentSchema = z.enum([
  "create",
  "modify",
  "debug",
  "delete",
  "test",
  "unknown",
]);

export const ChangeTypeSchema = z.enum([
  "style",
  "text",
  "component",
  "api",
  "database",
  "config",
  "unknown",
]);

export const RiskSchema = z.enum(["low", "medium", "high"]);

// Where the change lives, not how it's executed — resolvePolicy() uses this
// to keep "direct" limited to changes that don't touch a real system layer.
// "route": "none" is the "change button color" case from the version doc:
// nothing to route to, safe to edit directly.
export const RouteSchema = z.enum([
  "frontend",
  "backend",
  "database",
  "devops",
  "none",
]);

// Grounded in @repo/ui-system's live registry, not a free-text guess — the
// model can only name one of today's actual primitives (or "none"). Same
// "never invent a name" discipline edit_file's exact-match guardrail applies
// to files (D16): a hallucinated component name fails the schema and falls
// open to "invalid", not through as a plausible-looking decision.
const COMPONENT_NAMES = Object.keys(registry) as [
  keyof typeof registry,
  ...(keyof typeof registry)[],
];
export const ComponentSchema = z.enum([...COMPONENT_NAMES, "none"]);

export const DecisionSchema = z.object({
  intent: IntentSchema,
  changeType: ChangeTypeSchema,
  risk: RiskSchema,
  route: RouteSchema,
  component: ComponentSchema,
  complexity: z.number().min(0).max(10),
  ambiguity: z.number().min(0).max(10),
  confidence: z.number().min(0).max(1),
});

export type Intent = z.infer<typeof IntentSchema>;
export type ChangeType = z.infer<typeof ChangeTypeSchema>;
export type Risk = z.infer<typeof RiskSchema>;
export type Route = z.infer<typeof RouteSchema>;
export type Component = z.infer<typeof ComponentSchema>;
export type Decision = z.infer<typeof DecisionSchema>;

// None of these branch execution yet — Slice 3 wires policy.mode into
// POST /conversation. For now this is still a richer log field.
// blocked is reserved for the one combination this slice treats as never
// safe to auto-run (deleting a database) rather than merely review-worthy.
export type ExecutionMode = "direct" | "tool" | "agent" | "review" | "blocked";

// Whether classify() actually got a usable answer out of the model.
// accepted:       the reply parsed, matched DecisionSchema, and the model was
//                 confident (>= 0.5) in it.
// low_confidence: the reply parsed and matched DecisionSchema, but the model
//                 itself scored it below 0.5 — a real decision, just not one
//                 to act on directly.
// invalid:        the reply had no JSON, or JSON that didn't match the schema.
// provider_error: the model call itself threw (network, API error, abort).
// resolvePolicy() checks this first and forces "review" on anything but
// "accepted" — a parse failure or low-confidence read must never quietly
// read as a real decision.
export type DecisionStatus =
  | "accepted"
  | "low_confidence"
  | "invalid"
  | "provider_error";

export interface DecisionResult {
  status: DecisionStatus;
  decision: Decision;
  // Only set when status is "provider_error" — the raw message classify()
  // caught before falling open, so a caller can log what actually broke
  // instead of just the fact that something did.
  errorMessage?: string;
}
