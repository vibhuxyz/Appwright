// A 4px step, capped where a real layout stops needing new values. The cap
// is the point: an open-ended scale is the same thing as no scale, and
// `p-[17px]` only looks reasonable when 16 and 20 are not both already here.
export const spacing = {
  0: "0px",
  px: "1px",
  0.5: "0.125rem",
  1: "0.25rem",
  1.5: "0.375rem",
  2: "0.5rem",
  2.5: "0.625rem",
  3: "0.75rem",
  3.5: "0.875rem",
  4: "1rem",
  5: "1.25rem",
  6: "1.5rem",
  8: "2rem",
  10: "2.5rem",
  12: "3rem",
  16: "4rem",
  20: "5rem",
  24: "6rem",
  32: "8rem",
  40: "10rem",
  48: "12rem",
  64: "16rem",
} as const;

export type SpacingName = keyof typeof spacing;
