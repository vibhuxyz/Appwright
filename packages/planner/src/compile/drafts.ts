import type { Blueprint } from "@repo/contracts";
import {
  APP_SHELL_FILE,
  AUTH_FEATURE,
  GLOBAL_STYLES_FILE,
  LAYOUTS_GLOB,
  PACKAGE_MANIFEST,
  PAYMENTS_FEATURE,
  PRISMA_SCHEMA_FILE,
  PRISMA_SEED_FILE,
  PROJECT_DATABASE,
  RESPONSIVE_NAV_GLOB,
  SHARED_COMPONENTS_GLOB,
  TYPOGRAPHY_FILE,
  VISUAL_VERIFICATION_FILE,
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
      title: "Apply theme and design tokens",
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

function uiDrafts(blueprint: Blueprint): TaskDraft[] {
  const pageReads = [
    SHARED_COMPONENTS_GLOB,
    LAYOUTS_GLOB,
    ...(blueprint.entities.length > 0 ? [PRISMA_SCHEMA_FILE] : []),
  ];

  const firstPageRoute = blueprint.pages[0]?.route ?? "/";
  const firstPageFile = routeToPageFile(firstPageRoute);

  return [
    {
      key: "app-shell",
      type: "app-shell",
      title: "App shell & navigation framework",
      owns: [APP_SHELL_FILE],
      reads: [GLOBAL_STYLES_FILE],
    },
    {
      key: "typography",
      type: "typography",
      title: "Typography scale & font definitions",
      owns: [TYPOGRAPHY_FILE],
      reads: [GLOBAL_STYLES_FILE],
    },
    {
      key: "layout",
      type: "layout",
      title: "Page layout shells & grid containers",
      owns: [LAYOUTS_GLOB],
      reads: [APP_SHELL_FILE, TYPOGRAPHY_FILE],
    },
    {
      key: "components",
      type: "component",
      title: "Shared UI components",
      owns: [SHARED_COMPONENTS_GLOB],
      reads: [LAYOUTS_GLOB, GLOBAL_STYLES_FILE],
    },
    ...blueprint.pages.map((page): TaskDraft => ({
      key: `page-${routeToSlug(page.route)}`,
      type: "page",
      title: `Page ${page.route}: ${page.purpose}`,
      owns: [routeToPageFile(page.route)],
      reads: pageReads,
    })),
    {
      key: "responsive",
      type: "responsive",
      title: "Mobile navigation & responsive viewport rules",
      owns: [RESPONSIVE_NAV_GLOB],
      reads: [APP_SHELL_FILE, firstPageFile],
    },
    {
      key: "visual-verification",
      type: "visual-verification",
      title: "Visual smoke & render verification",
      owns: [VISUAL_VERIFICATION_FILE],
      reads: [RESPONSIVE_NAV_GLOB, firstPageFile],
    },
  ];
}

export function draftTasks(blueprint: Blueprint): TaskDraft[] {
  return [
    ...foundationDrafts(),
    ...dataDrafts(blueprint),
    ...featureDrafts(blueprint),
    ...uiDrafts(blueprint),
  ];
}
