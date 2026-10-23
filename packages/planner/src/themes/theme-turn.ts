import { ThemeOptionSchema, type ThemeOption } from "@repo/contracts";

export interface ThemeTurn {
  role: "user";
  content: string;
  data: { intake: true; theme: ThemeOption };
}

function flatten(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

export function themeTurn(theme: ThemeOption): ThemeTurn {
  const { palette, fonts } = theme;
  const system = [
    theme.style ? `Style ${flatten(theme.style)}` : null,
    theme.density ? `density ${theme.density}` : null,
    theme.voice ? flatten(theme.voice) : null,
  ].filter((part): part is string => Boolean(part));
  const content = [
    `Design system chosen: ${flatten(theme.name)} (${theme.mood}). ${flatten(theme.tagline)}`,
    `Colours: background ${palette.background}, text ${palette.foreground}, primary ${palette.primary}, accent ${palette.accent}.`,
    `Typography: headings ${fonts.heading}, body ${fonts.body}. Corner radius: ${theme.radius}.`,
    ...(system.length > 0 ? [system.join(". ") + "."] : []),
    "Build the full app for this business with these tokens on every page. After the plan, wait for section images before writing screens.",
  ].join("\n");
  return { role: "user", content, data: { intake: true, theme } };
}

export function themeFromRowData(data: unknown): ThemeOption | undefined {
  if (!data || typeof data !== "object" || !("theme" in data)) return undefined;
  const parsed = ThemeOptionSchema.safeParse((data as { theme: unknown }).theme);
  return parsed.success ? parsed.data : undefined;
}

export function chosenThemeFromRows(rows: readonly { data: unknown }[]): ThemeOption | undefined {
  for (let index = rows.length - 1; index >= 0; index--) {
    const theme = themeFromRowData(rows[index]?.data);
    if (theme) return theme;
  }
  return undefined;
}
