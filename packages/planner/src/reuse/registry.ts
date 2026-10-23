import type { ReuseCapability } from "./types";

export const REUSE_REGISTRY: readonly ReuseCapability[] = [
  {
    id: "project-scaffold-preset",
    label: "Project scaffold and framework preset",
    taskTypes: ["scaffold"],
    action: "reuse",
    evidence:
      "templates/nextjs-fullstack already has package.json, tsconfig.json and next.config.ts; createWorkspace copies them into every project repo before the task DAG runs",
  },
  {
    id: "orm-migration-utils",
    label: "Mongoose models and database connection",
    taskTypes: ["schema", "migration"],
    action: "configure",
    evidence:
      "templates/nextjs-fullstack/src/lib/mongoose.ts already provides the cached connection; generateDataModelAttempt writes one Mongoose model per entity under src/models; MongoDB needs no migrations, and constraints beyond the field list stay project-specific",
  },
  {
    id: "auth-integration",
    label: "Authentication and protected-route module",
    taskTypes: ["auth", "security"],
    action: "configure",
    evidence: "Reuse @repo/auth's session/auth mechanism; per-resource authorization rules stay project-specific",
  },
  {
    id: "ui-primitive-library",
    label: "UI primitive and page composition library",
    taskTypes: ["component", "page", "design-system", "app-shell", "typography", "layout", "responsive"],
    action: "configure",
    evidence:
      "Reuse @repo/ui-system primitives and the curated section catalog. Page composition stays project-specific and is written onto each page before compileTasks.",
  },
  {
    id: "media-library",
    label: "Media and asset library",
    taskTypes: ["media"],
    action: "reuse",
    evidence: "Reuse @repo/media and the asset upload/finalize pipeline in apps/api/src/assets",
  },
  {
    id: "verification-harness",
    label: "Verification scripts",
    taskTypes: ["visual-verification"],
    action: "configure",
    evidence: "Reuse @repo/verify's harness; assertions stay project-specific",
  },
  {
    id: "admin-crud-generator",
    label: "Configurable CRUD generator for the admin task",
    taskTypes: ["admin"],
    action: "configure",
    evidence:
      "@repo/admin-crud's generateAdminCrud(entity) emits src/admin/<slug>/index.tsx and src/app/api/admin/<slug>/route.ts + [id]/route.ts from the entity's field list; field validation and business rules beyond CRUD stay custom",
  },
  {
    id: "seo-templates",
    label: "SEO metadata, sitemap and robots templates",
    taskTypes: ["seo"],
    action: "configure",
    evidence:
      "templates/nextjs-fullstack/src/seo/metadata.ts, src/app/sitemap.ts and src/app/robots.ts already exist; per-page sitemap entries and page-specific metadata stay project-specific",
  },
  {
    id: "deploy-health-templates",
    label: "Env validation and health-check templates",
    taskTypes: ["deploy"],
    action: "reuse",
    evidence:
      "templates/nextjs-fullstack/.env.example, src/env.ts (Zod-validated env, crashes on bad config) and src/app/api/health/route.ts already exist and are copied into every project repo before the task DAG runs",
  },
  {
    id: "theme-override-generator",
    label: "Theme override generator driven by Blueprint.design",
    taskTypes: ["theme"],
    action: "configure",
    evidence:
      "generateThemeAttempt converts Blueprint.design (primaryColor/accentColor/radius/fontFamily) to oklch() and appends a @layer base override to globals.css; it does not touch the generated token system in tokens.css",
  },
  {
    id: "public-crud-api-generator",
    label: "Per-entity public CRUD API generator",
    taskTypes: ["api"],
    action: "configure",
    evidence:
      "generatePublicApiAttempt reuses @repo/admin-crud's field-codegen to emit src/app/api/<slug>/route.ts + [id]/route.ts per entity; business rules beyond CRUD stay custom",
  },
  {
    id: "seed-data-generator",
    label: "Deterministic seed-data generator",
    taskTypes: ["seed"],
    action: "configure",
    evidence:
      "generateSeedAttempt writes scripts/seed.ts with 3 deterministic rows per entity from the field list; realistic/representative data stays custom",
  },
  {
    id: "payment-skeleton-generator",
    label: "Stripe integration skeleton generator",
    taskTypes: ["payment"],
    action: "configure",
    evidence:
      "generatePaymentAttempt writes a Stripe client, checkout-session route and webhook-verification route, and patches package.json with the stripe dependency; which prices map to which products, and business handling per webhook event, stay custom",
  },
] as const;
