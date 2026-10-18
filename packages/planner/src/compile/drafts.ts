import type { Blueprint } from "@repo/contracts";
import {
  AUTH_FEATURE,
  GLOBAL_STYLES_FILE,
  PACKAGE_MANIFEST,
  PAYMENTS_FEATURE,
  PRISMA_SCHEMA_FILE,
  PRISMA_SEED_FILE,
  PROJECT_DATABASE,
  SHARED_COMPONENTS_GLOB,
} from "./constants";
import { routeToPageFile, routeToSlug, toSlug } from "./slug";
import type { TaskDraft } from "./types";

function foundationDrafts(): TaskDraft[] {
  return [
    {
      key: "scaffold",
      type: "scaffold",
      title: "Scaffold project",
      owns: [PACKAGE_MANIFEST, "tsconfig.json", "next.config.ts"],
      reads: [],
    },
    {
      key: "theme",
      type: "theme",
      title: "Apply theme tokens",
      owns: [GLOBAL_STYLES_FILE],
      reads: [PACKAGE_MANIFEST],
    },
  ];
}

function dataDrafts(blueprint: Blueprint): TaskDraft[] {
  if (blueprint.entities.length === 0) return [];
  const entityNames = blueprint.entities
    .map((entity) => entity.name)
    .join(", ");
  return [
    {
      key: "schema",
      type: "schema",
      title: `Data model: ${entityNames}`,
      owns: [PRISMA_SCHEMA_FILE, PROJECT_DATABASE],
      reads: [PACKAGE_MANIFEST],
    },
    ...blueprint.entities.map((entity): TaskDraft => ({
      key: `api-${toSlug(entity.name)}`,
      type: "api",
      title: `API routes: ${entity.name}`,
      owns: [`src/app/api/${toSlug(entity.name)}/**`],
      reads: [PRISMA_SCHEMA_FILE],
    })),
    {
      key: "seed",
      type: "seed",
      title: "Seed data",
      owns: [PRISMA_SEED_FILE, PROJECT_DATABASE],
      reads: [PRISMA_SCHEMA_FILE],
    },
  ];
}

function featureDrafts(blueprint: Blueprint): TaskDraft[] {
  const drafts: TaskDraft[] = [];
  const authReads =
    blueprint.entities.length > 0 ? [PRISMA_SCHEMA_FILE] : [PACKAGE_MANIFEST];
  if (blueprint.features.includes(AUTH_FEATURE)) {
    drafts.push({
      key: "auth",
      type: "auth",
      title: "Auth (email + session)",
      owns: ["src/auth/**", "src/app/api/auth/**", "env:AUTH_SECRET"],
      reads: authReads,
    });
  }
  if (blueprint.features.includes(PAYMENTS_FEATURE)) {
    drafts.push({
      key: "payments",
      type: "payment",
      title: "Payments",
      owns: [
        "src/payments/**",
        "src/app/api/payments/**",
        "env:STRIPE_SECRET_KEY",
      ],
      reads: authReads,
    });
  }
  return drafts;
}

function interfaceDrafts(blueprint: Blueprint): TaskDraft[] {
  const hasComponents = blueprint.pages.some(
    (page) => page.components.length > 0,
  );
  const pageReads = [
    GLOBAL_STYLES_FILE,
    ...(blueprint.entities.length > 0 ? [PRISMA_SCHEMA_FILE] : []),
    ...(hasComponents ? [SHARED_COMPONENTS_GLOB] : []),
  ];
  const componentDrafts: TaskDraft[] = hasComponents
    ? [
        {
          key: "components",
          type: "component",
          title: "Shared components",
          owns: [SHARED_COMPONENTS_GLOB],
          reads: [GLOBAL_STYLES_FILE],
        },
      ]
    : [];
  const pageDrafts = blueprint.pages.map((page): TaskDraft => ({
    key: `page-${routeToSlug(page.route)}`,
    type: "page",
    title: `Page ${page.route}: ${page.purpose}`,
    owns: [routeToPageFile(page.route)],
    reads: pageReads,
  }));
  return [...componentDrafts, ...pageDrafts];
}

export function draftTasks(blueprint: Blueprint): TaskDraft[] {
  return [
    ...foundationDrafts(),
    ...dataDrafts(blueprint),
    ...featureDrafts(blueprint),
    ...interfaceDrafts(blueprint),
  ];
}
