import { APP_SECTIONS } from "./app";
import { CHROME_SECTIONS } from "./chrome";
import { CLOSE_SECTIONS } from "./close";
import { COMMERCE_SECTIONS } from "./commerce";
import { CREATIVE_SECTIONS } from "./creative";
import { EDITORIAL_SECTIONS } from "./editorial";
import { HOME_SECTIONS } from "./home";
import { MIDDLE_SECTIONS } from "./middle";
import { PRODUCT_SECTIONS } from "./product";
import type { SectionEntry } from "../registry";

export const SECTION_CATALOG: readonly SectionEntry[] = [
  ...CHROME_SECTIONS,
  ...HOME_SECTIONS,
  ...MIDDLE_SECTIONS,
  ...CLOSE_SECTIONS,
  ...APP_SECTIONS,
  ...EDITORIAL_SECTIONS,
  ...COMMERCE_SECTIONS,
  ...PRODUCT_SECTIONS,
  ...CREATIVE_SECTIONS,
].sort((left, right) => left.id.localeCompare(right.id));

export function sectionById(id: string): SectionEntry | undefined {
  return SECTION_CATALOG.find((section) => section.id === id);
}
