import type { UnsplashPhoto } from "@repo/contracts";
import { hasLegibleText, photoWords } from "./legible-text";

function relevance(photo: UnsplashPhoto, queryWords: readonly string[]): number {
  const text = photoWords(photo);
  return queryWords.filter((word) => text.includes(word)).length;
}

export function pickUnusedPhoto(
  photos: readonly UnsplashPhoto[],
  usedPhotoIds: ReadonlySet<string>,
  queryWords: readonly string[] = [],
): UnsplashPhoto | undefined {
  const candidates = photos.filter((photo) => !usedPhotoIds.has(photo.id) && !hasLegibleText(photo));
  return candidates
    .map((photo, order) => ({ photo, order, score: relevance(photo, queryWords) }))
    .sort((left, right) => right.score - left.score || left.order - right.order)[0]?.photo;
}
