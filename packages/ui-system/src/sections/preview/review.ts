const MAX_REVIEWS = 40;
const MAX_NOTE = 200;

export interface SectionReview {
  sectionId: string;
  decision: "approved" | "rejected";
  note: string;
}

function isReview(value: unknown): value is SectionReview {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.sectionId === "string" &&
    (record.decision === "approved" || record.decision === "rejected") &&
    typeof record.note === "string"
  );
}

export function parseReviews(value: unknown): SectionReview[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isReview).slice(0, MAX_REVIEWS);
}

export function applyReview(reviews: readonly SectionReview[], review: SectionReview): SectionReview[] {
  const note = review.note.replace(/\s+/g, " ").trim().slice(0, MAX_NOTE);
  const next = reviews.filter((item) => item.sectionId !== review.sectionId);
  next.push({ sectionId: review.sectionId, decision: review.decision, note });
  return next.slice(-MAX_REVIEWS);
}
