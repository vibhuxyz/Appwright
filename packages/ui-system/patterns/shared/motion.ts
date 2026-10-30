export const EASE_OUT = [0.23, 1, 0.32, 1] as const;
export const EASE_IN_OUT = [0.77, 0, 0.175, 1] as const;

export const DURATION_S = {
  exit: 0.15,
  reducedFade: 0.15,
  panel: 0.3,
  reveal: 0.5,
  overlay: 0.5,
  hero: 0.8,
  heroImage: 1.2,
} as const;

export const STAGGER_S = {
  word: 0.035,
  item: 0.05,
  chunk: 0.1,
} as const;

export const REVEAL_OFFSET_PX = 16;
export const SCROLL_REVEAL_OFFSET_PX = 40;
export const SCROLL_REVEAL_SCALE = 0.96;
export const EXIT_OFFSET_PX = -12;

export const INTENSITY_PX = {
  subtle: { parallax: 24, drift: 6 },
  expressive: { parallax: 56, drift: 12 },
} as const;

export type MotionIntensity = keyof typeof INTENSITY_PX;

export const REVEAL_ROOT_MARGIN = "0px 0px -10% 0px";

export function cssEase(curve: readonly [number, number, number, number]): string {
  return `cubic-bezier(${curve.join(", ")})`;
}
