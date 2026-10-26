import type { PlanIssue } from "../shared";
import type { ArchitectureDecision, CapabilityChoice } from "./types";

// D24/D9 — every capability choice names the npm packages it needs, so a
// plan-time check can reject a choice that would fail later at bash-exec
// time (deps.allow.json), instead of failing deep into a run.
const PACKAGES_BY_CHOICE: Record<CapabilityChoice, readonly string[]> = {
  websockets: ["ws"],
  razorpay: [],
  "local-uploads": [],
  "mongodb-text-index": [],
};

export function validateArchitectureDecisions(
  decisions: readonly ArchitectureDecision[],
  allowedPackages: readonly string[],
): PlanIssue[] {
  const allowed = new Set(allowedPackages);
  return decisions.flatMap((decision) => {
    const required = PACKAGES_BY_CHOICE[decision.choice];
    const notAllowed = required.filter((pkg) => !allowed.has(pkg));
    return notAllowed.map((pkg) => ({
      code: "package_not_allowed",
      message: `Architecture decision "${decision.capability}: ${decision.choice}" needs "${pkg}", which is not in deps.allow.json`,
    }));
  });
}
