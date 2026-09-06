// Everything derives from one base. Changing `md` reshapes the whole product
// in one edit, which is exactly what `rounded-[30px]` scattered across forty
// files cannot do.
export const radiusBase = "0.625rem";

export const radius = {
  none: "0px",
  sm: "calc(var(--radius) - 4px)",
  md: "calc(var(--radius) - 2px)",
  lg: "var(--radius)",
  xl: "calc(var(--radius) + 4px)",
  "2xl": "calc(var(--radius) + 8px)",
  full: "9999px",
} as const;

export type RadiusName = keyof typeof radius;
