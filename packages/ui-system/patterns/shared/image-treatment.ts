import type { CSSProperties } from "react";
import {
  DURATION_S,
  EASE_OUT,
  cssEase,
} from "@/components/patterns/shared/motion";
import type { RevealState } from "@/components/patterns/shared/reveal-state";

export type ImageEntrance = "none" | "fade" | "wipe" | "mask";
export type ImageHover = "none" | "zoom" | "grayscale";

export interface FocalPoint {
  x: number;
  y: number;
}

const MASK_START_SCALE = 1.12;
const PERCENT_MAX = 100;

export const HOVER_FRAME_CLASS: Record<ImageHover, string> = {
  none: "",
  zoom: "group",
  grayscale: "group",
};

export const HOVER_IMAGE_CLASS: Record<ImageHover, string> = {
  none: "",
  zoom: "transition-transform duration-700 ease-out motion-safe:group-hover:scale-105",
  grayscale:
    "transition duration-500 ease-out pointer-fine:grayscale pointer-fine:group-hover:grayscale-0",
};

function clampPercent(value: number): number {
  return Math.min(PERCENT_MAX, Math.max(0, value));
}

export function objectPosition(focalPoint: FocalPoint | undefined): CSSProperties | undefined {
  if (!focalPoint) return undefined;
  return { objectPosition: `${clampPercent(focalPoint.x)}% ${clampPercent(focalPoint.y)}%` };
}

function transition(property: string, durationS: number): string {
  return `${property} ${durationS}s ${cssEase(EASE_OUT)}`;
}

export function frameEntranceStyle(
  entrance: ImageEntrance,
  state: RevealState,
  shouldReduceMotion: boolean,
): CSSProperties | undefined {
  if (entrance === "none" || state === "idle") return undefined;
  const isHidden = state === "armed";
  if (entrance === "fade" || shouldReduceMotion) {
    return { opacity: isHidden ? 0 : 1, transition: transition("opacity", DURATION_S.reveal) };
  }
  return {
    clipPath: isHidden ? "inset(100% 0 0 0)" : "inset(0 0 0 0)",
    transition: transition("clip-path", DURATION_S.hero),
  };
}

export function imageEntranceStyle(
  entrance: ImageEntrance,
  state: RevealState,
  shouldReduceMotion: boolean,
): CSSProperties | undefined {
  if (entrance !== "mask" || state === "idle" || shouldReduceMotion) return undefined;
  return {
    transform: state === "armed" ? `scale(${MASK_START_SCALE})` : "scale(1)",
    transition: transition("transform", DURATION_S.heroImage),
  };
}
