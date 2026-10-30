"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, type ReactNode } from "react";
import { cn } from "@/components/ui/utils";
import {
  INTENSITY_PX,
  type MotionIntensity,
} from "@/components/patterns/shared/motion";
import { usePrefersReducedMotion } from "@/components/patterns/shared/reduced-motion";

export interface ParallaxProps {
  children: ReactNode;
  intensity?: MotionIntensity;
  className?: string;
}

export function Parallax({
  children,
  intensity = "subtle",
  className,
}: ParallaxProps) {
  const ref = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = usePrefersReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const distance = shouldReduceMotion ? 0 : INTENSITY_PX[intensity].parallax;
  const y = useTransform(scrollYProgress, [0, 1], [distance, -distance]);
  return (
    <div ref={ref} className={cn("relative overflow-hidden", className)}>
      <motion.div style={{ y }} className="h-full w-full">
        {children}
      </motion.div>
    </div>
  );
}
