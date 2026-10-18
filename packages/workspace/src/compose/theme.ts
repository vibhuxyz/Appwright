import {
  DARK_FOREGROUND,
  HEX_COLOR_PATTERN,
  LIGHT_BACKGROUND_LUMINANCE_THRESHOLD,
  LIGHT_FOREGROUND,
  THEME_IMPORT_LINE,
  TOKENS_IMPORT_LINE,
} from "./constants";

const MAX_CHANNEL = 255;
const RED_WEIGHT = 0.2126;
const GREEN_WEIGHT = 0.7152;
const BLUE_WEIGHT = 0.0722;

function channel(hexPair: string | undefined): number {
  return Number.parseInt(hexPair ?? "0", 16) / MAX_CHANNEL;
}

function luminance(hex: string): number | undefined {
  const match = HEX_COLOR_PATTERN.exec(hex);
  if (!match) return undefined;
  return (
    RED_WEIGHT * channel(match[1]) +
    GREEN_WEIGHT * channel(match[2]) +
    BLUE_WEIGHT * channel(match[3])
  );
}

export function themeCss(primaryHex: string): string | undefined {
  const value = luminance(primaryHex);
  if (value === undefined) return undefined;
  const foreground =
    value > LIGHT_BACKGROUND_LUMINANCE_THRESHOLD ? DARK_FOREGROUND : LIGHT_FOREGROUND;
  const block = `  --primary: ${primaryHex};\n  --primary-foreground: ${foreground};\n`;
  return `:root {\n${block}}\n\n.dark {\n${block}}\n`;
}

export function withThemeImport(globalsCss: string): string {
  if (globalsCss.includes(THEME_IMPORT_LINE)) return globalsCss;
  if (!globalsCss.includes(TOKENS_IMPORT_LINE)) return globalsCss;
  return globalsCss.replace(
    TOKENS_IMPORT_LINE,
    `${TOKENS_IMPORT_LINE}\n${THEME_IMPORT_LINE}`,
  );
}
