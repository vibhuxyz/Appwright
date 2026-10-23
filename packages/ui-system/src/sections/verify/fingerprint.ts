import type { Page } from "@repo/contracts";

export function compositionFingerprint(pages: readonly Page[]): string {
  const body = pages
    .map((page) => `${page.route}:${(page.sections ?? []).map((section) => section.sectionId).join("+")}`)
    .join("|");
  let hash = 5381;
  for (let index = 0; index < body.length; index += 1) {
    hash = (Math.imul(hash, 33) + body.charCodeAt(index)) | 0;
  }
  return (hash >>> 0).toString(36);
}
