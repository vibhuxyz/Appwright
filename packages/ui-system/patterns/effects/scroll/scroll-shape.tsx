import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, type ReactNode } from "react";
import { cn } from "@/components/ui/utils";
import { usePrefersReducedMotion } from "@/components/patterns/shared/reduced-motion";

export type ScrollShapeName = "slant" | "fold" | "notch";

const FULL_FRAME = "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)";
const SHAPES: Readonly<Record<ScrollShapeName, string>> = {
  slant: "polygon(10% 0%, 76% 0%, 90% 88%, 0% 96%)",
  fold: "polygon(0% 0%, 100% 6%, 92% 100%, 4% 90%)",
  notch: "polygon(6% 4%, 94% 0%, 100% 84%, 0% 100%)",
};

export interface ScrollShapeProps {
  children: ReactNode;
  shape?: ScrollShapeName;
  className?: string;
}

export function ScrollShape({ children, shape = "slant", className }: ScrollShapeProps) {
  const ref = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = usePrefersReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const clipPath = useTransform(scrollYProgress, [0, 1], [FULL_FRAME, shouldReduceMotion ? FULL_FRAME : SHAPES[shape]]);
  return (
    <div ref={ref} className={cn("relative", className)}>
      <motion.div style={{ clipPath }} className="absolute inset-0">
        {children}
      </motion.div>
    </div>
  );
}
