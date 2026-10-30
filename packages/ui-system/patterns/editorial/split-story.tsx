"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { cn } from "@/components/ui/utils";
import CountUp from "@/components/patterns/effects/text/count-up";
import { Media, type MediaImage } from "@/components/patterns/shared/media";
import { Reveal } from "@/components/patterns/shared/reveal";
import { usePrefersReducedMotion } from "@/components/patterns/shared/reduced-motion";

const DRIFT_PX = 40;

export interface StoryStat {
  value: number;
  suffix?: string;
  label: string;
}

export interface SplitStoryProps {
  eyebrow?: string;
  title: string;
  body: string;
  image: MediaImage;
  imageSide?: "left" | "right";
  stats?: readonly StoryStat[];
}

export function SplitStory({
  eyebrow,
  title,
  body,
  image,
  imageSide = "right",
  stats = [],
}: SplitStoryProps) {
  const ref = useRef<HTMLDivElement>(null);
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
    <section
      data-section="story.split-image"
      className="bg-background text-foreground"
    >
      <div className="mx-auto grid max-w-screen-2xl items-center gap-10 px-4 py-20 md:grid-cols-2 md:gap-16 md:px-8">
        <Reveal className={cn(imageSide === "left" && "md:order-2")}>
          {eyebrow && (
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              {eyebrow}
            </p>
          )}
          <h2 className="mt-3 font-heading text-4xl leading-tight text-balance md:text-5xl">
            {title}
          </h2>
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted-foreground text-pretty">
            {body}
          </p>
          {stats.length > 0 && (
            <dl className="mt-10 grid grid-cols-2 gap-6 border-t border-border pt-6 sm:grid-cols-3">
              {stats.map((stat) => (
                <div key={stat.label}>
                  <dd className="font-heading text-3xl">
                    <CountUp to={stat.value} separator="," />
                    {stat.suffix}
                  </dd>
                  <dt className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">
                    {stat.label}
                  </dt>
                </div>
              ))}
            </dl>
          )}
        </Reveal>
        <div ref={ref} className="overflow-hidden">
          <motion.div style={{ y }} className="scale-110">
            <Media
              image={image}
              ratio="4:5"
              sizes="(min-width: 768px) 50vw, 100vw"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
