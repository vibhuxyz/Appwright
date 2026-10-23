import type { ProjectType } from "@repo/contracts";
import { sourceById, type SectionEntry } from "../registry";
import type { SectionReview } from "./review";

export interface SectionFilter {
  text: string;
  business: ProjectType | "all";
  layout: string | "all";
  style: string | "all";
  license: "all" | "commercial";
  quality: "all" | "accepted";
  review: "all" | "approved" | "rejected" | "unreviewed";
}

export const EMPTY_SECTION_FILTER: SectionFilter = {
  text: "",
  business: "all",
  layout: "all",
  style: "all",
  license: "all",
  quality: "all",
  review: "all",
};

function reviewOf(id: string, reviews: readonly SectionReview[]): SectionReview["decision"] | "unreviewed" {
  return reviews.find((review) => review.sectionId === id)?.decision ?? "unreviewed";
}

function matches(section: SectionEntry, filter: SectionFilter, reviews: readonly SectionReview[]): boolean {
  const haystack = `${section.name} ${section.description} ${section.purpose} ${section.characteristics.join(" ")}`.toLowerCase();
  if (filter.text.trim() && !haystack.includes(filter.text.trim().toLowerCase())) return false;
  if (filter.business !== "all" && section.businesses.length > 0 && !section.businesses.includes(filter.business)) return false;
  if (filter.layout !== "all" && section.layoutPattern !== filter.layout) return false;
  if (filter.style !== "all" && !section.styles.includes(filter.style)) return false;
  if (filter.quality !== "all" && section.quality !== filter.quality) return false;
  if (filter.license === "commercial" && !sourceById(section.sourceId)?.commercialUse) return false;
  if (filter.review !== "all" && reviewOf(section.id, reviews) !== filter.review) return false;
  return true;
}

export function filterSections(
  sections: readonly SectionEntry[],
  filter: SectionFilter,
  reviews: readonly SectionReview[] = [],
): SectionEntry[] {
  return sections.filter((section) => matches(section, filter, reviews)).sort((left, right) => left.id.localeCompare(right.id));
}
