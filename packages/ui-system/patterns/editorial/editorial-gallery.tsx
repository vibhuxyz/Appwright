"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { cn } from "@/components/ui/utils";
import {
  Media,
  type MediaImage,
  type MediaRatio,
} from "@/components/patterns/shared/media";
import { usePrefersReducedMotion } from "@/components/patterns/shared/reduced-motion";

const DRIFT_PX = 48;
const STAGGERED_SLOTS: readonly { className: string; ratio: MediaRatio }[] = [
  { className: "md:col-span-7", ratio: "4:3" },
  { className: "md:col-span-4 md:col-start-9 md:mt-32", ratio: "4:5" },
  { className: "md:col-span-5 md:col-start-2", ratio: "3:4" },
  { className: "md:col-span-6 md:col-start-7 md:mt-24", ratio: "16:9" },
];

export interface GalleryItem {
  title: string;
  image: MediaImage;
  href?: string;
  caption?: string;
}

export interface EditorialGalleryProps {
  heading?: string;
  items: readonly GalleryItem[];
  layout?: "rail" | "staggered";
}

function Caption({ item }: { item: GalleryItem }) {
  return (
    <p className="mb-3 flex justify-between gap-4 text-xs uppercase tracking-widest">
      <span>{item.title}</span>
      {item.caption && (
        <span className="text-muted-foreground">{item.caption}</span>
      )}
    </p>
  );
}

function Linked({
  item,
  children,
}: {
  item: GalleryItem;
  children: React.ReactNode;
}) {
  if (!item.href) return <>{children}</>;
  return (
    <a
      href={item.href}
      className="group block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
    >
      {children}
    </a>
  );
}

function DriftingItem({
  item,
  slot,
}: {
  item: GalleryItem;
  slot: (typeof STAGGERED_SLOTS)[number];
}) {
  const ref = useRef<HTMLLIElement>(null);
  const shouldReduceMotion = usePrefersReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(
    scrollYProgress,
    [0, 1],
    shouldReduceMotion ? [0, 0] : [DRIFT_PX, -DRIFT_PX],
  );
  return (
    <li ref={ref} className={cn("col-span-4", slot.className)}>
      <Linked item={item}>
        <Caption item={item} />
        <motion.div style={{ y }}>
          <Media
            image={item.image}
            ratio={slot.ratio}
            sizes="(min-width: 768px) 50vw, 100vw"
            imageClassName="transition-transform duration-700 group-hover:scale-105 motion-reduce:transition-none"
          />
        </motion.div>
      </Linked>
    </li>
  );
}

export function EditorialGallery({
  heading,
  items,
  layout = "rail",
}: EditorialGalleryProps) {
  return (
    <section
      data-section="gallery.editorial"
      className="bg-background py-20 text-foreground"
    >
      {heading && (
        <h2 className="mx-auto max-w-screen-2xl px-4 text-xs uppercase tracking-widest text-muted-foreground md:px-8">
          {heading}
        </h2>
      )}
      {layout === "rail" ? (
        <ul className="mt-8 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 pb-4 md:scroll-px-8 md:px-8">
          {items.map((item) => (
            <li
              key={item.title}
              className="w-4/5 shrink-0 snap-start sm:w-1/2 lg:w-2/7"
            >
              <Linked item={item}>
                <Caption item={item} />
                <Media
                  image={item.image}
                  ratio="4:5"
                  sizes="(min-width: 1024px) 28vw, 80vw"
                />
              </Linked>
            </li>
          ))}
        </ul>
      ) : (
        <ul className="mx-auto mt-8 grid max-w-screen-2xl grid-cols-4 gap-x-6 gap-y-16 px-4 md:grid-cols-12 md:px-8">
          {items.map((item, index) => {
            const slot =
              STAGGERED_SLOTS[index % STAGGERED_SLOTS.length] ??
              STAGGERED_SLOTS[0];
            return slot ? (
              <DriftingItem key={item.title} item={item} slot={slot} />
            ) : null;
          })}
        </ul>
      )}
    </section>
  );
}
