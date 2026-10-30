"use client";

import { useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/components/ui/utils";
import { MaskedText } from "@/components/patterns/shared/masked-text";
import { Media, type MediaImage } from "@/components/patterns/shared/media";

const STEP_NUMBER_DIGITS = 2;

export interface StoryStep {
  title: string;
  body: string;
  image: MediaImage;
}

export interface StickyStoryProps {
  eyebrow?: string;
  heading: string;
  steps: readonly StoryStep[];
}

function stepNumber(index: number): string {
  return String(index + 1).padStart(STEP_NUMBER_DIGITS, "0");
}

function Step({
  step,
  index,
  onActive,
}: {
  step: StoryStep;
  index: number;
  onActive: (index: number) => void;
}) {
  const ref = useRef<HTMLLIElement>(null);
  const isInView = useInView(ref, { margin: "-45% 0px -45% 0px" });
  useEffect(() => {
    if (isInView) onActive(index);
  }, [isInView, index, onActive]);
  return (
    <li
      ref={ref}
      className="flex flex-col justify-center py-12 md:min-h-svh md:py-0"
    >
      <div className="mb-6 md:hidden">
        <Media image={step.image} ratio="4:5" sizes="100vw" />
      </div>
      <p className="text-xs uppercase tracking-widest text-muted-foreground">
        {stepNumber(index)}.
      </p>
      <h3 className="mt-3 font-heading text-3xl leading-tight md:text-5xl">
        {step.title}
      </h3>
      <p className="mt-4 max-w-md text-muted-foreground text-pretty">
        {step.body}
      </p>
    </li>
  );
}

export function StickyStory({ eyebrow, heading, steps }: StickyStoryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  return (
    <section
      data-section="story.sticky-scroll"
      className="bg-background text-foreground"
    >
      <div className="mx-auto grid max-w-screen-2xl gap-x-12 px-4 py-20 md:grid-cols-2 md:px-8">
        <div className="hidden md:block">
          <div className="sticky top-0 flex h-svh items-center">
            <div className="relative aspect-4/5 w-full overflow-hidden">
              {steps.map((step, index) => (
                <div
                  key={step.title}
                  aria-hidden={index !== activeIndex}
                  className={cn(
                    "absolute inset-0 transition-opacity duration-700 motion-reduce:transition-none",
                    index === activeIndex ? "opacity-100" : "opacity-0",
                  )}
                >
                  <Media image={step.image} fill sizes="50vw" />
                </div>
              ))}
            </div>
          </div>
        </div>
        <div>
          {eyebrow && (
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              {eyebrow}
            </p>
          )}
          <MaskedText
            text={heading}
            className="mt-3 font-heading text-4xl leading-tight text-balance md:text-6xl"
          />
          <ol className="mt-8">
            {steps.map((step, index) => (
              <Step
                key={step.title}
                step={step}
                index={index}
                onActive={setActiveIndex}
              />
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
