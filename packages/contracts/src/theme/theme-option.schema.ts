import { z } from "zod";
import { PlanSummarySchema } from "../plan-summary";
import { THEME_FONT_NAMES } from "./fonts";

export const HexColorSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/);

export const ThemePaletteSchema = z.object({
  background: HexColorSchema,
  foreground: HexColorSchema,
  card: HexColorSchema,
  primary: HexColorSchema,
  primaryForeground: HexColorSchema,
  secondary: HexColorSchema,
  secondaryForeground: HexColorSchema,
  accent: HexColorSchema,
  accentForeground: HexColorSchema,
  muted: HexColorSchema,
  mutedForeground: HexColorSchema,
  border: HexColorSchema,
});
export type ThemePalette = z.infer<typeof ThemePaletteSchema>;

export const ThemeRadiusSchema = z.enum(["none", "sm", "md", "lg", "full"]);
export const ThemeDensitySchema = z.enum(["compact", "comfortable", "spacious"]);

export const ThemeRuleSchema = z.string().min(1).max(180);

export const ThemeOptionSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]{1,40}$/),
  name: z.string().min(1).max(40),
  tagline: z.string().min(1).max(140),
  mood: z.enum(["light", "dark"]),
  palette: ThemePaletteSchema,
  fonts: z.object({
    heading: z.enum(THEME_FONT_NAMES),
    body: z.enum(THEME_FONT_NAMES),
  }),
  radius: ThemeRadiusSchema,
  style: z.string().min(1).max(40).optional(),
  density: ThemeDensitySchema.optional(),
  voice: z.string().min(1).max(140).optional(),
  summary: z.string().min(1).max(400).optional(),
  dos: z.array(ThemeRuleSchema).min(1).max(6).optional(),
  donts: z.array(ThemeRuleSchema).min(1).max(6).optional(),
});
export type ThemeOption = z.infer<typeof ThemeOptionSchema>;

export const THEME_OPTION_COUNT = 5;
export const MAX_REFERENCE_COLORS = 8;
export const MAX_THEME_DESCRIPTION_CHARS = 400;

export const ThemeOptionsQuestion = z.object({
  need: z.string().min(1).max(40),
  text: z.string().min(1).max(280),
  label: z.string().min(1).max(40).optional(),
});
export type ThemeOptionsQuestion = z.infer<typeof ThemeOptionsQuestion>;

export const ThemeOptionsRequest = z.object({
  prompt: z.string().trim().min(1).max(4000),
  answers: z.record(z.string(), z.string().max(1000)).optional(),
  questions: z.array(ThemeOptionsQuestion).max(24).optional(),
  description: z.string().trim().min(1).max(MAX_THEME_DESCRIPTION_CHARS).optional(),
  referenceColors: z.array(HexColorSchema).max(MAX_REFERENCE_COLORS).optional(),
  plan: PlanSummarySchema.optional(),
});
export type ThemeOptionsRequest = z.infer<typeof ThemeOptionsRequest>;

export const ThemeOptionsResponse = z.object({
  themes: z.array(ThemeOptionSchema).length(THEME_OPTION_COUNT),
  source: z.enum(["ai", "preset"]),
});
export type ThemeOptionsResponse = z.infer<typeof ThemeOptionsResponse>;
