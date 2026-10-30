"use client";

import { useRef, type CSSProperties, type ReactNode } from "react";
import {
  DURATION_S,
  EASE_OUT,
  SCROLL_REVEAL_OFFSET_PX,
  SCROLL_REVEAL_SCALE,
  cssEase,
} from "@/components/patterns/shared/motion";
import { usePrefersReducedMotion } from "@/components/patterns/shared/reduced-motion";
import { useRevealState } from "@/components/patterns/shared/reveal-state";

export type RevealFrom = "up" | "left" | "right" | "scale";

export interface RevealProps {
  children: ReactNode;
  delay?: number;
  from?: RevealFrom;
  className?: string;
}

function hiddenTransform(from: RevealFrom): string {
  switch (from) {
    case "up":
      return `translateY(${SCROLL_REVEAL_OFFSET_PX}px)`;
    case "left":
      return `translateX(-${SCROLL_REVEAL_OFFSET_PX}px)`;
    case "right":
      return `translateX(${SCROLL_REVEAL_OFFSET_PX}px)`;
    case "scale":
      return `scale(${SCROLL_REVEAL_SCALE})`;
    default: {
      const unreachable: never = from;
      return unreachable;
    }
  }
}

function revealStyle(
  isHidden: boolean,
  shouldReduceMotion: boolean,
  delay: number,
  from: RevealFrom,
): CSSProperties {
  const duration = shouldReduceMotion ? DURATION_S.reducedFade : DURATION_S.reveal;
  const hidden = shouldReduceMotion ? "none" : hiddenTransform(from);
  return {
    opacity: isHidden ? 0 : 1,
    transform: isHidden ? hidden : "none",
    transition: `opacity ${duration}s ${cssEase(EASE_OUT)} ${shouldReduceMotion ? 0 : delay}s, transform ${duration}s ${cssEase(EASE_OUT)} ${delay}s`,
  };
}

export function Reveal({ children, delay = 0, from = "up", className }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = usePrefersReducedMotion();
  const state = useRevealState(ref, true);
  return (
    <div
      ref={ref}
      className={className}
      style={state === "idle" ? undefined : revealStyle(state === "armed", shouldReduceMotion, delay, from)}
    >
      {children}
    </div>
  );
}
