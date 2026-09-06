// Tailwind's own values, restated here so the scale has exactly one home.
// A template that redeclares these is the drift this package exists to stop.
export const breakpoints = {
  sm: "40rem",
  md: "48rem",
  lg: "64rem",
  xl: "80rem",
  "2xl": "96rem",
} as const;

export type BreakpointName = keyof typeof breakpoints;
