import { useState } from "react";
import { applyReview, parseReviews, type SectionReview } from "@repo/ui-system/sections";

const STORAGE_KEY = "appwright.section-reviews";

function readStoredReviews(): SectionReview[] {
  if (typeof localStorage === "undefined") return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return parseReviews(JSON.parse(raw));
  } catch (error) {
    if (error instanceof SyntaxError) return [];
    throw error;
  }
}

export function useSectionReviews(): {
  reviews: SectionReview[];
  record: (review: SectionReview) => void;
} {
  const [reviews, setReviews] = useState<SectionReview[]>(readStoredReviews);
  const record = (review: SectionReview) => {
    setReviews((current) => {
      const next = applyReview(current, review);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };
  return { reviews, record };
}
