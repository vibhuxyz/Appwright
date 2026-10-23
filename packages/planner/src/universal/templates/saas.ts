import type { Page } from "@repo/contracts";
import type { ProjectTemplate } from "../types";

const SETTINGS_ROUTE_PATTERN = /settings/;

const SETTINGS_PAGE: Page = {
  route: "/settings",
  purpose: "Account and workspace settings",
  components: ["SettingsForm"],
};

export const saasTemplate: ProjectTemplate = (blueprint) => ({
  pages: blueprint.pages.some((page) => SETTINGS_ROUTE_PATTERN.test(page.route))
    ? []
    : [SETTINGS_PAGE],
  entities: [],
  features: ["auth"],
  acceptance: {
    security: ["Roles and permissions are enforced on the server for every route and API"],
    testing: ["Permission-denied and unauthenticated states have tests"],
  },
});
