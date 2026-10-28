import type { DesignSkillId } from "./types";

export const SKILL_ORDER: readonly DesignSkillId[] = [
  "visual-quality-review",
  "art-direction",
  "layout-composition",
  "motion-design",
  "creative-interactions",
  "visual-assets",
];

export const MAX_SKILL_BYTES = 4096;
export const MAX_SKILLS_BYTES = 12_288;
export const SKILLS_OPEN_TAG = "<design-skills>";
export const SKILLS_CLOSE_TAG = "</design-skills>";
