export const CREATIVE_CHOICE_NEEDS = {
  design: "design-choice",
  images: "image-choice",
} as const;

export type CreativeChoiceNeed = (typeof CREATIVE_CHOICE_NEEDS)[keyof typeof CREATIVE_CHOICE_NEEDS];

export const CHOOSE_MYSELF_OPTION = "I'll choose";
export const DECIDE_FOR_ME_OPTION = "Decide for me";

export const CREATIVE_CHOICE_OPTIONS = [CHOOSE_MYSELF_OPTION, DECIDE_FOR_ME_OPTION] as const;
export const DECIDE_FOR_ME_INDEX = 1;

export const SKIPPED_ANSWER = "skip";

export const IMAGE_CHOICE_KEY = "imageChoice";
export const IMAGE_CHOICE_AUTO = "auto";
