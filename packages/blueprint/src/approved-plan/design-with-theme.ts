import type { DesignBlock, ThemeOption } from "@repo/contracts";

export function designWithTheme(design: DesignBlock, theme: ThemeOption | undefined): DesignBlock {
  if (!theme) return design;
  return {
    ...design,
    theme,
    primaryColor: theme.palette.primary,
    accentColor: theme.palette.accent,
    fontFamily: theme.fonts.body,
    colorMode: theme.mood,
    radius: theme.radius,
    ...(theme.density ? { density: theme.density } : {}),
    ...(theme.style ? { style: theme.style } : {}),
  };
}
