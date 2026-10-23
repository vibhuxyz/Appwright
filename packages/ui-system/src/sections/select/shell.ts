import type { Blueprint } from "@repo/contracts";

export interface ShellChoice {
  navigationId: string;
  footerId: string | null;
}

export function shellFor(blueprint: Pick<Blueprint, "projectType" | "pages">): ShellChoice {
  const projectType = blueprint.projectType ?? "other";
  const text = blueprint.pages.map((page) => page.purpose).join(" ");
  const isApplication = projectType === "wallet" || (projectType === "saas" && /\bdashboard\b/i.test(text) && !/\bmarketing\b/i.test(text));
  if (isApplication) return { navigationId: "nav.sidebar", footerId: null };
  return { navigationId: "nav.top-bar", footerId: "footer.columns" };
}
