import { ARCHETYPES, type Archetype } from "./archetypes";

const GENERAL_ARCHETYPE = ARCHETYPES[ARCHETYPES.length - 1] as Archetype;

export function detectArchetype(text: string): Archetype {
  let best: { archetype: Archetype; hits: number } | null = null;
  for (const archetype of ARCHETYPES) {
    const matches = text.match(new RegExp(archetype.keywords.source, "gi"));
    const hits = matches?.length ?? 0;
    if (hits > 0 && (!best || hits > best.hits)) best = { archetype, hits };
  }
  return best?.archetype ?? GENERAL_ARCHETYPE;
}
