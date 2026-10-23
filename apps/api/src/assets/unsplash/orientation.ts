import type { UnsplashOrientation } from "@repo/contracts";

const RATIO_PATTERN = /^(\d+(?:\.\d+)?)\s*[:/]\s*(\d+(?:\.\d+)?)$/;
const SQUARISH_TOLERANCE = 0.15;

export function orientationForAspect(aspectRatio: string | undefined): UnsplashOrientation | undefined {
  const match = aspectRatio ? RATIO_PATTERN.exec(aspectRatio.trim()) : null;
  const width = Number(match?.[1]);
  const height = Number(match?.[2]);
  if (!match || !(width > 0) || !(height > 0)) return undefined;
  const ratio = width / height;
  if (Math.abs(ratio - 1) <= SQUARISH_TOLERANCE) return "squarish";
  return ratio > 1 ? "landscape" : "portrait";
}
