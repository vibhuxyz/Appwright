import type { ProjectType } from "@repo/contracts";
import type { ArtDirection } from "../registry";
import { DIRECTION_KEYWORDS, DIRECTION_ORDER } from "./constants";

function hitsFor(text: string, pattern: RegExp): number {
  return text.match(new RegExp(pattern.source, "gi"))?.length ?? 0;
}

function fallbackFor(projectType: ProjectType): ArtDirection {
  if (projectType === "portfolio") return "editorial";
  if (projectType === "marketplace") return "commerce";
  if (projectType === "saas") return "product";
  if (projectType === "business-site") return "local";
  return "classic";
}

export function detectArtDirection(text: string, projectType: ProjectType): ArtDirection {
  const fallback = fallbackFor(projectType);
  const scored = DIRECTION_ORDER.map((direction) => ({
    direction,
    hits: hitsFor(text, DIRECTION_KEYWORDS[direction]) + (direction === fallback ? 1 : 0),
  }));
  const best = scored.reduce((top, candidate) => (candidate.hits > top.hits ? candidate : top));
  return best.hits > 0 ? best.direction : fallback;
}
