import { useEffect } from "react";
import { googleFontsUrl, type ThemeOption } from "@repo/contracts";

export function useThemeFonts(themes: readonly ThemeOption[]): void {
  const fontUrl = themes.length > 0
    ? googleFontsUrl(themes.flatMap((theme) => [theme.fonts.heading, theme.fonts.body]))
    : null;

  useEffect(() => {
    if (!fontUrl) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = fontUrl;
    document.head.append(link);
    return () => link.remove();
  }, [fontUrl]);
}
