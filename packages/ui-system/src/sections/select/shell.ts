import type { Blueprint } from "@repo/contracts";
import { directionFor } from "./apply";

export interface ShellChoice {
  navigationId: string;
  footerId: string | null;
  announcementId: string | null;
}

export function shellFor(blueprint: Pick<Blueprint, "projectType" | "pages" | "intent">): ShellChoice {
  const projectType = blueprint.projectType ?? "other";
  const text = blueprint.pages.map((page) => page.purpose).join(" ");
  const isApplication = projectType === "wallet" || (projectType === "saas" && /\bdashboard\b/i.test(text) && !/\bmarketing\b/i.test(text));
  if (isApplication) return { navigationId: "nav.sidebar", footerId: null, announcementId: null };
  const direction = directionFor(blueprint, projectType);
  if (direction === "editorial") return { navigationId: "nav.overlay-menu", footerId: "footer.editorial", announcementId: null };
  if (direction === "commerce") return { navigationId: "nav.top-bar", footerId: "footer.editorial", announcementId: "promo.bar" };
  return { navigationId: "nav.top-bar", footerId: "footer.columns", announcementId: null };
}
