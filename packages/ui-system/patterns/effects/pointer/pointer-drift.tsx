import { motion, useMotionValue, useSpring } from "framer-motion";
import { useSyncExternalStore, type PointerEvent, type ReactNode } from "react";
import { cn } from "@/components/ui/utils";
import {
  INTENSITY_PX,
  type MotionIntensity,
} from "@/components/patterns/shared/motion";
import { usePrefersReducedMotion } from "@/components/patterns/shared/reduced-motion";

const FINE_POINTER_QUERY = "(pointer: fine)";
const DRIFT_SPRING = { stiffness: 120, damping: 20, mass: 0.4 } as const;

function subscribe(onChange: () => void): () => void {
  const media = window.matchMedia(FINE_POINTER_QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

function useHasFinePointer(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(FINE_POINTER_QUERY).matches,
    () => false,
  );
}

export interface PointerDriftProps {
  children: ReactNode;
  intensity?: MotionIntensity;
  className?: string;
}

export function PointerDrift({
  children,
  intensity = "subtle",
  className,
}: PointerDriftProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const hasFinePointer = useHasFinePointer();
  const x = useSpring(useMotionValue(0), DRIFT_SPRING);
  const y = useSpring(useMotionValue(0), DRIFT_SPRING);
  const isActive = hasFinePointer && !shouldReduceMotion;
  const distance = INTENSITY_PX[intensity].drift;

  function handleMove(event: PointerEvent<HTMLDivElement>) {
    if (!isActive) return;
    const box = event.currentTarget.getBoundingClientRect();
    x.set(((event.clientX - box.left) / box.width - 0.5) * 2 * distance);
    y.set(((event.clientY - box.top) / box.height - 0.5) * 2 * distance);
  }

  function handleLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <div
      className={cn("relative", className)}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
    >
      <motion.div style={{ x, y }} className="h-full w-full">
        {children}
      </motion.div>
    </div>
  );
}
