import { useRef, type CSSProperties, type ReactNode } from "react";
import {
  DURATION_S,
  EASE_OUT,
  REVEAL_OFFSET_PX,
  cssEase,
} from "@/components/patterns/shared/motion";
import { usePrefersReducedMotion } from "@/components/patterns/shared/reduced-motion";
import { useRevealState } from "@/components/patterns/shared/reveal-state";

export interface RevealProps {
  children: ReactNode;
  delay?: number;
  className?: string;
}

function revealStyle(
  isHidden: boolean,
  shouldReduceMotion: boolean,
  delay: number,
): CSSProperties {
  const duration = shouldReduceMotion ? DURATION_S.reducedFade : DURATION_S.reveal;
  const offset = shouldReduceMotion ? 0 : REVEAL_OFFSET_PX;
  return {
    opacity: isHidden ? 0 : 1,
    transform: isHidden ? `translateY(${offset}px)` : "none",
    transition: `opacity ${duration}s ${cssEase(EASE_OUT)} ${shouldReduceMotion ? 0 : delay}s, transform ${duration}s ${cssEase(EASE_OUT)} ${delay}s`,
  };
}

export function Reveal({ children, delay = 0, className }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = usePrefersReducedMotion();
  const state = useRevealState(ref, true);
  return (
    <div
      ref={ref}
      className={className}
      style={state === "idle" ? undefined : revealStyle(state === "armed", shouldReduceMotion, delay)}
    >
      {children}
    </div>
  );
}
