import type { ClickTarget } from "../session";

export const MAX_CLICKS_PER_PAGE = 8;

const DESTRUCTIVE_OR_COSTLY =
  /delete|remove|destroy|clear|reset|log ?out|sign ?out|cancel|unsubscribe|deactivate|disable|archive|pay\b|buy\b|purchase|checkout|place order|confirm|submit|send|upgrade/i;

export function isSafeToClick(name: string): boolean {
  return name.length > 0 && !DESTRUCTIVE_OR_COSTLY.test(name);
}

export function chooseClickTargets(targets: readonly ClickTarget[]): ClickTarget[] {
  const seen = new Set<string>();
  const chosen: ClickTarget[] = [];
  for (const target of targets) {
    if (!isSafeToClick(target.name) || seen.has(target.name)) continue;
    seen.add(target.name);
    chosen.push(target);
  }
  return chosen.slice(0, MAX_CLICKS_PER_PAGE);
}
