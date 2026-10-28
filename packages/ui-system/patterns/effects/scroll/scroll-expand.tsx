import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, type ReactNode } from "react";
import { cn } from "@/components/ui/utils";
import { usePrefersReducedMotion } from "@/components/patterns/shared/reduced-motion";

const START_INSET = "inset(18% 28% 18% 28% round 24px)";
const END_INSET = "inset(0% 0% 0% 0% round 0px)";
const EXPAND_UNTIL = 0.7;
const TRACK_HEIGHT = "200svh";

export interface ScrollExpandProps {
  children: ReactNode;
  overlay?: ReactNode;
  className?: string;
}

export function ScrollExpand({ children, overlay, className }: ScrollExpandProps) {
  const ref = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = usePrefersReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const clipPath = useTransform(scrollYProgress, [0, EXPAND_UNTIL], [START_INSET, END_INSET]);
  if (shouldReduceMotion) {
    return (
      <div ref={ref} className={cn("relative h-svh overflow-hidden", className)}>
        {children}
        {overlay}
      </div>
    );
  }
  return (
    <div
      ref={ref}
      data-testid="scroll-expand"
      className={cn("relative", className)}
      style={{ height: TRACK_HEIGHT }}
    >
      <div className="sticky top-0 h-svh overflow-hidden">
        <motion.div style={{ clipPath }} className="absolute inset-0">
          {children}
        </motion.div>
        {overlay}
      </div>
    </div>
  );
}
