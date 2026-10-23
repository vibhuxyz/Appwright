import type { Blueprint } from "@repo/contracts";

export interface SummaryLine {
  label: string;
  value: string;
}

const NONE = "none";

function joinOrNone(values: readonly string[]): string {
  return values.length > 0 ? values.join(", ") : NONE;
}

function sectionLine(pages: Blueprint["pages"]): SummaryLine | undefined {
  const parts = pages
    .filter((page) => (page.sections?.length ?? 0) > 0)
    .map((page) => `${page.route}: ${(page.sections ?? []).map((section) => section.sectionId).join(", ")}`);
  if (parts.length === 0) return undefined;
  const value = parts.join(" · ");
  return { label: "Sections", value: value.length > 280 ? `${value.slice(0, 279).trimEnd()}…` : value };
}

export function summarizeBlueprint(blueprint: Blueprint): SummaryLine[] {
  const { intent, stack, entities, pages, features, theme } = blueprint;
  const sections = sectionLine(pages);
  return [
    { label: "Intent", value: `${intent.type} · ${intent.domain} · ${intent.complexity}` },
    {
      label: "Stack",
      value: [stack.framework, stack.db, stack.orm, stack.auth, stack.styling].join(" · "),
    },
    { label: "Entities", value: joinOrNone(entities.map((entity) => entity.name)) },
    { label: "Pages", value: joinOrNone(pages.map((page) => page.route)) },
    ...(sections ? [sections] : []),
    { label: "Features", value: joinOrNone(features) },
    { label: "Theme", value: `${theme.preset} (${theme.primary})` },
  ];
}
