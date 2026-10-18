export const THEME_CSS_PATH = "src/app/theme.css";
export const GLOBALS_CSS_PATH = "src/app/globals.css";
export const THEME_IMPORT_LINE = '@import "./theme.css";';
export const TOKENS_IMPORT_LINE = '@import "./tokens.css";';

export const DEPENDENCIES_BY_CHOICE: Readonly<Record<string, readonly string[]>> = {
  stripe: ["stripe"],
  websockets: ["ws"],
  "local-uploads": [],
  "postgres-fulltext": [],
};

export const HEX_COLOR_PATTERN = /^#([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/;
export const LIGHT_FOREGROUND = "oklch(0.985 0 0)";
export const DARK_FOREGROUND = "oklch(0.145 0 0)";
export const LIGHT_BACKGROUND_LUMINANCE_THRESHOLD = 0.5;
