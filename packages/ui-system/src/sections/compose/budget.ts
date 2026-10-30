import type { Playbook } from "../playbook";
import { MAX_EXPRESSIVE_SECTIONS } from "./constants";

export function expressiveBudget(playbook: Playbook | null | undefined): number {
  return MAX_EXPRESSIVE_SECTIONS + (playbook?.motion.maxPinnedScenes ?? 0);
}
