import { SKILL_ORDER } from "./constants";
import type { DesignSkillId, SkillSignals } from "./types";

function wants(id: DesignSkillId, signals: SkillSignals): boolean {
  switch (id) {
    case "visual-quality-review":
      return signals.isRepair;
    case "art-direction":
      return signals.isUiTask && !signals.isRepair;
    case "layout-composition":
      return signals.hasSections;
    case "motion-design":
      return signals.hasMotion;
    case "creative-interactions":
      return signals.hasInteraction && !signals.isRepair;
    case "visual-assets":
      return signals.hasImages;
    default: {
      const unreachable: never = id;
      return unreachable;
    }
  }
}

export function selectSkills(signals: SkillSignals): DesignSkillId[] {
  return SKILL_ORDER.filter((id) => wants(id, signals));
}
