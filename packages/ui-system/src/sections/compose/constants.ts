import type { DesignBlock, SectionPurpose } from "@repo/contracts";
import type { ArtDirection } from "../registry";
import type { VisualDensity, VisualStrategy } from "./types";

export const MAX_EXPRESSIVE_SECTIONS = 2;
export const MAX_DENSE_RUN = 2;
export const MAX_GOAL_CHARS = 180;

export const DENSITY_BY_LAYOUT: Readonly<Record<string, VisualDensity>> = {
  "product-grid": "high",
  "card-grid": "high",
  rail: "high",
  scroller: "medium",
  table: "high",
  "metric-strip": "high",
  "icon-row": "high",
  bento: "high",
  columns: "high",
  "editorial-gallery": "medium",
  collage: "medium",
  "feature-split": "medium",
  "metric-band": "medium",
  playground: "low",
  "case-study": "low",
  campaign: "low",
  "image-row": "medium",
  cinematic: "low",
  editorial: "low",
  spotlight: "low",
  statement: "low",
  quote: "low",
  centered: "low",
  band: "low",
  marquee: "low",
  sticky: "low",
  "split-story": "low",
  stage: "low",
};

export const CONVERSION_PURPOSES: ReadonlySet<SectionPurpose> = new Set(["cta", "pricing", "contact", "newsletter", "form"]);

export const DENSITY_BY_DESIGN: Readonly<Record<DesignBlock["density"], VisualDensity>> = {
  compact: "high",
  comfortable: "medium",
  spacious: "low",
};

export const IMAGE_TREATMENT: Readonly<Record<ArtDirection, VisualStrategy["imageTreatment"]>> = {
  commerce: "product",
  editorial: "editorial",
  product: "mixed",
  local: "editorial",
  classic: "mixed",
};

export const TYPOGRAPHY_STYLE: Readonly<Record<ArtDirection, VisualStrategy["typographyStyle"]>> = {
  commerce: "expressive",
  editorial: "expressive",
  product: "technical",
  local: "neutral",
  classic: "neutral",
};
