import {
  motion,
  useScroll,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { useRef } from "react";
import { cn } from "@/components/ui/utils";
import { usePrefersReducedMotion } from "@/components/patterns/shared/reduced-motion";

const TRACK_HEIGHT = "260svh";
const REVEAL_SPAN = 0.8;
const WORD_FADE_SPAN = 0.12;
const DIMMED_OPACITY = 0.14;
const BLURRED_PX = 6;

export interface ScrollWordsProps {
  text: string;
  className?: string;
}

interface WordProps {
  word: string;
  progress: MotionValue<number>;
  start: number;
  end: number;
}

function Word({ word, progress, start, end }: WordProps) {
  const opacity = useTransform(progress, [start, end], [DIMMED_OPACITY, 1]);
  const blurPx = useTransform(progress, [start, end], [BLURRED_PX, 0]);
  const filter = useTransform(blurPx, (value) => `blur(${value}px)`);
  return (
    <motion.span style={{ opacity, filter }} className="inline-block">
      {word}
    </motion.span>
  );
}

export function ScrollWords({ text, className }: ScrollWordsProps) {
  const ref = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = usePrefersReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const words = text.split(/\s+/).filter(Boolean);
  const headlineClass = cn("mx-auto max-w-5xl text-balance text-center font-heading text-5xl leading-none tracking-tight md:text-7xl", className);
  if (shouldReduceMotion) {
    return (
      <div className="flex min-h-svh items-center px-6">
        <p className={headlineClass}>{text}</p>
      </div>
    );
  }
  return (
    <div ref={ref} data-testid="scroll-words" style={{ height: TRACK_HEIGHT }} className="relative">
      <div className="sticky top-0 flex h-svh items-center px-6">
        <p className={headlineClass} aria-label={text}>
          {words.map((word, index) => {
            const start = (index / words.length) * REVEAL_SPAN;
            return (
              <span key={`${word}-${index}`} aria-hidden="true">
                <Word word={word} progress={scrollYProgress} start={start} end={start + WORD_FADE_SPAN} />{" "}
              </span>
            );
          })}
        </p>
      </div>
    </div>
  );
}
