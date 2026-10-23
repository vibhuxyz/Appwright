import { THEME_FONT_NAMES, ThemeDensitySchema, ThemeOptionSchema, ThemeRadiusSchema, type ThemeFontName, type ThemeOption, type ThemePalette } from "@repo/contracts";
import { z } from "zod";
import { ensureContrast, fitFillToText, isHex, readableOn } from "./color";

const LOOSE_THEME = z.object({
  name: z.string().min(1),
  tagline: z.string().min(1),
  mood: z.enum(["light", "dark"]),
  palette: z.record(z.string(), z.string()),
  fonts: z.object({ heading: z.string(), body: z.string() }),
  radius: z.string(),
  style: z.string().optional(),
  density: z.string().optional(),
  voice: z.string().optional(),
  summary: z.unknown().optional(),
  dos: z.unknown().optional(),
  donts: z.unknown().optional(),
});

function readSummary(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const summary = value.replace(/\s+/g, " ").trim().slice(0, 400);
  return summary.length > 0 ? summary : undefined;
}

function readRules(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const rules: string[] = [];
  for (const item of value) {
    if (typeof item !== "string") continue;
    const rule = item.replace(/\s+/g, " ").trim().slice(0, 180);
    if (rule.length === 0) continue;
    rules.push(rule);
    if (rules.length === 6) break;
  }
  return rules.length > 0 ? rules : undefined;
}

const LOOSE_RESPONSE = z.object({ themes: z.array(z.unknown()) });
const FENCE = /^```(?:json)?\s*([\s\S]*?)\s*```$/;
const PALETTE_KEYS = [
  "background", "foreground", "card", "primary", "primaryForeground", "secondary",
  "secondaryForeground", "accent", "accentForeground", "muted", "mutedForeground", "border",
] as const;
const FALLBACK_HEADING: ThemeFontName = "Playfair Display";
const FALLBACK_BODY: ThemeFontName = "Inter";
const MAX_ID_LENGTH = 40;

function slugify(name: string): string {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return slug.slice(0, MAX_ID_LENGTH) || "theme";
}

function matchFont(name: string, fallback: ThemeFontName): ThemeFontName {
  const found = THEME_FONT_NAMES.find((font) => font.toLowerCase() === name.trim().toLowerCase());
  return found ?? fallback;
}

function readPalette(raw: Record<string, string>): ThemePalette | null {
  if (!PALETTE_KEYS.every((key) => isHex(raw[key]))) return null;
  const pick = (key: (typeof PALETTE_KEYS)[number]) => (raw[key] as string).toLowerCase();
  const background = pick("background");
  const secondary = pick("secondary");
  const muted = pick("muted");
  const primary = fitFillToText(pick("primary"));
  const accent = fitFillToText(pick("accent"));
  return {
    background,
    foreground: ensureContrast(pick("foreground"), background),
    card: pick("card"),
    primary,
    primaryForeground: readableOn(primary),
    secondary,
    secondaryForeground: ensureContrast(pick("secondaryForeground"), secondary),
    accent,
    accentForeground: readableOn(accent),
    muted,
    mutedForeground: ensureContrast(pick("mutedForeground"), muted),
    border: pick("border"),
  };
}

function toTheme(candidate: unknown, usedIds: Set<string>): ThemeOption | null {
  const loose = LOOSE_THEME.safeParse(candidate);
  if (!loose.success) return null;
  const palette = readPalette(loose.data.palette);
  const radius = ThemeRadiusSchema.safeParse(loose.data.radius);
  if (!palette || !radius.success) return null;
  const baseId = slugify(loose.data.name);
  let id = baseId;
  for (let suffix = 2; usedIds.has(id); suffix++) id = `${baseId.slice(0, MAX_ID_LENGTH - 3)}-${suffix}`;
  const density = ThemeDensitySchema.safeParse(loose.data.density);
  const style = loose.data.style?.replace(/\s+/g, " ").trim().slice(0, 40);
  const voice = loose.data.voice?.replace(/\s+/g, " ").trim().slice(0, 140);
  const summary = readSummary(loose.data.summary);
  const dos = readRules(loose.data.dos);
  const donts = readRules(loose.data.donts);
  const theme = ThemeOptionSchema.safeParse({
    id,
    name: loose.data.name.slice(0, 40),
    tagline: loose.data.tagline.slice(0, 140),
    mood: loose.data.mood,
    palette,
    fonts: {
      heading: matchFont(loose.data.fonts.heading, FALLBACK_HEADING),
      body: matchFont(loose.data.fonts.body, FALLBACK_BODY),
    },
    radius: radius.data,
    ...(style ? { style } : {}),
    ...(density.success ? { density: density.data } : {}),
    ...(voice ? { voice } : {}),
    ...(summary ? { summary } : {}),
    ...(dos ? { dos } : {}),
    ...(donts ? { donts } : {}),
  });
  if (!theme.success) return null;
  usedIds.add(id);
  return theme.data;
}

export function parseGeneratedThemes(raw: string): ThemeOption[] {
  const trimmed = raw.trim();
  const text = FENCE.exec(trimmed)?.[1] ?? trimmed;
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch (error) {
    if (error instanceof SyntaxError) return [];
    throw error;
  }
  const response = LOOSE_RESPONSE.safeParse(json);
  if (!response.success) return [];
  const usedIds = new Set<string>();
  return response.data.themes.flatMap((candidate) => {
    const theme = toTheme(candidate, usedIds);
    return theme ? [theme] : [];
  });
}
