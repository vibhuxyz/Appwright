import type { Blueprint, Entity, Page } from "@repo/contracts";
import { dashboardComponents } from "../discovery";
import type { WorkflowSpec } from "../discovery";
import { toSlug } from "../compile";
import { MAX_ADMIN_ENTITY_PAGES, UNMANAGED_ENTITIES } from "./constants";
import type { TemplateAdditions } from "./types";

const SETTINGS_ENTITY = "SiteSettings";

const AUDIT_LOG: Entity = {
  name: "AuditLog",
  fields: [
    { name: "actor", type: "String", required: true, unique: false },
    { name: "action", type: "String", required: true, unique: false },
    { name: "target", type: "String", required: true, unique: false },
    { name: "createdAt", type: "DateTime", required: true, unique: false },
  ],
  relations: [],
};

const LOGIN_PAGE: Page = {
  route: "/admin/login",
  purpose: "Admin sign in",
  components: ["LoginForm"],
};

function overviewPage(workflows: readonly WorkflowSpec[]): Page {
  return {
    route: "/admin",
    purpose: "Staff operations: pending work, alerts, and recent activity",
    components: dashboardComponents(workflows),
  };
}

const MEDIA_PAGE: Page = {
  route: "/admin/media",
  purpose: "Upload, generate, preview, replace and reuse images",
  components: ["MediaLibrary", "ImageUploader"],
};

const SETTINGS_PAGE: Page = {
  route: "/admin/settings",
  purpose: "Edit business details, opening hours, gallery and social links",
  components: ["SettingsForm"],
};

function entityPage(entity: Entity): Page {
  return {
    route: `/admin/${toSlug(entity.name)}`,
    purpose: `Create, edit, archive and search ${entity.name} records`,
    components: ["DataTable", "EntityForm", "ConfirmDialog"],
  };
}

function managedEntities(blueprint: Blueprint): Entity[] {
  return blueprint.entities
    .filter((entity) => !UNMANAGED_ENTITIES.has(entity.name))
    .slice(0, MAX_ADMIN_ENTITY_PAGES);
}

export function adminAdditions(
  blueprint: Blueprint,
  options: { readonly isMediaRequired: boolean; readonly workflows?: readonly WorkflowSpec[] },
): TemplateAdditions {
  const hasSettings = blueprint.entities.some((entity) => entity.name === SETTINGS_ENTITY);
  const workflows = options.workflows ?? [];
  return {
    pages: [
      LOGIN_PAGE,
      overviewPage(workflows),
      ...managedEntities(blueprint).map(entityPage),
      ...(options.isMediaRequired ? [MEDIA_PAGE] : []),
      ...(hasSettings ? [SETTINGS_PAGE] : []),
    ],
    entities: [AUDIT_LOG],
    features: ["auth"],
    acceptance: {
      admin: [
        "The admin home shows pending operational work, not a generic table of every entity",
        "Related child records are managed inside their parent workflow",
        "Audit history is visible to privileged roles and is not a public CRUD page",
      ],
    },
  };
}
