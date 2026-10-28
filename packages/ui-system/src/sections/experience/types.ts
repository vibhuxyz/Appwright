import type { ArtDirection } from "../registry";

export type ImageEntranceName = "none" | "fade" | "wipe" | "mask";
export type ImageHoverName = "none" | "zoom" | "grayscale";

export type SectionMotionLevel = "none" | "reveal" | "choreography" | "interactive";

export interface SignatureIdea {
  readonly id: string;
  readonly direction: ArtDirection;
  readonly idea: string;
  readonly effectId: string;
  readonly hostSectionIds: readonly string[];
  readonly signal?: RegExp;
}

export interface ExperienceInput {
  readonly briefText: string;
  readonly seed: string;
}

export interface ImageTreatment {
  readonly role: string;
  readonly entrance: ImageEntranceName;
  readonly hover: ImageHoverName;
  readonly scroll: "static" | "parallax";
}

export interface SectionMotion {
  readonly sectionId: string;
  readonly level: SectionMotionLevel;
}

export interface ExperienceStrategy {
  readonly signature: { readonly idea: string; readonly effectId: string; readonly sectionId: string } | null;
  readonly supportingEffectIds: readonly string[];
  readonly sectionMotion: readonly SectionMotion[];
  readonly imageTreatments: readonly ImageTreatment[];
  readonly mobile: readonly string[];
  readonly performance: readonly string[];
}
