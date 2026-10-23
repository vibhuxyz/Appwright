import type { Blueprint, Page } from "@repo/contracts";
import type { PlanIssue } from "../shared";

function hasEntity(blueprint: Blueprint, name: string): boolean {
  return blueprint.entities.some((entity) => entity.name === name);
}

function pageAt(blueprint: Blueprint, route: string): Page | undefined {
  return blueprint.pages.find((page) => page.route === route);
}

function inScope(blueprint: Blueprint, kind: string): boolean {
  return (blueprint.workflows ?? []).some((workflow) => workflow.kind === kind && workflow.inScope);
}

export function completenessIssues(blueprint: Blueprint): PlanIssue[] {
  const issues: PlanIssue[] = [];
  const workflows = blueprint.workflows ?? [];
  if (workflows.length === 0) return issues;

  if (inScope(blueprint, "pickup-order") && !hasEntity(blueprint, "Order")) {
    issues.push({
      code: "missing_workflow",
      message: "Pickup ordering is in scope but the plan has no Order model",
    });
  }
  if (inScope(blueprint, "custom-request") && !hasEntity(blueprint, "CustomRequest")) {
    issues.push({
      code: "missing_workflow",
      message: "Custom cake or event requests are in scope but the plan has no CustomRequest model",
    });
  }
  if (inScope(blueprint, "pop-up-locations") && !hasEntity(blueprint, "Location")) {
    issues.push({
      code: "missing_workflow",
      message: "Pop-up locations are in scope but the plan has no Location model",
    });
  }
  if (inScope(blueprint, "browse-catalog") && blueprint.pages.every((page) => page.route.startsWith("/admin"))) {
    issues.push({
      code: "missing_workflow",
      message: "The catalog is in scope but there is no public browse page",
    });
  }

  const adminRequired = (blueprint.requirements ?? []).some(
    (requirement) => requirement.area === "admin" && requirement.level === "required",
  );
  if (adminRequired) {
    const overview = pageAt(blueprint, "/admin");
    if (!overview) {
      issues.push({
        code: "missing_admin",
        message: "Business operations need a protected admin home",
      });
    } else if (
      inScope(blueprint, "pickup-order") &&
      overview.components.includes("SummaryCards") &&
      !overview.components.some((component) => /pending|pickup|order|alert/i.test(component))
    ) {
      issues.push({
        code: "missing_admin",
        message: "The admin home does not surface pending order work",
      });
    }
  }

  const required = (blueprint.requirements ?? []).filter((requirement) => requirement.level === "required");
  for (const requirement of required) {
    if (requirement.acceptance.length === 0) {
      issues.push({
        code: "missing_acceptance",
        message: `Requirement "${requirement.id}" has no acceptance criteria`,
      });
    }
  }
  return issues;
}
