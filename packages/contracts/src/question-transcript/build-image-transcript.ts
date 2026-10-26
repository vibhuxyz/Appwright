import type { AssetSlot } from "../asset.schema";
import { QUESTION_TRANSCRIPT_LIMITS } from "./constants";
import type { QuestionReplyData, QuestionSetData } from "./question-transcript.schema";
import { flattenTranscriptText } from "./transcript-text";

const limits = QUESTION_TRANSCRIPT_LIMITS;
export const IMAGE_QUESTION_OPTIONS = ["Upload my own", "Search photos", "Generate one", "Pick one for me"] as const;
const IMAGE_SOURCE_ANSWERS = {
  UPLOADED: "Uploaded my own",
  SEARCHED: "Photo picked",
  GENERATED: "Generated one",
} as const;

export type ImageSlotSource = keyof typeof IMAGE_SOURCE_ANSWERS;
type SectionSlot = Pick<AssetSlot, "componentName" | "pageRoute">;

export function imageSectionLabel(slot: SectionSlot): string {
  const words = slot.componentName.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/[-_]+/g, " ");
  return flattenTranscriptText(words, limits.maxLabelChars);
}

const HOME_ROUTE = "/";

function pageName(pageRoute: string): string {
  return pageRoute === HOME_ROUTE ? "the home page" : `the ${pageRoute} page`;
}

export function imageSectionQuestion(slot: SectionSlot): string {
  return flattenTranscriptText(`Which image should this section on ${pageName(slot.pageRoute)} use?`, limits.maxTextChars);
}

export function imageQuestionSet(intro: string, slots: readonly SectionSlot[]): QuestionSetData {
  return {
    kind: "images",
    intro: flattenTranscriptText(intro, limits.maxIntroChars),
    items: slots.slice(0, limits.maxItems).map((slot) => ({
      label: imageSectionLabel(slot),
      text: imageSectionQuestion(slot),
      options: [...IMAGE_QUESTION_OPTIONS],
    })),
    moreCount: Math.max(0, slots.length - limits.maxItems),
  };
}

export interface ImageSlotOutcome extends SectionSlot {
  status: AssetSlot["status"];
  source: ImageSlotSource | null;
}

function imageAnswer(slot: ImageSlotOutcome): string {
  if (slot.status === "SKIPPED") return "Skipped";
  if (slot.status !== "RESOLVED") return "Not chosen";
  return slot.source ? IMAGE_SOURCE_ANSWERS[slot.source] : "Photo picked";
}

export function imageReply(slots: readonly ImageSlotOutcome[]): QuestionReplyData {
  if (slots.every((slot) => slot.status === "SKIPPED")) {
    return { kind: "images", outcome: "skipped", items: [], moreCount: 0 };
  }
  return {
    kind: "images",
    outcome: "answered",
    items: slots.slice(0, limits.maxItems).map((slot) => ({
      label: imageSectionLabel(slot),
      text: imageSectionQuestion(slot),
      answer: imageAnswer(slot),
    })),
    moreCount: Math.max(0, slots.length - limits.maxItems),
  };
}
