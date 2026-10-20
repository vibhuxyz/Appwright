import { BlueprintSchema, type Blueprint } from "@repo/contracts";
import type { PlanIssue, PlanResult } from "../shared";
import { validatePackageAllowlist } from "./validate-packages";

const ROUTE_PATTERN = /^\/[A-Za-z0-9_\-/[\]]*$/;
const ENTITY_NAME_PATTERN = /^[A-Z][A-Za-z0-9]*$/;

function findDuplicates(values: readonly string[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
  }
  return [...duplicates].sort();
}

function semanticIssues(blueprint: Blueprint): PlanIssue[] {
  const issues: PlanIssue[] = [];
  const entityNames = blueprint.entities.map((entity) => entity.name);
  const knownEntities = new Set(entityNames);

  for (const name of findDuplicates(entityNames)) {
    issues.push({
      code: "duplicate_entity",
      message: `Entity "${name}" is declared more than once`,
    });
  }
  for (const entity of blueprint.entities) {
    if (!ENTITY_NAME_PATTERN.test(entity.name)) {
      issues.push({
        code: "invalid_entity_name",
        message: `Entity "${entity.name}" must be PascalCase`,
      });
    }
    for (const relation of entity.relations) {
      if (!knownEntities.has(relation)) {
        issues.push({
          code: "dangling_relation",
          message: `Entity "${entity.name}" relates to unknown entity "${relation}"`,
        });
      }
    }
  }

  const routes = blueprint.pages.map((page) => page.route);
  for (const route of findDuplicates(routes)) {
    issues.push({
      code: "duplicate_route",
      message: `Route "${route}" is declared more than once`,
    });
  }
  for (const route of routes) {
    if (!ROUTE_PATTERN.test(route)) {
      issues.push({
        code: "invalid_route",
        message: `Route "${route}" is not a valid app route`,
      });
    }
  }
  return issues;
}

export function validateBlueprint(
  input: unknown,
  allowedPackages?: readonly string[],
): PlanResult<Blueprint> {
  const parsed = BlueprintSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      issues: parsed.error.issues.map((issue) => ({
        code: "invalid_blueprint_schema",
        message: `${issue.path.join(".") || "blueprint"}: ${issue.message}`,
      })),
    };
  }
  const issues = [
    ...semanticIssues(parsed.data),
    ...validatePackageAllowlist(parsed.data, allowedPackages),
  ];
  return issues.length > 0
    ? { ok: false, issues }
    : { ok: true, value: parsed.data };
}
