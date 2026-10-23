import { SEVERITY_BY_KIND } from "./constants";
import type { Finding, FindingKind } from "./types";

const MAX_MESSAGE_CHARS = 240;

function flatten(text: string): string {
  return text.replace(/\s+/g, " ").trim().slice(0, MAX_MESSAGE_CHARS);
}

export function makeFinding(
  kind: FindingKind,
  where: { readonly route: string; readonly viewport: string },
  message: string,
): Finding {
  return {
    kind,
    severity: SEVERITY_BY_KIND[kind],
    route: where.route,
    viewport: where.viewport,
    message: flatten(message),
  };
}
