import type { ArtDirection } from "../registry";

export const DIRECTION_ORDER: readonly Exclude<ArtDirection, "classic">[] = ["commerce", "editorial", "product", "local"];

export const DIRECTION_KEYWORDS: Readonly<Record<Exclude<ArtDirection, "classic">, RegExp>> = {
  commerce: /\b(shop|store|e-?commerce|fashion|apparel|clothing|sneakers?|shoes|footwear|streetwear|boutique|collections?|cart|checkout|catalogue|catalog|merch)\b/i,
  editorial: /\b(portfolio|studio|agency|photograph\w*|designer|architect\w*|magazine|editorial|creative|director|artist|gallery|case stud\w*)\b/i,
  product: /\b(saas|software|startup|api|developers?|ai|platform|app|automation|analytics|dashboard|integrations?|crm)\b/i,
  local: /\b(restaurant|cafe|bakery|salon|spa|clinic|dentist|gym|plumber|electrician|bar|hotel|local|neighbourhood|neighborhood|opening hours)\b/i,
};
