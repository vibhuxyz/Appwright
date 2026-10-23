const MAX_HTML_CHARS = 200_000;
const MAX_IDS = 64;

export interface RenderedSectionCheck {
  found: string[];
  missing: string[];
  skipped: number;
}

export function findRenderedSections(html: string, sectionIds: readonly string[]): RenderedSectionCheck {
  const source = html.length > MAX_HTML_CHARS ? html.slice(0, MAX_HTML_CHARS) : html;
  const capped = sectionIds.slice(0, MAX_IDS);
  const found: string[] = [];
  const missing: string[] = [];
  for (const id of capped) {
    if (source.includes(`data-section="${id}"`)) found.push(id);
    else missing.push(id);
  }
  return { found, missing, skipped: sectionIds.length - capped.length };
}
