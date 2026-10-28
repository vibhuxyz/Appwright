import { THEME_FONTS, fontStack, googleFontsUrl, type ThemeFontName, type ThemeOption } from "@repo/contracts";

const SINGLE_WEIGHT = "400";
export interface ThemeStylesheet {
  readonly globalsPath: string;
  readonly themePath: string;
}

export const THEME_STYLESHEETS: readonly ThemeStylesheet[] = [
  { globalsPath: "src/app/globals.css", themePath: "src/app/theme.css" },
  { globalsPath: "src/index.css", themePath: "src/theme.css" },
];

const THEME_IMPORT_LINE = '@import "./theme.css";';
const TOKENS_IMPORT = /^@import\s+["']\.\/tokens\.css["'];[ \t]*$/m;
const TAILWIND_IMPORT = /^@import\s+["']tailwindcss["'];[ \t]*$/m;
const LAST_IMPORT = /^@import[^\n]*$(?![\s\S]*^@import)/m;
const OUR_FONT_IMPORT = /^@import url\("https:\/\/fonts\.googleapis\.com[^\n]*\n/gm;

const RADIUS_REM: Record<ThemeOption["radius"], string> = {
  none: "0rem",
  sm: "0.375rem",
  md: "0.625rem",
  lg: "1rem",
  full: "1.5rem",
};

export function fontsImportLine(theme: ThemeOption): string {
  return `@import url("${googleFontsUrl([theme.fonts.heading, theme.fonts.body])}");`;
}

export function themeCss(theme: ThemeOption): string {
  const { palette, fonts } = theme;
  const body = fontStack(fonts.body);
  const heading = fontStack(fonts.heading);
  return `:root {
  color-scheme: ${theme.mood};
  --radius: ${RADIUS_REM[theme.radius]};
  --background: ${palette.background};
  --foreground: ${palette.foreground};
  --card: ${palette.card};
  --card-foreground: ${palette.foreground};
  --popover: ${palette.card};
  --popover-foreground: ${palette.foreground};
  --primary: ${palette.primary};
  --primary-foreground: ${palette.primaryForeground};
  --secondary: ${palette.secondary};
  --secondary-foreground: ${palette.secondaryForeground};
  --accent: ${palette.accent};
  --accent-foreground: ${palette.accentForeground};
  --muted: ${palette.muted};
  --muted-foreground: ${palette.mutedForeground};
  --border: ${palette.border};
  --input: ${palette.border};
  --ring: ${palette.primary};
}

@theme inline {
  --font-heading: ${heading};
  --font-body: ${body};
}

body {
  font-family: ${body};
}

h1, h2, h3, h4, h5, h6 {
  font-family: ${heading};${headingWeightRule(fonts.heading)}
}

::selection {
  background: var(--primary);
  color: var(--primary-foreground);
}
`;
}

function headingWeightRule(heading: ThemeFontName): string {
  return THEME_FONTS[heading].weights === SINGLE_WEIGHT ? "\n  font-weight: 400;" : "";
}

function withThemeImport(css: string): string {
  if (css.includes(THEME_IMPORT_LINE)) return css;
  for (const anchor of [TOKENS_IMPORT, TAILWIND_IMPORT, LAST_IMPORT]) {
    const match = anchor.exec(css);
    if (match) {
      const end = match.index + match[0].length;
      return `${css.slice(0, end)}\n${THEME_IMPORT_LINE}${css.slice(end)}`;
    }
  }
  return `${THEME_IMPORT_LINE}\n${css}`;
}

export function withThemeImports(css: string, theme: ThemeOption): string {
  const withoutFonts = css.replace(OUR_FONT_IMPORT, "");
  return `${fontsImportLine(theme)}\n${withThemeImport(withoutFonts)}`;
}
