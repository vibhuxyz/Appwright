import type { UnsplashPhoto } from "@repo/contracts";
import { hasLegibleText } from "./legible-text";

export function pickUnusedPhoto(
  photos: readonly UnsplashPhoto[],
  usedPhotoIds: ReadonlySet<string>,
): UnsplashPhoto | undefined {
  return photos.find((photo) => !usedPhotoIds.has(photo.id) && !hasLegibleText(photo));
}
