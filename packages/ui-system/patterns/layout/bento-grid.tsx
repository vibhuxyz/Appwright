import type { ReactNode } from "react";
import { cn } from "@/components/ui/utils";
import { Media, type MediaImage } from "@/components/patterns/shared/media";
import { Reveal } from "@/components/patterns/shared/reveal";

const SIZE_CLASS = {
  large: "md:col-span-2 md:row-span-2",
  wide: "md:col-span-2",
  tall: "md:row-span-2",
  small: "",
} as const;
const STAGGER_S = 0.06;
const MAX_BENTO_ITEMS = 7;

export interface BentoItem {
  title: string;
  body: string;
  size: keyof typeof SIZE_CLASS;
  image?: MediaImage;
  icon?: ReactNode;
}

export interface BentoGridProps {
  eyebrow?: string;
  heading: string;
  items: readonly BentoItem[];
}

export function BentoGrid({ eyebrow, heading, items }: BentoGridProps) {
  return (
    <section
      data-section="features.bento"
      className="bg-background text-foreground"
    >
      <div className="mx-auto max-w-screen-xl px-4 py-20 md:px-8">
        {eyebrow && (
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            {eyebrow}
          </p>
        )}
        <h2 className="mt-3 max-w-2xl font-heading text-4xl leading-tight text-balance md:text-5xl">
          {heading}
        </h2>
        <ul className="mt-12 grid grid-cols-1 md:auto-rows-fr gap-4 md:grid-cols-4">
          {items.slice(0, MAX_BENTO_ITEMS).map((item, index) => (
            <li key={item.title} className={cn(SIZE_CLASS[item.size])}>
              <Reveal delay={index * STAGGER_S} className="h-full">
                <article className="group relative flex h-full min-h-56 flex-col justify-end overflow-hidden rounded-xl border border-border bg-card p-6 transition-colors hover:border-foreground/20">
                  {item.image && (
                    <div className="mb-6 overflow-hidden rounded-lg">
                      <Media
                        image={item.image}
                        ratio={item.size === "small" ? "4:3" : "16:9"}
                        sizes="(min-width: 768px) 50vw, 100vw"
                        imageClassName="transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none"
                      />
                    </div>
                  )}
                  {item.icon && (
                    <div className="mb-4 text-primary" aria-hidden="true">
                      {item.icon}
                    </div>
                  )}
                  <h3 className="font-heading text-xl">{item.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground text-pretty">
                    {item.body}
                  </p>
                </article>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
