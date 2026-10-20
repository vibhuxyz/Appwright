import { INSPECTOR_SCRIPT } from "./inspector-script";

const BODY_CLOSE = /<\/body\s*>/gi;
const SCRIPT_TAG = `<script data-aw-inspector>${INSPECTOR_SCRIPT}</script>`;

export function injectInspector(html: string): string {
  const matches = [...html.matchAll(BODY_CLOSE)];
  const last = matches.at(-1);
  if (last?.index === undefined) return `${html}${SCRIPT_TAG}`;
  return `${html.slice(0, last.index)}${SCRIPT_TAG}${html.slice(last.index)}`;
}

export function isHtmlResponse(contentType: string | undefined): boolean {
  return contentType?.toLowerCase().startsWith("text/html") ?? false;
}
