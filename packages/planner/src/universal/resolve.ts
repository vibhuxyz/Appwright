import type { Blueprint, Requirement, Stack } from "@repo/contracts";
import { appNeedsDatabase } from "../architecture/needs-database";
import { advanceDiscovery, workflowAdditions } from "../discovery";
import { adminAdditions } from "./admin-additions";
import { baseRequirements } from "./base-requirements";
import { AREA_ORDER } from "./constants";
import { applyScopeConstraints, mergeAdditions } from "./merge";
import { normalizeProjectType } from "./project-type";
import { detectScope } from "./scope";
import { templateFor } from "./templates";
import type { ResolveInput, ResolvedRequirements, TemplateAdditions } from "./types";
import { withRequiredUiComponents } from "./ui-components";

function withTemplateAcceptance(
  requirements: readonly Requirement[],
  acceptance: TemplateAdditions["acceptance"],
): Requirement[] {
  return requirements
    .map((requirement) => ({
      ...requirement,
      acceptance:
        requirement.level === "required"
          ? [...requirement.acceptance, ...(acceptance[requirement.area] ?? [])]
          : requirement.acceptance,
    }))
    .sort((a, b) => AREA_ORDER.indexOf(a.area) - AREA_ORDER.indexOf(b.area));
}

const DATABASE_STACK = { db: "mongodb", orm: "mongoose" } as const;
const STATIC_STACK = { db: "none", orm: "none" } as const;

function stackFor(blueprint: Blueprint, database: boolean): Stack {
  return { ...blueprint.stack, ...(database ? DATABASE_STACK : STATIC_STACK) };
}

function withoutStoredData(blueprint: Blueprint): Blueprint {
  return {
    ...blueprint,
    entities: [],
    features: blueprint.features.filter((feature) => feature !== "auth" && feature !== "payments"),
    stack: stackFor(blueprint, false),
  };
}

function withoutAdmin(requirements: readonly Requirement[]): Requirement[] {
  return requirements.map((requirement) =>
    requirement.area === "admin"
      ? {
          ...requirement,
          level: "not-applicable",
          reason: "This site does not store records, so it has no database or admin",
          acceptance: [],
        }
      : requirement,
  );
}

export function resolveRequirements(input: ResolveInput): ResolvedRequirements {
  const projectType = normalizeProjectType(input.blueprint.intent, input.prompt);
  const scope = detectScope(input.prompt);
  const discovery = advanceDiscovery(input.prompt, input.answers);
  const constrained = applyScopeConstraints(input.blueprint, scope);
  const template = templateFor(projectType)(constrained.blueprint, scope);
  const templated = mergeAdditions(constrained.blueprint, template);
  const withWorkflows = mergeAdditions(templated.blueprint, workflowAdditions(discovery.workflows));
  const database = appNeedsDatabase(input.prompt, input.answers);
  const stored = database
    ? { ...withWorkflows, blueprint: { ...withWorkflows.blueprint, stack: stackFor(withWorkflows.blueprint, true) } }
    : { ...withWorkflows, blueprint: withoutStoredData(withWorkflows.blueprint) };

  const requirements = database
    ? withTemplateAcceptance(
        baseRequirements({ blueprint: stored.blueprint, projectType, needs: input.needs }),
        template.acceptance,
      )
    : withoutAdmin(
        withTemplateAcceptance(
          baseRequirements({ blueprint: stored.blueprint, projectType, needs: input.needs }),
          template.acceptance,
        ),
      );
  const isAdminRequired = requirements.some(
    (requirement) => requirement.area === "admin" && requirement.level === "required",
  );
  const isMediaRequired = requirements.some(
    (requirement) => requirement.area === "media" && requirement.level === "required",
  );
  const admin = isAdminRequired
    ? mergeAdditions(
        stored.blueprint,
        adminAdditions(stored.blueprint, {
          isMediaRequired,
          workflows: discovery.workflows,
        }),
      )
    : { blueprint: stored.blueprint, skipped: [] };

  return {
    blueprint: {
      ...admin.blueprint,
      pages: withRequiredUiComponents(admin.blueprint.pages),
      projectType,
      requirements,
      workflows: discovery.workflows.map((workflow) => ({
        ...workflow,
        actors: [...workflow.actors],
        steps: [...workflow.steps],
      })),
    },
    projectType,
    requirements,
    skipped: [...constrained.skipped, ...templated.skipped, ...withWorkflows.skipped, ...admin.skipped],
  };
}
