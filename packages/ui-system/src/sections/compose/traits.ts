import type { MotionLevel } from "../../patterns";
import { patternById } from "../../patterns";
import type { SectionEntry } from "../registry";
import { DENSITY_BY_LAYOUT } from "./constants";
import type { VisualDensity } from "./types";

const MOTION_RANK: Readonly<Record<MotionLevel, number>> = { none: 0, subtle: 1, expressive: 2 };

export function densityOfLayout(layoutPattern: string): VisualDensity {
  return DENSITY_BY_LAYOUT[layoutPattern] ?? "medium";
}

export function motionOf(section: Pick<SectionEntry, "patternId">): MotionLevel {
  return section.patternId ? (patternById(section.patternId)?.motion ?? "none") : "none";
}

export function strongestMotion(levels: readonly MotionLevel[]): MotionLevel {
  return levels.reduce<MotionLevel>((top, level) => (MOTION_RANK[level] > MOTION_RANK[top] ? level : top), "none");
}
