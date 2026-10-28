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
