// Elevation as a ladder, not a per-component invention. `sm` is a resting
// card, `lg` is something floating over the page, `xl` is a modal.
export const shadows = {
  none: "none",
  sm: "0 1px 2px 0 oklch(0 0 0 / 0.05)",
  md: "0 2px 4px -1px oklch(0 0 0 / 0.08), 0 1px 2px -1px oklch(0 0 0 / 0.06)",
  lg: "0 8px 16px -4px oklch(0 0 0 / 0.10), 0 2px 4px -2px oklch(0 0 0 / 0.06)",
  xl: "0 20px 32px -8px oklch(0 0 0 / 0.14), 0 4px 8px -4px oklch(0 0 0 / 0.08)",
} as const;

export type ShadowName = keyof typeof shadows;
