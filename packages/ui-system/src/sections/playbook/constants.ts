import type { PlaybookId } from "./types";

export const PLAYBOOK_ORDER: readonly PlaybookId[] = ["commerce", "hospitality", "studio", "agency"];

export const PLAYBOOK_KEYWORDS: Readonly<Record<PlaybookId, RegExp>> = {
  commerce: /\b(shop|store|e-?commerce|grocery|groceries|sneakers?|apparel|footwear|furniture|cart|checkout|catalogue|catalog|merch|boutique)\b/i,
  hospitality: /\b(hotel|hotels|resort|resorts|villa|residences?|apartments?|real estate|property|properties|developments?|booking|suites?)\b/i,
  studio: /\b(architect\w*|building design\w*|interior design\w*|home design\w*|builder|builders|renovation|studio)\b/i,
  agency: /\b(agency|consultanc\w*|consulting|b2b|marketing|advisory|firm|enterprise)\b/i,
};
