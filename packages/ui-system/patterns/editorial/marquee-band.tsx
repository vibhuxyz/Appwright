import { useInView } from "framer-motion";
import { Pause, Play } from "lucide-react";
import { useRef, useState } from "react";
import { ScrollVelocity } from "@/components/patterns/effects/scroll/scroll-velocity";
import { usePrefersReducedMotion } from "@/components/patterns/shared/reduced-motion";

const BASE_VELOCITY = 60;
const WORD_SEPARATOR = "  ·  ";
const TYPE_CLASS = "font-heading text-6xl uppercase tracking-tight md:text-8xl";

export interface MarqueeBandProps {
  words: readonly string[];
  label: string;
}

export function MarqueeBand({ words, label }: MarqueeBandProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const [isPaused, setIsPaused] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const isOnScreen = useInView(sectionRef);
  const line = words.join(WORD_SEPARATOR);
  return (
    <section
      ref={sectionRef}
      data-section="band.marquee"
      data-allow-clip
      aria-label={label}
      className="relative overflow-hidden border-y border-border bg-background py-8 text-foreground"
    >
      {shouldReduceMotion || isPaused || !isOnScreen ? (
        <p className={`${TYPE_CLASS} truncate px-4 md:px-8`}>{line}</p>
      ) : (
        <ScrollVelocity
          texts={[line]}
          velocity={BASE_VELOCITY}
          className={TYPE_CLASS}
          outlineAlternate
        />
      )}
      {!shouldReduceMotion && (
        <button
          type="button"
          aria-pressed={isPaused}
          aria-label={
            isPaused ? `Play ${label} animation` : `Pause ${label} animation`
          }
          onClick={() => setIsPaused((paused) => !paused)}
          className="absolute right-3 bottom-3 flex size-8 items-center justify-center rounded-full bg-background/90 text-foreground transition duration-150 ease-out motion-safe:active:scale-96 focus-visible:outline-2 focus-visible:outline-ring"
        >
          {isPaused ? (
            <Play className="size-3.5" aria-hidden="true" />
          ) : (
            <Pause className="size-3.5" aria-hidden="true" />
          )}
        </button>
      )}
    </section>
  );
}
