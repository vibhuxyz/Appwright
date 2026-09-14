import {
  breakpoints,
  colors,
  fontSize,
  letterSpacing,
  radius,
  shadows,
  spacing,
} from "../tokens";

// The same scale as a plain object, for anything that reads config rather
// than CSS — a Tailwind v3 template, a docs page listing the scale, and
// (at V4) the validator that has to answer "is `p-7` on the scale?".
//
// One definition, several jobs (D10). The moment this is derived by hand
// instead of from ../tokens, the two answers start disagreeing.
export function emitTailwindTheme() {
  return {
    colors: Object.fromEntries(
      Object.entries(colors).map(([name]) => [name, `var(--${name})`] as const),
    ),
    spacing: { ...spacing },
    borderRadius: { ...radius },
    fontSize: Object.fromEntries(
      Object.entries(fontSize).map(
        ([name, step]) => [name, [step.size, step.lineHeight]] as const,
      ),
    ),
    letterSpacing: { ...letterSpacing },
    boxShadow: { ...shadows },
    screens: { ...breakpoints },
  };
}

// Flat list of every class suffix the scale legitimises. This is the data
// V4's validator needs and the reason the registry is exported as data
// rather than rendered straight into a prompt string.
export function scaleSuffixes() {
  return {
    color: Object.keys(colors),
    spacing: Object.keys(spacing),
    radius: Object.keys(radius),
    text: Object.keys(fontSize),
    tracking: Object.keys(letterSpacing),
    shadow: Object.keys(shadows),
    breakpoint: Object.keys(breakpoints),
  };
}
