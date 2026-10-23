import type { ThemePalette } from "@repo/contracts";
import { ensureContrast, fitFillToText, hslToHex, readableOn } from "./color";

export type PaletteVariant = "standard" | "soft" | "bold" | "editorial";

export interface PaletteSeed {
  hue: number;
  saturation: number;
  mood: "light" | "dark";
  variant: PaletteVariant;
  primaryHex?: string;
}

interface Tones {
  background: [number, number];
  foreground: [number, number];
  card: [number, number];
  primaryLightness: number;
  primarySaturationScale: number;
  secondary: [number, number];
  muted: [number, number];
  mutedForeground: [number, number];
  border: [number, number];
  accentShift: number;
}

const LIGHT_TONES: Record<PaletteVariant, Tones> = {
  standard: {
    background: [25, 98],
    foreground: [30, 10],
    card: [20, 100],
    primaryLightness: 46,
    primarySaturationScale: 1,
    secondary: [35, 93],
    muted: [25, 94],
    mutedForeground: [10, 38],
    border: [18, 88],
    accentShift: 35,
  },
  soft: {
    background: [45, 96],
    foreground: [28, 14],
    card: [40, 99],
    primaryLightness: 50,
    primarySaturationScale: 0.65,
    secondary: [45, 90],
    muted: [40, 92],
    mutedForeground: [14, 38],
    border: [30, 85],
    accentShift: -30,
  },
  bold: {
    background: [12, 98],
    foreground: [35, 8],
    card: [10, 100],
    primaryLightness: 42,
    primarySaturationScale: 1.15,
    secondary: [60, 92],
    muted: [20, 94],
    mutedForeground: [10, 36],
    border: [20, 86],
    accentShift: 150,
  },
  editorial: {
    background: [22, 95],
    foreground: [30, 8],
    card: [22, 98],
    primaryLightness: 22,
    primarySaturationScale: 0.5,
    secondary: [22, 90],
    muted: [18, 91],
    mutedForeground: [12, 36],
    border: [16, 80],
    accentShift: 20,
  },
};

const DARK_TONES: Tones = {
  background: [25, 8],
  foreground: [15, 96],
  card: [22, 12],
  primaryLightness: 62,
  primarySaturationScale: 1,
  secondary: [20, 17],
  muted: [18, 16],
  mutedForeground: [10, 68],
  border: [15, 22],
  accentShift: 40,
};

const MAX_SATURATION = 95;

function tone(hue: number, [saturation, lightness]: [number, number]): string {
  return hslToHex({ hue, saturation, lightness });
}

export function buildPalette(seed: PaletteSeed): ThemePalette {
  const tones = seed.mood === "dark" ? DARK_TONES : LIGHT_TONES[seed.variant];
  const { hue } = seed;
  const saturation = Math.min(MAX_SATURATION, seed.saturation * tones.primarySaturationScale);
  const background = tone(hue, tones.background);
  const card = tone(hue, tones.card);
  const secondary = tone(hue, tones.secondary);
  const muted = tone(hue, tones.muted);
  const primary = fitFillToText(
    seed.primaryHex ?? hslToHex({ hue, saturation, lightness: tones.primaryLightness }),
  );
  const accent = fitFillToText(
    hslToHex({ hue: hue + tones.accentShift, saturation: Math.min(MAX_SATURATION, saturation * 0.85), lightness: seed.mood === "dark" ? 62 : 52 }),
  );
  return {
    background,
    foreground: ensureContrast(tone(hue, tones.foreground), background),
    card,
    primary,
    primaryForeground: readableOn(primary),
    secondary,
    secondaryForeground: ensureContrast(tone(hue, tones.foreground), secondary),
    accent,
    accentForeground: readableOn(accent),
    muted,
    mutedForeground: ensureContrast(tone(hue, tones.mutedForeground), muted),
    border: tone(hue, tones.border),
  };
}
