import { THEME_OPTION_COUNT, type ThemeOption } from "@repo/contracts";
import type { Archetype } from "./archetypes";
import { buildPalette, type PaletteVariant } from "./build-palette";
import { hexToHsl, isHex } from "./color";
import { hueHints, wantsDark } from "./color-words";
import { detectArchetype } from "./detect-archetype";

export interface PresetInput {
  text: string;
  description?: string;
  referenceColors?: readonly string[];
}

interface Recipe {
  id: string;
  name: string;
  tagline: string;
  style: string;
  voice: string;
  density: NonNullable<ThemeOption["density"]>;
  variant: PaletteVariant;
  mood: "light" | "dark";
  hueSlot: 0 | 1 | 2;
  pairSlot: 0 | 1 | 2 | 3 | 4;
  radius: ThemeOption["radius"];
  saturation: number;
}

const RECIPES: readonly Recipe[] = [
  { id: "signature", name: "Signature", tagline: "Balanced and confident, built around one clear brand colour.", style: "minimal-premium", voice: "Clear, confident, unhurried.", density: "comfortable", variant: "standard", mood: "light", hueSlot: 0, pairSlot: 0, radius: "md", saturation: 72 },
  { id: "soft-glow", name: "Soft Glow", tagline: "Gentle tinted surfaces and friendly, rounded shapes.", style: "soft-friendly", voice: "Warm, friendly, lightly playful.", density: "spacious", variant: "soft", mood: "light", hueSlot: 1, pairSlot: 1, radius: "lg", saturation: 70 },
  { id: "bold-pop", name: "Bold Pop", tagline: "High-energy colour contrast that gets noticed.", style: "bold-modern", voice: "Direct, energetic, a little loud.", density: "comfortable", variant: "bold", mood: "light", hueSlot: 2, pairSlot: 2, radius: "sm", saturation: 84 },
  { id: "midnight", name: "Midnight", tagline: "A dark, premium look with glowing accents.", style: "dark-premium", voice: "Quiet luxury. Short sentences.", density: "compact", variant: "standard", mood: "dark", hueSlot: 0, pairSlot: 3, radius: "md", saturation: 78 },
  { id: "editorial", name: "Editorial", tagline: "Warm paper tones and refined serif headlines.", style: "editorial", voice: "Measured, literary, precise.", density: "spacious", variant: "editorial", mood: "light", hueSlot: 1, pairSlot: 4, radius: "none", saturation: 60 },
];

function designCopy(recipe: Recipe, trade: string): Pick<ThemeOption, "voice" | "summary" | "dos" | "donts"> {
  const ground = recipe.mood === "dark" ? "ink and one accent" : "white, ink and one accent";
  return {
    voice: recipe.voice,
    summary: `${recipe.tagline} A ${recipe.style} system for ${trade}: ${recipe.mood} ground, ${recipe.density} density, ${recipe.radius} corners.`,
    dos: [
      `Give each screen one full-bleed hue; let ${ground} do the rest.`,
      `Keep ${recipe.density} density — do not mix compact and spacious on one screen.`,
      `Radius stays ${recipe.radius} on every control.`,
      `Write in this voice: ${recipe.voice}`,
      "One hero number or word per screen; supporting line in the body face.",
    ],
    donts: [
      "Do not put white body copy on a saturated ground that fails AA.",
      "Do not add card shadows or extra borders; layer colour instead.",
      "Do not introduce a third typeface.",
      "Do not fill a screen with four competing cards.",
      "Do not use emoji in chrome.",
    ],
  };
}

function seedHues(archetype: Archetype, input: PresetInput): readonly [number, number, number] {
  const fromReference = (input.referenceColors ?? []).filter(isHex).map((hex) => hexToHsl(hex).hue);
  const hints = [...fromReference, ...hueHints(input.description ?? "")];
  const [first, second, third] = archetype.hues;
  return [hints[0] ?? first, hints[1] ?? hints[0] ?? second, hints[2] ?? hints[0] ?? third];
}

function referenceSaturation(input: PresetInput): number | undefined {
  const first = (input.referenceColors ?? []).find(isHex);
  return first ? Math.max(35, hexToHsl(first).saturation) : undefined;
}

function applyDarkPreference(recipes: readonly Recipe[], prefersDark: boolean): Recipe[] {
  if (!prefersDark) return [...recipes];
  return recipes.map((recipe, index) => (index === 1 ? { ...recipe, mood: "dark" as const } : recipe));
}

export function presetThemes(input: PresetInput): ThemeOption[] {
  const archetype = detectArchetype(`${input.text} ${input.description ?? ""}`);
  const hues = seedHues(archetype, input);
  const forcedSaturation = referenceSaturation(input);
  const recipes = applyDarkPreference(RECIPES, wantsDark(input.description ?? ""));
  const exactPrimary = (input.referenceColors ?? []).find(isHex);
  return recipes.slice(0, THEME_OPTION_COUNT).map((recipe, index) => {
    const pair = archetype.pairs[recipe.pairSlot];
    return {
      id: recipe.id,
      name: recipe.name,
      tagline: recipe.tagline,
      mood: recipe.mood,
      palette: buildPalette({
        hue: hues[recipe.hueSlot],
        saturation: forcedSaturation ?? recipe.saturation,
        mood: recipe.mood,
        variant: recipe.variant,
        ...(index === 0 && exactPrimary ? { primaryHex: exactPrimary } : {}),
      }),
      fonts: { heading: pair.heading, body: pair.body },
      radius: recipe.radius,
      style: recipe.style,
      density: recipe.density,
      ...designCopy(recipe, archetype.id.replaceAll("-", " ")),
    };
  });
}
