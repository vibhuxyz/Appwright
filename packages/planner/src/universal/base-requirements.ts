import type { Blueprint, ProjectType, Requirement } from "@repo/contracts";
import type { Needs } from "../requirements";
import {
  ADMIN_PROJECT_TYPES,
  IMAGERY_PATTERN,
  MEDIA_PROJECT_TYPES,
  PRIVATE_ROUTE_PATTERN,
} from "./constants";

export interface BaseRequirementContext {
  readonly blueprint: Blueprint;
  readonly projectType: ProjectType;
  readonly needs: Needs;
}

function required(
  id: string,
  area: Requirement["area"],
  reason: string,
  acceptance: string[],
): Requirement {
  return { id, area, level: "required", reason, acceptance };
}

function notApplicable(id: string, area: Requirement["area"], reason: string): Requirement {
  return { id, area, level: "not-applicable", reason, acceptance: [] };
}

function hasPublicPages(blueprint: Blueprint): boolean {
  return blueprint.pages.some((page) => !PRIVATE_ROUTE_PATTERN.test(page.route));
}

function mentionsImagery(blueprint: Blueprint): boolean {
  return blueprint.pages.some((page) =>
    IMAGERY_PATTERN.test([page.purpose, ...page.components].join(" ")),
  );
}

function adminRequirement({ projectType, needs }: BaseRequirementContext): Requirement {
  if (ADMIN_PROJECT_TYPES.has(projectType) || needs.admin.required) {
    return required("admin", "admin", "Business-managed content needs a protected admin interface", [
      "Admin routes are unreachable without a server-verified admin session",
      "Every managed entity supports create, edit, archive and list with search and pagination",
      "Destructive actions ask for confirmation and write an audit log entry",
      "Loading, empty, error and permission-denied states exist",
    ]);
  }
  return notApplicable("admin", "admin", "No business-managed content was detected");
}

function mediaRequirement({ blueprint, projectType, needs }: BaseRequirementContext): Requirement {
  const isNeeded =
    MEDIA_PROJECT_TYPES.has(projectType) || needs.fileUpload.required || mentionsImagery(blueprint);
  if (!isNeeded) return notApplicable("media", "media", "No images or uploads were detected");
  return required("media", "media", "The pages use images that must be managed and reused", [
    "Every image slot has alt text, dimensions and a placeholder fallback",
    "Uploads validate type and size on the server",
    "One approved asset is reused across pages instead of regenerated",
    "Images are served in responsive sizes and lazy-loaded below the fold",
  ]);
}

function seoRequirement({ blueprint }: BaseRequirementContext): Requirement {
  if (!hasPublicPages(blueprint)) {
    return notApplicable("seo", "seo", "The app has no public pages");
  }
  return required("seo", "seo", "Public pages must be discoverable and shareable", [
    "Each public page has a unique title, description and canonical URL",
    "Open Graph metadata, sitemap.xml and robots.txt are served",
    "Private routes are excluded from the sitemap and marked noindex",
    "A useful 404 page exists",
  ]);
}

export function baseRequirements(context: BaseRequirementContext): Requirement[] {
  return [
    required("security", "security", "Every app needs server-side protection by default", [
      "All request bodies, params and queries are validated on the server",
      "Mutating and login endpoints are rate limited",
      "Secrets stay server-side and security headers are set",
      "Authorization is checked per resource, never trusted from the client",
    ]),
    adminRequirement(context),
    mediaRequirement(context),
    seoRequirement(context),
    required("testing", "testing", "Completion must be proven by evidence", [
      "Unit tests cover business logic and validation",
      "Critical user journeys are covered end to end",
      "The production build passes",
    ]),
    required("deploy", "deploy", "The app must be operable after launch", [
      "Environment variables are validated at boot",
      "A health endpoint exists",
      "Migrations and safe seed data run from documented commands",
    ]),
  ];
}
