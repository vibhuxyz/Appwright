import type { DesignBlock, PlannedSection, SectionSurface } from "@repo/contracts";
import { PlannedSectionSchema } from "@repo/contracts";
import type { SectionEntry } from "../registry";

const RHYTHM: readonly SectionSurface[] = ["canvas", "muted", "canvas", "inverse", "canvas", "muted", "canvas", "muted"];
const MAX_REASON = 180;

interface SurfaceState {
  imageUsed: boolean;
  inverseUsed: boolean;
  previous: SectionSurface | null;
}

function clip(text: string, max: number): string {
  const flat = text.replace(/\s+/g, " ").trim();
  return flat.length <= max ? flat : flat.slice(0, max).trimEnd();
}

function nextSurface(entry: SectionEntry, index: number, state: SurfaceState): SectionSurface {
  const needsHeroImage = entry.purpose === "hero" && entry.assets.some((asset) => asset.required);
  if (needsHeroImage && !state.imageUsed) return "image";
  if (entry.purpose === "cta" && !state.inverseUsed) return "inverse";
  let surface = RHYTHM[index] ?? "canvas";
  if (surface === "inverse" && state.inverseUsed) surface = "muted";
  if (surface === state.previous) surface = surface === "canvas" ? "muted" : "canvas";
  return surface;
}

function toPlanned(entry: SectionEntry, surface: SectionSurface, density: DesignBlock["density"], style: string, projectType: string): PlannedSection {
  const aspect = entry.assets[0]?.aspect;
  return PlannedSectionSchema.parse({
    sectionId: entry.id,
    variantId: entry.variantId,
    purpose: entry.purpose,
    reason: clip(`${entry.name} fits ${projectType} and ${style}.`, MAX_REASON),
    layoutPattern: entry.layoutPattern,
    surface,
    width: entry.width,
    spacing: density,
    ...(aspect ? { imageAspect: aspect } : {}),
    assetPurposes: entry.assets.map((asset) => asset.purpose),
    contentFields: entry.contentFields.slice(0, 8),
    interactions: entry.interactions.slice(0, 4),
    responsive: clip(entry.responsive, MAX_REASON),
  });
}

export function assignRhythm(entries: readonly SectionEntry[], density: DesignBlock["density"], style: string, projectType: string): PlannedSection[] {
  const planned: PlannedSection[] = [];
  const state: SurfaceState = { imageUsed: false, inverseUsed: false, previous: null };
  for (let index = 0; index < entries.length; index += 1) {
    const entry = entries[index];
    if (!entry) continue;
    const surface = nextSurface(entry, index, state);
    if (surface === "image") state.imageUsed = true;
    if (surface === "inverse") state.inverseUsed = true;
    state.previous = surface;
    planned.push(toPlanned(entry, surface, density, style, projectType));
  }
  return planned;
}
