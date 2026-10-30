import { PLAYBOOK_KEYWORDS, PLAYBOOK_ORDER } from "./constants";
import { PLAYBOOKS } from "./playbooks";
import type { Playbook } from "./types";

function hitsFor(text: string, pattern: RegExp): number {
  return text.match(new RegExp(pattern.source, "gi"))?.length ?? 0;
}

export function detectPlaybook(text: string): Playbook | null {
  const scored = PLAYBOOK_ORDER.map((id) => ({ id, hits: hitsFor(text, PLAYBOOK_KEYWORDS[id]) }));
  const best = scored.reduce((top, candidate) => (candidate.hits > top.hits ? candidate : top));
  return best.hits > 0 ? PLAYBOOKS[best.id] : null;
}
