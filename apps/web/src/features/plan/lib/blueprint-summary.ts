import type { Blueprint } from "@repo/contracts";

export interface SummaryLine {
  label: string;
  value: string;
}

const NONE = "none";

function joinOrNone(values: readonly string[]): string {
  return values.length > 0 ? values.join(", ") : NONE;
}

export function summarizeBlueprint(blueprint: Blueprint): SummaryLine[] {
  const { intent, stack, entities, pages, features, theme } = blueprint;
  return [
    { label: "Intent", value: `${intent.type} · ${intent.domain} · ${intent.complexity}` },
    {
      label: "Stack",
      value: [stack.framework, stack.db, stack.orm, stack.auth, stack.styling].join(" · "),
    },
    { label: "Entities", value: joinOrNone(entities.map((entity) => entity.name)) },
    { label: "Pages", value: joinOrNone(pages.map((page) => page.route)) },
    { label: "Features", value: joinOrNone(features) },
    { label: "Theme", value: `${theme.preset} (${theme.primary})` },
  ];
}
