import type { UnsplashPhoto } from "@repo/contracts";

export function pickUnusedPhoto(
  photos: readonly UnsplashPhoto[],
  usedPhotoIds: ReadonlySet<string>,
): UnsplashPhoto | undefined {
  return photos.find((photo) => !usedPhotoIds.has(photo.id));
}
