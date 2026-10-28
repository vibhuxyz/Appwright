export type DesignSkillId =
  | "art-direction"
  | "layout-composition"
  | "motion-design"
  | "creative-interactions"
  | "visual-assets"
  | "visual-quality-review";

export interface SkillSignals {
  readonly isUiTask: boolean;
  readonly hasSections: boolean;
  readonly hasMotion: boolean;
  readonly hasInteraction: boolean;
  readonly hasImages: boolean;
  readonly isRepair: boolean;
}

export interface LoadedSkill {
  readonly id: DesignSkillId;
  readonly body: string;
}

export interface SkillsBlock {
  readonly text: string;
  readonly included: readonly DesignSkillId[];
  readonly cut: readonly { readonly id: DesignSkillId; readonly reason: string }[];
}
