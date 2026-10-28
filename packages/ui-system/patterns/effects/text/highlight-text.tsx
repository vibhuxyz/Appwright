import { useRef, type ReactNode } from "react";
import { cn } from "@/components/ui/utils";
import {
  DURATION_S,
  EASE_OUT,
  cssEase,
} from "@/components/patterns/shared/motion";
import { usePrefersReducedMotion } from "@/components/patterns/shared/reduced-motion";
import { useRevealState } from "@/components/patterns/shared/reveal-state";

export type HighlightStyle = "marker" | "underline";

export interface HighlightTextProps {
  children: ReactNode;
  variant?: HighlightStyle;
  className?: string;
}

const BAR_CLASS: Record<HighlightStyle, string> = {
  marker: "inset-x-0 bottom-1 h-2/5 bg-primary/25",
  underline: "inset-x-0 -bottom-1 h-1 bg-primary",
};

export function HighlightText({
  children,
  variant = "marker",
  className,
}: HighlightTextProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const shouldReduceMotion = usePrefersReducedMotion();
  const state = useRevealState(ref, !shouldReduceMotion);
  return (
    <span ref={ref} className={cn("relative inline-block", className)}>
      <span
        aria-hidden="true"
        className={cn("absolute origin-left", BAR_CLASS[variant])}
        style={
          state === "idle"
            ? undefined
            : {
                transform: state === "armed" ? "scaleX(0)" : "scaleX(1)",
                transition: `transform ${DURATION_S.hero}s ${cssEase(EASE_OUT)}`,
              }
        }
      />
      <span className="relative">{children}</span>
    </span>
  );
}
