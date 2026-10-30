"use client";

import BlurText from "@/components/patterns/effects/text/blur-text";
import { Media, type MediaImage } from "@/components/patterns/shared/media";
import { Reveal } from "@/components/patterns/shared/reveal";
import { usePrefersReducedMotion } from "@/components/patterns/shared/reduced-motion";

const WORD_DELAY_MS = 80;

export interface EditorialHeroProps {
  eyebrow: string;
  title: string;
  intro: string;
  image: MediaImage;
  action?: { label: string; href: string };
  meta?: readonly { label: string; value: string }[];
}

export function EditorialHero({
  eyebrow,
  title,
  intro,
  image,
  action,
  meta = [],
}: EditorialHeroProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  return (
    <section
      data-section="hero.editorial"
      className="bg-background text-foreground"
    >
      <div className="mx-auto grid max-w-screen-2xl grid-cols-4 gap-x-4 px-4 pt-24 pb-16 md:grid-cols-12 md:gap-x-6 md:px-8 md:pt-32">
        <p className="col-span-4 text-xs uppercase tracking-widest text-muted-foreground md:col-span-2">
          {eyebrow}
        </p>
        <h1 className="col-span-4 mt-6 font-heading text-5xl leading-none tracking-tight text-balance md:col-span-10 md:mt-0 md:text-8xl lg:text-9xl">
          {shouldReduceMotion ? (
            title
          ) : (
            <BlurText
              text={title}
              animateBy="words"
              direction="bottom"
              delay={WORD_DELAY_MS}
            />
          )}
        </h1>
        <Reveal
          className="col-span-4 mt-10 md:col-span-4 md:col-start-3 md:mt-16"
          delay={0.2}
        >
          <p className="text-lg leading-relaxed text-muted-foreground text-pretty">
            {intro}
          </p>
          {action && (
            <a
              href={action.href}
              className="mt-8 inline-flex items-center gap-3 border-b border-foreground pb-1 text-sm uppercase tracking-widest transition-opacity hover:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
            >
              {action.label}
            </a>
          )}
        </Reveal>
        <Reveal
          className="col-span-4 mt-12 md:col-span-5 md:col-start-8 md:-mt-4"
          delay={0.3}
        >
          <Media
            image={image}
            ratio="4:5"
            priority
            sizes="(min-width: 768px) 40vw, 100vw"
          />
        </Reveal>
        {meta.length > 0 && (
          <dl className="col-span-4 mt-16 grid grid-cols-2 gap-6 border-t border-border pt-6 md:col-span-12 md:grid-cols-4">
            {meta.map((item) => (
              <div key={item.label}>
                <dt className="text-xs uppercase tracking-widest text-muted-foreground">
                  {item.label}
                </dt>
                <dd className="mt-2 text-sm">{item.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </section>
  );
}
