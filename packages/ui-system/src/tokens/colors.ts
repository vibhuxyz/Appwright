// Semantic names, not literal ones. `--color-primary` survives a rebrand;
// `--color-blue-600` becomes a lie the first time the brand changes and
// nobody renames 200 usages. Every value is oklch so lightening a shade is
// one number, not a new guess.
//
// The pairs are deliberate: every `x` has a `x-foreground` that is legible
// on it. That is what stops the agent picking a text colour by eye.

export interface ColorScale {
  light: string;
  dark: string;
}

export const colors = {
  background: { light: "oklch(1 0 0)", dark: "oklch(0.145 0 0)" },
  foreground: { light: "oklch(0.145 0 0)", dark: "oklch(0.985 0 0)" },

  card: { light: "oklch(1 0 0)", dark: "oklch(0.205 0 0)" },
  "card-foreground": { light: "oklch(0.145 0 0)", dark: "oklch(0.985 0 0)" },

  popover: { light: "oklch(1 0 0)", dark: "oklch(0.205 0 0)" },
  "popover-foreground": { light: "oklch(0.145 0 0)", dark: "oklch(0.985 0 0)" },

  primary: { light: "oklch(0.53 0.21 264)", dark: "oklch(0.66 0.19 264)" },
  "primary-foreground": { light: "oklch(0.985 0 0)", dark: "oklch(0.145 0 0)" },

  secondary: { light: "oklch(0.97 0 0)", dark: "oklch(0.269 0 0)" },
  "secondary-foreground": {
    light: "oklch(0.205 0 0)",
    dark: "oklch(0.985 0 0)",
  },

  muted: { light: "oklch(0.97 0 0)", dark: "oklch(0.269 0 0)" },
  "muted-foreground": { light: "oklch(0.556 0 0)", dark: "oklch(0.708 0 0)" },

  accent: { light: "oklch(0.97 0 0)", dark: "oklch(0.269 0 0)" },
  "accent-foreground": { light: "oklch(0.205 0 0)", dark: "oklch(0.985 0 0)" },

  destructive: {
    light: "oklch(0.577 0.245 27.3)",
    dark: "oklch(0.704 0.191 22.2)",
  },
  "destructive-foreground": {
    light: "oklch(0.985 0 0)",
    dark: "oklch(0.985 0 0)",
  },

  success: { light: "oklch(0.6 0.13 163)", dark: "oklch(0.7 0.14 163)" },
  "success-foreground": { light: "oklch(0.985 0 0)", dark: "oklch(0.145 0 0)" },

  warning: { light: "oklch(0.75 0.16 70)", dark: "oklch(0.82 0.15 70)" },
  "warning-foreground": { light: "oklch(0.145 0 0)", dark: "oklch(0.145 0 0)" },

  border: { light: "oklch(0.922 0 0)", dark: "oklch(1 0 0 / 12%)" },
  input: { light: "oklch(0.922 0 0)", dark: "oklch(1 0 0 / 16%)" },
  ring: { light: "oklch(0.53 0.21 264)", dark: "oklch(0.66 0.19 264)" },
} as const satisfies Record<string, ColorScale>;

export type ColorName = keyof typeof colors;
