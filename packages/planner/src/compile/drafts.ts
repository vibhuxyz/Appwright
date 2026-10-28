import type { Blueprint, Page } from "@repo/contracts";
import { compositionFingerprint, shellFor } from "@repo/ui-system";
import {
  ADMIN_GLOB,
  ADMIN_ROUTE_PREFIX,
  APP_SHELL_FILE,
  AUTH_FEATURE,
  GLOBAL_STYLES_FILE,
  LAYOUTS_GLOB,
  MEDIA_GLOB,
  PACKAGE_MANIFEST,
  PAYMENTS_FEATURE,
  MODELS_GLOB,
  SEED_FILE,
  PROJECT_DATABASE,
  RESPONSIVE_NAV_GLOB,
  SHARED_COMPONENTS_GLOB,
  TYPOGRAPHY_FILE,
  VISUAL_VERIFICATION_FILE,
} from "./constants";
import { routeToLoadingFile, routeToPageFile, routeToSlug, toSlug } from "./slug";
import { requirementDrafts } from "./requirement-drafts";
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
      owns: [MODELS_GLOB, PROJECT_DATABASE],
      reads: [PACKAGE_MANIFEST],
    },
    ...blueprint.entities.map((entity): TaskDraft => ({
      key: `api-${toSlug(entity.name)}`,
      type: "api",
      title: `API routes: ${entity.name}`,
      owns: [`src/app/api/${toSlug(entity.name)}/**`],
      reads: [MODELS_GLOB],
    })),
    {
      key: "seed",
      type: "seed",
      title: "Seed data",
      owns: [SEED_FILE, PROJECT_DATABASE],
      reads: [MODELS_GLOB],
    },
  ];
}

function featureDrafts(blueprint: Blueprint): TaskDraft[] {
  const drafts: TaskDraft[] = [];
  const authReads =
    blueprint.entities.length > 0 ? [MODELS_GLOB] : [PACKAGE_MANIFEST];
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

function sectionNote(page: Page): string {
  const ids = (page.sections ?? []).map((section) => section.sectionId);
  return ids.length > 0 ? ` [${ids.join(", ")}]` : "";
}

function pageTitle(page: Page): string {
  const names = page.components.length > 0 ? ` (${page.components.join(", ")})` : "";
  return `Page ${page.route}: ${page.purpose}${names}${sectionNote(page)}`;
}

function pageReadsFor(route: string, baseReads: string[], blueprint: Blueprint): string[] {
  const areas = new Set((blueprint.requirements ?? []).map((requirement) => requirement.area));
  const isAdminRoute = route === ADMIN_ROUTE_PREFIX || route.startsWith(`${ADMIN_ROUTE_PREFIX}/`);
  if (!isAdminRoute || !areas.has("admin")) return baseReads;
  const isMediaRoute = route.endsWith("/media") && areas.has("media");
  return [...baseReads, ADMIN_GLOB, ...(isMediaRoute ? [MEDIA_GLOB] : [])];
}

function shellDraft(blueprint: Blueprint): TaskDraft {
  const shell = shellFor(blueprint);
  const named = [shell.announcementId, shell.navigationId, shell.footerId].filter((id) => id !== null).join(", ");
  return {
    key: "app-shell",
    type: "app-shell",
    title: `App shell & navigation (${named})`,
    owns: [APP_SHELL_FILE],
    reads: [GLOBAL_STYLES_FILE],
  };
}

function visualDraft(blueprint: Blueprint, firstPageFile: string): TaskDraft {
  return {
    key: "visual-verification",
    type: "visual-verification",
    title: `Visual smoke & render verification #${compositionFingerprint(blueprint.pages)}`,
    owns: [VISUAL_VERIFICATION_FILE],
    reads: [RESPONSIVE_NAV_GLOB, firstPageFile],
  };
}

function frameDrafts(firstPageFile: string): TaskDraft[] {
  return [
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
    {
      key: "responsive",
      type: "responsive",
      title: "Mobile navigation & responsive viewport rules",
      owns: [RESPONSIVE_NAV_GLOB],
      reads: [APP_SHELL_FILE, firstPageFile],
    },
  ];
}

function pageDrafts(blueprint: Blueprint, pageReads: string[]): TaskDraft[] {
  return blueprint.pages.map((page): TaskDraft => ({
    key: `page-${routeToSlug(page.route)}`,
    type: "page",
    title: pageTitle(page),
    owns: [routeToPageFile(page.route), routeToLoadingFile(page.route)],
    reads: pageReadsFor(page.route, pageReads, blueprint),
  }));
}

function uiDrafts(blueprint: Blueprint): TaskDraft[] {
  const pageReads = [SHARED_COMPONENTS_GLOB, LAYOUTS_GLOB, ...(blueprint.entities.length > 0 ? [MODELS_GLOB] : [])];
  const firstPageFile = routeToPageFile(blueprint.pages[0]?.route ?? "/");
  const [typography, layout, components, responsive] = frameDrafts(firstPageFile);
  return [
    shellDraft(blueprint),
    typography,
    layout,
    components,
    ...pageDrafts(blueprint, pageReads),
    responsive,
    visualDraft(blueprint, firstPageFile),
  ].filter((task): task is TaskDraft => task !== undefined);
}

export function draftTasks(blueprint: Blueprint): TaskDraft[] {
  return [
    ...foundationDrafts(),
    ...dataDrafts(blueprint),
    ...featureDrafts(blueprint),
    ...uiDrafts(blueprint),
    ...requirementDrafts(blueprint),
  ];
}
