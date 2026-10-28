import { useInView } from "framer-motion";
import { useRef } from "react";
import { Spotlight } from "@/components/patterns/effects/pointer/spotlight";
import RotatingText from "@/components/patterns/effects/text/rotating-text";
import { Reveal } from "@/components/patterns/shared/reveal";
import { usePrefersReducedMotion } from "@/components/patterns/shared/reduced-motion";

const ROTATION_INTERVAL_MS = 2400;
const MAX_ROTATING_WORDS = 4;
const BEAM = "color-mix(in oklch, var(--primary) 14%, transparent)";
const BEAM_SOFT = "color-mix(in oklch, var(--primary) 6%, transparent)";

export interface SpotlightHeroProps {
  eyebrow?: string;
  titleStart: string;
  rotatingWords: readonly string[];
  description: string;
  primaryAction: { label: string; href: string };
  secondaryAction?: { label: string; href: string };
}

export function SpotlightHero({
  eyebrow,
  titleStart,
  rotatingWords,
  description,
  primaryAction,
  secondaryAction,
}: SpotlightHeroProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const isOnScreen = useInView(sectionRef);
  const words = rotatingWords.slice(0, MAX_ROTATING_WORDS);
  return (
    <section
      ref={sectionRef}
      data-section="hero.spotlight"
      className="relative isolate overflow-hidden bg-background text-foreground"
    >
      {!shouldReduceMotion && isOnScreen && (
        <Spotlight
          gradientFirst={`radial-gradient(68% 68% at 55% 31%, ${BEAM} 0, transparent 80%)`}
          gradientSecond={`radial-gradient(50% 50% at 50% 50%, ${BEAM_SOFT} 0, transparent 100%)`}
          gradientThird={`radial-gradient(50% 50% at 50% 50%, ${BEAM_SOFT} 0, transparent 100%)`}
        />
      )}
      <div className="mx-auto flex max-w-5xl flex-col items-center px-4 pt-32 pb-24 text-center md:pt-44 md:pb-32">
        {eyebrow && (
          <p className="rounded-full border border-border px-4 py-1 text-xs uppercase tracking-widest text-muted-foreground">
            {eyebrow}
          </p>
        )}
        <h1 className="mt-8 font-heading text-4xl font-semibold leading-tight tracking-tight text-balance md:text-7xl">
          {titleStart}{" "}
          {shouldReduceMotion || words.length < 2 ? (
            <span className="text-primary">{words[0]}</span>
          ) : (
            <RotatingText
              texts={[...words]}
              rotationInterval={ROTATION_INTERVAL_MS}
              mainClassName="inline-flex overflow-hidden text-primary"
            />
          )}
        </h1>
        <Reveal delay={0.2}>
          <p className="mt-6 max-w-2xl text-lg text-muted-foreground text-pretty">
            {description}
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <a
              href={primaryAction.href}
              className="inline-flex h-11 items-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground transition duration-150 ease-out hover:opacity-90 motion-safe:active:scale-96 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              {primaryAction.label}
            </a>
            {secondaryAction && (
              <a
                href={secondaryAction.href}
                className="inline-flex h-11 items-center rounded-md border border-border px-6 text-sm font-medium transition duration-150 ease-out hover:bg-muted motion-safe:active:scale-96 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                {secondaryAction.label}
              </a>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
