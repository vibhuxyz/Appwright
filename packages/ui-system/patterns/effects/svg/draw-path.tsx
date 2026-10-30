"use client";

import { useRef } from "react";
import { cn } from "@/components/ui/utils";
import {
  DURATION_S,
  EASE_IN_OUT,
  cssEase,
} from "@/components/patterns/shared/motion";
import { usePrefersReducedMotion } from "@/components/patterns/shared/reduced-motion";
import { useRevealState } from "@/components/patterns/shared/reveal-state";

const DRAW_DURATION_S = DURATION_S.heroImage;

export interface DrawPathProps {
  d: string;
  viewBox: string;
  strokeWidth?: number;
  className?: string;
}

export function DrawPath({
  d,
  viewBox,
  strokeWidth = 2,
  className,
}: DrawPathProps) {
  const ref = useRef<SVGSVGElement>(null);
  const shouldReduceMotion = usePrefersReducedMotion();
  const state = useRevealState(ref, !shouldReduceMotion);
  return (
    <svg
      ref={ref}
      viewBox={viewBox}
      fill="none"
      aria-hidden="true"
      className={cn("stroke-current", className)}
    >
      <path
        d={d}
        pathLength={1}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={1}
        style={{
          strokeDashoffset: state === "armed" ? 1 : 0,
          transition:
            state === "idle"
              ? undefined
              : `stroke-dashoffset ${DRAW_DURATION_S}s ${cssEase(EASE_IN_OUT)}`,
        }}
      />
    </svg>
  );
}
