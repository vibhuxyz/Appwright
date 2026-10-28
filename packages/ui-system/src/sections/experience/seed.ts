import type { DesignBlock, Page } from "@repo/contracts";

const FNV_OFFSET_BASIS = 0x811c9dc5;
const FNV_PRIME = 0x01000193;

export interface SeedSource {
  readonly page: Pick<Page, "route" | "purpose">;
  readonly design: Pick<DesignBlock, "primaryColor" | "accentColor" | "fontFamily">;
  readonly projectId?: string;
}

export function experienceSeed({ page, design, projectId }: SeedSource): string {
  if (projectId) return [projectId, page.route].join("|");
  return [page.route, page.purpose, design.primaryColor, design.accentColor, design.fontFamily].join("|");
}

export function hashSeed(seed: string): number {
  return Array.from(seed).reduce((hash, char) => Math.imul(hash ^ (char.codePointAt(0) ?? 0), FNV_PRIME) >>> 0, FNV_OFFSET_BASIS);
}
