// Size and line-height travel together. Splitting them is how you end up
// with `text-[32px] leading-[72px]` — two independently invented numbers
// that only agree by accident.
export interface TypeStep {
  size: string;
  lineHeight: string;
}

export const fontSize = {
  xs: { size: "0.75rem", lineHeight: "1rem" },
  sm: { size: "0.875rem", lineHeight: "1.25rem" },
  base: { size: "1rem", lineHeight: "1.5rem" },
  lg: { size: "1.125rem", lineHeight: "1.75rem" },
  xl: { size: "1.25rem", lineHeight: "1.75rem" },
  "2xl": { size: "1.5rem", lineHeight: "2rem" },
  "3xl": { size: "1.875rem", lineHeight: "2.25rem" },
  "4xl": { size: "2.25rem", lineHeight: "2.5rem" },
  "5xl": { size: "3rem", lineHeight: "1.1" },
  "6xl": { size: "3.75rem", lineHeight: "1.05" },
  "7xl": { size: "4.5rem", lineHeight: "1" },
} as const satisfies Record<string, TypeStep>;

export const fontWeight = {
  normal: "400",
  medium: "500",
  semibold: "600",
  bold: "700",
} as const;

export const fontFamily = {
  sans: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
  mono: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
} as const;

export type FontSizeName = keyof typeof fontSize;

// Letter spacing. `caps` exists because an uppercase eyebrow label is a
// real, recurring design need and Tailwind's own scale stops at 0.1em —
// which is how BOTH templates independently produced `tracking-[0.2em]`
// from the same prompt. That is the escape-hatch question (O23) answered
// the way the rung says to answer it: a value the design genuinely needs
// goes into the scale once, it does not become a bracket value per file.
export const letterSpacing = {
  tighter: "-0.05em",
  tight: "-0.025em",
  normal: "0em",
  wide: "0.025em",
  wider: "0.05em",
  widest: "0.1em",
  caps: "0.2em",
} as const;

export type LetterSpacingName = keyof typeof letterSpacing;
