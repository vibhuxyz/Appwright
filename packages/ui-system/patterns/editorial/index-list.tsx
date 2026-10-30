"use client";

import { useMotionValue } from "framer-motion";
import { useState, type PointerEvent } from "react";
import { cn } from "@/components/ui/utils";
import { IndexListPreview } from "@/components/patterns/editorial/index-list-preview";
import { Media, type MediaImage } from "@/components/patterns/shared/media";
import { Reveal } from "@/components/patterns/shared/reveal";

const MAX_ITEMS = 12;
const NUMBER_DIGITS = 2;

export interface IndexItem {
  title: string;
  meta?: string;
  year?: string;
  href?: string;
  image?: MediaImage;
}

export interface IndexListProps {
  heading?: string;
  items: readonly IndexItem[];
}

function rowNumber(index: number): string {
  return String(index + 1).padStart(NUMBER_DIGITS, "0");
}

export function IndexList({ heading, items }: IndexListProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const rows = items.slice(0, MAX_ITEMS);
  if (rows.length === 0) return null;
  function trackPointer(event: PointerEvent<HTMLUListElement>) {
    pointerX.set(event.clientX);
    pointerY.set(event.clientY);
  }
  function previewOnMouse(event: PointerEvent<HTMLLIElement>, index: number) {
    if (event.pointerType === "mouse") setActiveIndex(index);
  }
  return (
    <section data-section="portfolio.index-list" className="bg-background text-foreground">
      <div className="mx-auto max-w-screen-xl px-4 py-24 md:px-8 md:py-32">
        {heading && <h2 className="mb-10 text-xs uppercase tracking-widest text-muted-foreground">{heading}</h2>}
        <ul onPointerMove={trackPointer} onPointerLeave={() => setActiveIndex(null)}>
          {rows.map((row, index) => (
            <li
              key={`${row.title}-${index}`}
              onPointerEnter={(event) => previewOnMouse(event, index)}
              className={cn("border-t border-border py-6 transition-opacity duration-200 ease-out", activeIndex !== null && activeIndex !== index && "opacity-40")}
            >
              <Reveal>
                <a href={row.href} className="grid grid-cols-12 items-baseline gap-x-4 gap-y-2">
                  <span className="col-span-2 text-xs text-muted-foreground md:col-span-1">{rowNumber(index)}</span>
                  <span className="col-span-10 font-heading text-3xl tracking-tight md:col-span-8 md:text-5xl">{row.title}</span>
                  <span className="col-span-10 col-start-3 text-xs uppercase tracking-widest text-muted-foreground md:col-span-3 md:col-start-auto md:text-right">{[row.meta, row.year].filter(Boolean).join(" · ")}</span>
                </a>
                {row.image && (
                  <div className="mt-4 md:hidden">
                    <Media image={row.image} ratio="16:9" />
                  </div>
                )}
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
      <IndexListPreview images={rows.map((row) => row.image)} activeIndex={activeIndex} pointerX={pointerX} pointerY={pointerY} />
    </section>
  );
}
