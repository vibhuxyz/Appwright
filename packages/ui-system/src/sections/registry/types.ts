import type { DesignBlock, ProjectType, SectionPurpose, SectionWidth } from "@repo/contracts";

export interface SectionAsset {
  purpose: string;
  aspect: string;
  required: boolean;
  guidance: string;
}

export interface QualityCheck {
  id: string;
  status: "passed" | "failed" | "not-executed";
  detail: string;
}

export interface SectionEntry {
  id: string;
  name: string;
  description: string;
  purpose: SectionPurpose;
  sourceId: string;
  businesses: readonly ProjectType[];
  styles: readonly string[];
  densities: readonly DesignBlock["density"][];
  characteristics: readonly string[];
  layoutPattern: string;
  variantId: string;
  primitives: readonly string[];
  contentFields: readonly string[];
  assets: readonly SectionAsset[];
  responsive: string;
  interactions: readonly string[];
  accessibility: readonly string[];
  width: SectionWidth;
  componentName?: string;
  quality: "accepted";
  tailwindMajor: 4;
  reactMajor: 19;
  checks: readonly QualityCheck[];
}

export interface SourceDecision {
  id: string;
  repository: string;
  author: string;
  license: string;
  revision: string;
  commercialUse: boolean;
  modification: boolean;
  redistribution: boolean;
  decision: "adopt" | "adopt-primitives" | "defer" | "reject";
  reason: string;
}

export type SectionDraft = Omit<
  SectionEntry,
  "sourceId" | "variantId" | "quality" | "tailwindMajor" | "reactMajor" | "checks" | "accessibility" | "businesses" | "primitives" | "assets"
> & {
  businesses?: readonly ProjectType[];
  primitives?: readonly string[];
  assets?: readonly SectionAsset[];
};
