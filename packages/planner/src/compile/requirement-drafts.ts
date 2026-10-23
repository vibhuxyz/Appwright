import type { Blueprint, RequirementArea } from "@repo/contracts";
import {
  ADMIN_API_GLOB,
  ADMIN_GLOB,
  AUTH_FEATURE,
  AUTH_GLOB,
  ENV_EXAMPLE_FILE,
  ENV_SCHEMA_FILE,
  HEALTH_API_GLOB,
  MEDIA_API_GLOB,
  MEDIA_GLOB,
  MIDDLEWARE_FILE,
  PACKAGE_MANIFEST,
  MODELS_GLOB,
  PUBLIC_ASSETS_GLOB,
  ROBOTS_FILE,
  SECURITY_GLOB,
  SEO_GLOB,
  SITEMAP_FILE,
  TESTS_GLOB,
} from "./constants";
import { routeToPageFile } from "./slug";
import type { TaskDraft } from "./types";

interface DraftContext {
  readonly dataRead: string;
  readonly authReads: readonly string[];
  readonly firstPageFile: string;
  readonly has: (area: RequirementArea) => boolean;
}

type DraftBuilder = (context: DraftContext) => TaskDraft;

const DRAFT_BUILDERS: Readonly<Record<RequirementArea, DraftBuilder>> = {
  security: ({ authReads }) => ({
    key: "security",
    type: "security",
    title: "Security hardening: validation, rate limits, headers",
    owns: [MIDDLEWARE_FILE, SECURITY_GLOB],
    reads: [PACKAGE_MANIFEST, ...authReads],
  }),
  admin: ({ dataRead, authReads, has }) => ({
    key: "admin",
    type: "admin",
    title: "Protected admin: content management and audit log",
    owns: [ADMIN_GLOB, ADMIN_API_GLOB],
    reads: [dataRead, ...authReads, ...(has("media") ? [MEDIA_GLOB] : [])],
  }),
  media: ({ dataRead }) => ({
    key: "media",
    type: "media",
    title: "Media management: uploads, slots and responsive images",
    owns: [MEDIA_GLOB, MEDIA_API_GLOB, PUBLIC_ASSETS_GLOB],
    reads: [dataRead],
  }),
  seo: ({ firstPageFile }) => ({
    key: "seo",
    type: "seo",
    title: "SEO: metadata, sitemap, robots and structured data",
    owns: [SEO_GLOB, SITEMAP_FILE, ROBOTS_FILE],
    reads: [firstPageFile],
  }),
  testing: ({ firstPageFile, has }) => ({
    key: "testing",
    type: "testing",
    title: "Automated tests and production build verification",
    owns: [TESTS_GLOB],
    reads: [firstPageFile, SECURITY_GLOB, ...(has("admin") ? [ADMIN_GLOB] : [])],
  }),
  deploy: () => ({
    key: "deploy",
    type: "deploy",
    title: "Deployment readiness: env validation, health check, seed",
    owns: [ENV_EXAMPLE_FILE, ENV_SCHEMA_FILE, HEALTH_API_GLOB],
    reads: [PACKAGE_MANIFEST],
  }),
};

const BUILD_ORDER: readonly RequirementArea[] = [
  "security",
  "media",
  "admin",
  "seo",
  "testing",
  "deploy",
];

export function requirementDrafts(blueprint: Blueprint): TaskDraft[] {
  const required = new Set(
    (blueprint.requirements ?? [])
      .filter((requirement) => requirement.level === "required")
      .map((requirement) => requirement.area),
  );
  const context: DraftContext = {
    dataRead: blueprint.entities.length > 0 ? MODELS_GLOB : PACKAGE_MANIFEST,
    authReads: blueprint.features.includes(AUTH_FEATURE) ? [AUTH_GLOB] : [],
    firstPageFile: routeToPageFile(blueprint.pages[0]?.route ?? "/"),
    has: (area) => required.has(area),
  };
  return BUILD_ORDER.filter((area) => required.has(area)).map((area) =>
    DRAFT_BUILDERS[area](context),
  );
}
