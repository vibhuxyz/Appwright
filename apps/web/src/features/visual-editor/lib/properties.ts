export const PROPERTY_GROUPS = [
  {
    id: "layout",
    label: "Layout",
    properties: ["width", "height", "min-width", "max-width", "margin", "padding", "gap"],
  },
  {
    id: "typography",
    label: "Typography",
    properties: ["font-size", "font-weight", "line-height", "letter-spacing"],
  },
  {
    id: "appearance",
    label: "Appearance",
    properties: ["opacity", "border-radius", "border-width"],
  },
] as const;

export type PropertyGroup = (typeof PROPERTY_GROUPS)[number];

export const GESTURE_PROPERTIES: readonly string[] = ["width", "height", "padding", "gap"];

export const BREAKPOINT_WIDTHS_PX = { desktop: 1440, tablet: 1024, mobile: 390 } as const;

export const SPACING_SCALE_PX = [
  0, 1, 2, 4, 6, 8, 10, 12, 14, 16, 20, 24, 28, 32, 36, 40, 44, 48, 56, 64, 80, 96,
] as const;

export const RADIUS_SCALE_PX = [0, 2, 4, 6, 8, 12, 16, 24] as const;

export const FONT_SIZE_SCALE_PX = [12, 14, 16, 18, 20, 24, 30, 36, 48] as const;

export const SCALES_BY_PROPERTY: Readonly<Record<string, readonly number[]>> = {
  margin: SPACING_SCALE_PX,
  padding: SPACING_SCALE_PX,
  gap: SPACING_SCALE_PX,
  "border-radius": RADIUS_SCALE_PX,
  "font-size": FONT_SIZE_SCALE_PX,
};
