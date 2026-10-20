import { ALLOWED_PACKAGES, type Blueprint } from "@repo/contracts";
import type { PlanIssue } from "../shared";
import { DEPENDENCIES_BY_FEATURE } from "../workspace/constants";

export function validatePackageAllowlist(
  blueprint: Blueprint,
  allowedPackages: readonly string[] = ALLOWED_PACKAGES,
): PlanIssue[] {
  const allowed = new Set(allowedPackages);
  const issues: PlanIssue[] = [];
  const requiredPackages = blueprint.features.flatMap(
    (feature) => DEPENDENCIES_BY_FEATURE[feature] ?? [],
  );

  for (const pkg of new Set(requiredPackages)) {
    if (!allowed.has(pkg)) {
      issues.push({
        code: "package_not_allowed",
        message: `Package "${pkg}" is not in deps.allow.json`,
      });
    }
  }

  return issues;
}
