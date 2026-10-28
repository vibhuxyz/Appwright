import type { ArtDirection } from "../registry";

export type VisualDensity = "low" | "medium" | "high";
export type VisualRole = "anchor" | "support" | "conversion";

export interface VisualStrategy {
  readonly density: VisualDensity;
  readonly imageTreatment: "editorial" | "product" | "mixed";
  readonly typographyStyle: "expressive" | "neutral" | "technical";
  readonly motionLevel: "none" | "subtle" | "expressive";
}

export interface ComposedSection {
  readonly sectionId: string;
  readonly patternId: string | null;
  readonly purpose: string;
  readonly visualRole: VisualRole;
  readonly density: VisualDensity;
}

export interface PageCompositionPlan {
  readonly artDirection: ArtDirection;
  readonly pageGoal: string;
  readonly visualStrategy: VisualStrategy;
  readonly sections: readonly ComposedSection[];
  readonly constraints: readonly string[];
}
