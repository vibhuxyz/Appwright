import type { Tool } from "@repo/agent-core";
import { ALLOWED_PACKAGES } from "@repo/contracts";
import { RunGuard } from "./run-guard";
import type { RunGuardStats } from "./types";

export type { RunGuardStats } from "./types";

export function guardTools(
  tools: readonly Tool[],
  allowedPackages: readonly string[] = ALLOWED_PACKAGES,
): { tools: Tool[]; stats: () => RunGuardStats } {
  const guard = new RunGuard(allowedPackages);
  return { tools: tools.map((tool) => guard.wrap(tool)), stats: () => guard.stats() };
}
