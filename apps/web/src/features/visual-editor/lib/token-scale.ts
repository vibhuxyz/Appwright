import { SCALES_BY_PROPERTY } from "./properties";

const PIXEL_VALUE = /^(-?\d+(?:\.\d+)?)px$/;

export function parsePixels(value: string): number | null {
  const match = PIXEL_VALUE.exec(value.trim());
  const pixels = Number(match?.[1]);
  return match && Number.isFinite(pixels) ? pixels : null;
}

export function isOnScale(property: string, pixels: number): boolean {
  const scale = SCALES_BY_PROPERTY[property];
  return scale === undefined || scale.includes(pixels);
}

export function snapToScale(property: string, pixels: number): number {
  const scale = SCALES_BY_PROPERTY[property];
  if (scale === undefined) return pixels;
  return scale.reduce((best, step) =>
    Math.abs(step - pixels) < Math.abs(best - pixels) ? step : best,
  );
}

export function describeTokenFit(property: string, value: string): "token" | "raw" | "free" {
  const pixels = parsePixels(value);
  if (pixels === null || SCALES_BY_PROPERTY[property] === undefined) return "free";
  return isOnScale(property, pixels) ? "token" : "raw";
}
