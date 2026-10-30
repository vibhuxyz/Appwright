import { PLAYBOOK_KEYWORDS, PLAYBOOK_ORDER } from "./constants";
import { mergePlaybooks } from "./merge";
import { PLAYBOOKS } from "./playbooks";
import type { Playbook } from "./types";

function hitsFor(text: string, pattern: RegExp): number {
  return text.match(new RegExp(pattern.source, "gi"))?.length ?? 0;
}

export function detectPlaybook(text: string): Playbook | null {
  const matched = PLAYBOOK_ORDER.map((id, order) => ({ id, order, hits: hitsFor(text, PLAYBOOK_KEYWORDS[id]) }))
    .filter((candidate) => candidate.hits > 0)
    .sort((left, right) => right.hits - left.hits || left.order - right.order);
  const [first, ...others] = matched.map((candidate) => PLAYBOOKS[candidate.id]);
  return first ? mergePlaybooks([first, ...others]) : null;
}

export interface PlaybookPage {
  readonly purpose: string;
  readonly components: readonly string[];
}

function splitCamelCase(name: string): string {
  return name.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/[._-]+/g, " ");
}

export function detectPagePlaybook(page: PlaybookPage): Playbook | null {
  return detectPlaybook([page.purpose, ...page.components.map(splitCamelCase)].join(" "));
}
