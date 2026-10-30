"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import type { PointerEvent, ReactNode } from "react";
import { cn } from "@/components/ui/utils";
import { usePrefersReducedMotion } from "@/components/patterns/shared/reduced-motion";

const MAX_TILT_DEG = 8;
const PERSPECTIVE_PX = 900;
const TILT_SPRING = { stiffness: 160, damping: 18 } as const;

export interface TiltCardProps {
  children: ReactNode;
  className?: string;
}

export function TiltCard({ children, className }: TiltCardProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const pointerX = useSpring(useMotionValue(0), TILT_SPRING);
  const pointerY = useSpring(useMotionValue(0), TILT_SPRING);
  const rotateY = useTransform(pointerX, [-1, 1], [-MAX_TILT_DEG, MAX_TILT_DEG]);
  const rotateX = useTransform(pointerY, [-1, 1], [MAX_TILT_DEG, -MAX_TILT_DEG]);

  function handleMove(event: PointerEvent<HTMLDivElement>) {
    if (shouldReduceMotion || event.pointerType !== "mouse") return;
    const box = event.currentTarget.getBoundingClientRect();
    pointerX.set(((event.clientX - box.left) / box.width) * 2 - 1);
    pointerY.set(((event.clientY - box.top) / box.height) * 2 - 1);
  }

  function handleLeave() {
    pointerX.set(0);
    pointerY.set(0);
  }

  return (
    <div
      className={cn("relative", className)}
      style={{ perspective: PERSPECTIVE_PX }}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
    >
      <motion.div style={{ rotateX, rotateY }} className="h-full w-full">
        {children}
      </motion.div>
    </div>
  );
}
