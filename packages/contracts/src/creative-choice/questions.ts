import type { PromptQuestion } from "../session.schema";
import { CREATIVE_CHOICE_NEEDS, CREATIVE_CHOICE_OPTIONS, DECIDE_FOR_ME_INDEX } from "./constants";

const DESIGN_QUESTION: PromptQuestion = {
  need: CREATIVE_CHOICE_NEEDS.design,
  label: "Design",
  text: "Do you want to pick the design system (colours, fonts, style) yourself, or should I decide it for you?",
  options: [...CREATIVE_CHOICE_OPTIONS],
  defaultOptionIndex: DECIDE_FOR_ME_INDEX,
  inputType: "single",
  importance: "optional",
};

const IMAGES_QUESTION: PromptQuestion = {
  need: CREATIVE_CHOICE_NEEDS.images,
  label: "Images",
  text: "Do you want to choose the image for each section yourself, or should I pick matching photos for you?",
  options: [...CREATIVE_CHOICE_OPTIONS],
  defaultOptionIndex: DECIDE_FOR_ME_INDEX,
  inputType: "single",
  importance: "optional",
};

export const CREATIVE_CHOICE_QUESTIONS: readonly PromptQuestion[] = [DESIGN_QUESTION, IMAGES_QUESTION];
