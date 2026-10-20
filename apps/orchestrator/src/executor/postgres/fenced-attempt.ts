import { createWriteFence } from "@repo/planner";
import type { AttemptInput, AttemptOutcome } from "../types";
import type { GeneratedAttempt, TaskGenerator } from "./types";

const MAX_VIOLATIONS_SHOWN = 5;

function findViolations(
  fence: ReturnType<typeof createWriteFence>,
  paths: readonly string[],
): string[] {
  return paths.flatMap((path) => {
    const decision = fence.check(path);
    return decision.allowed ? [] : [decision.reason];
  });
}

function describeViolations(violations: readonly string[]): string {
  const shown = violations.slice(0, MAX_VIOLATIONS_SHOWN).join("; ");
  const hidden = violations.length - MAX_VIOLATIONS_SHOWN;
  return hidden > 0 ? `${shown} (+${hidden} more)` : shown;
}

function enforceFence(
  generated: GeneratedAttempt,
  fence: ReturnType<typeof createWriteFence>,
): AttemptOutcome {
  const { writtenPaths, ...outcome } = generated;
  if (outcome.kind !== "completed") return outcome;
  const violations = findViolations(fence, writtenPaths ?? []);
  if (violations.length === 0) return outcome;
  return {
    kind: "failed",
    costCents: outcome.costCents,
    error: `Write fence violated: ${describeViolations(violations)}`,
  };
}

export async function runFencedAttempt(
  generator: TaskGenerator,
  input: AttemptInput,
): Promise<AttemptOutcome> {
  const fence = createWriteFence(input.task.owns);
  const generated = await generator.generate({ ...input, fence });
  return enforceFence(generated, fence);
}
