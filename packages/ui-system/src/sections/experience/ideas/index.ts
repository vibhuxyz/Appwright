import type { SignatureIdea } from "../types";
import { CLASSIC_IDEAS } from "./classic";
import { COMMERCE_IDEAS } from "./commerce";
import { EDITORIAL_IDEAS } from "./editorial";
import { LOCAL_IDEAS } from "./local";
import { PRODUCT_IDEAS } from "./product";

export const SIGNATURE_IDEAS: readonly SignatureIdea[] = [
  ...COMMERCE_IDEAS,
  ...EDITORIAL_IDEAS,
  ...PRODUCT_IDEAS,
  ...LOCAL_IDEAS,
  ...CLASSIC_IDEAS,
];

export const SUPPORTING_EFFECTS: Readonly<Record<string, readonly string[]>> = {
  commerce: [],
  editorial: ["grain"],
  product: ["highlight-text"],
  local: ["highlight-text"],
  classic: [],
};

export const FOUNDATION_EFFECT_IDS: readonly string[] = ["smooth-scroll"];

export const PINNED_STATEMENT_EFFECT_ID = "scroll-words";

export const PINNED_STATEMENT_HOSTS: readonly string[] = ["statement.manifesto", "brand.intro", "story.narrative"];
