import type { ProjectType } from "@repo/contracts";
import type { ProjectTemplate } from "../types";
import { businessSiteTemplate } from "./business-site";
import { marketplaceTemplate } from "./marketplace";
import { portfolioTemplate } from "./portfolio";
import { saasTemplate } from "./saas";
import { walletTemplate } from "./wallet";

const EMPTY_TEMPLATE: ProjectTemplate = () => ({
  pages: [],
  entities: [],
  features: [],
  acceptance: {},
});

const TEMPLATES = {
  "business-site": businessSiteTemplate,
  marketplace: marketplaceTemplate,
  portfolio: portfolioTemplate,
  saas: saasTemplate,
  wallet: walletTemplate,
  other: EMPTY_TEMPLATE,
} as const satisfies Record<ProjectType, ProjectTemplate>;

export function templateFor(projectType: ProjectType): ProjectTemplate {
  return TEMPLATES[projectType];
}
