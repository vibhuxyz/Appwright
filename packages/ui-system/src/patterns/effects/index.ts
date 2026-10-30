import type { EffectEntry } from "../types";
import { OWN_INTERACTIVE_EFFECTS } from "./own-interactive";
import { OWN_MOTION_EFFECTS } from "./own-motion";
import { OWN_SCENE_EFFECTS } from "./own-scene";
import { VENDORED_EFFECTS } from "./vendored";

export { VENDORED_EFFECTS };

export const EFFECTS: readonly EffectEntry[] = [...VENDORED_EFFECTS, ...OWN_MOTION_EFFECTS, ...OWN_SCENE_EFFECTS, ...OWN_INTERACTIVE_EFFECTS];

const effectsById = new Map(EFFECTS.map((effect) => [effect.id, effect]));

export function effectById(id: string): EffectEntry | undefined {
  return effectsById.get(id);
}
