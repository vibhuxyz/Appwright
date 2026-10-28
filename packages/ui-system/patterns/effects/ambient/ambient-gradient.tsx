import { useRef } from "react";
import { useInView } from "framer-motion";
import { cn } from "@/components/ui/utils";
import { usePrefersReducedMotion } from "@/components/patterns/shared/reduced-motion";

const CYCLE_S = 18;

export interface AmbientGradientProps {
  className?: string;
}

export function AmbientGradient({ className }: AmbientGradientProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isOnScreen = useInView(ref);
  const shouldReduceMotion = usePrefersReducedMotion();
  const isMoving = isOnScreen && !shouldReduceMotion;
  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0 -z-10 overflow-hidden", className)}
    >
      <div
        className="absolute -inset-1/4 opacity-60"
        style={{
          backgroundImage:
            "radial-gradient(40% 40% at 30% 30%, color-mix(in oklch, var(--primary) 45%, transparent), transparent), radial-gradient(35% 35% at 70% 60%, color-mix(in oklch, var(--accent) 60%, transparent), transparent)",
          animation: `ambient-drift ${CYCLE_S}s ease-in-out infinite alternate`,
          animationPlayState: isMoving ? "running" : "paused",
        }}
      />
      <style>{"@keyframes ambient-drift{from{transform:translate3d(-6%,-4%,0) rotate(0deg)}to{transform:translate3d(6%,4%,0) rotate(8deg)}}"}</style>
    </div>
  );
}
