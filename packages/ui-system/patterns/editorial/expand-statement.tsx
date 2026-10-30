import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Media, type MediaImage } from "@/components/patterns/shared/media";
import { usePrefersReducedMotion } from "@/components/patterns/shared/reduced-motion";

const TRACK_HEIGHT = "240svh";
const START_INSET = "inset(14% 36% 14% 36%)";
const END_INSET = "inset(0% 50% 0% 0%)";
const EXPAND_RANGE: number[] = [0, 0.55];
const TEXT_RANGE: number[] = [0.45, 0.8];
const TEXT_TRAVEL_PX = 48;

export interface ExpandStatementProps {
  eyebrow?: string;
  statement: string;
  body?: string;
  action?: { label: string; href: string };
  image: MediaImage;
}

function Copy({ eyebrow, statement, body, action }: Omit<ExpandStatementProps, "image">) {
  return (
    <>
      {eyebrow && <p className="mb-6 text-xs uppercase tracking-widest text-muted-foreground">{eyebrow}</p>}
      <h2 className="font-heading text-3xl leading-tight tracking-tight text-balance md:text-5xl">{statement}</h2>
      {body && <p className="mt-6 max-w-md text-muted-foreground">{body}</p>}
      {action && (
        <a href={action.href} className="mt-8 inline-block text-xs uppercase tracking-widest underline underline-offset-4">
          {action.label}
        </a>
      )}
    </>
  );
}

export function ExpandStatement(props: ExpandStatementProps) {
  const { image, ...copy } = props;
  const ref = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = usePrefersReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const clipPath = useTransform(scrollYProgress, EXPAND_RANGE, [START_INSET, END_INSET]);
  const opacity = useTransform(scrollYProgress, TEXT_RANGE, [0, 1]);
  const x = useTransform(scrollYProgress, TEXT_RANGE, [TEXT_TRAVEL_PX, 0]);
  const staticLayout = (
    <div className={shouldReduceMotion ? "grid md:grid-cols-2" : "grid md:hidden"}>
      <Media image={image} ratio="4:5" />
      <div className="px-4 py-16 md:px-12 md:py-24">
        <Copy {...copy} />
      </div>
    </div>
  );
  return (
    <section data-section="story.expand-statement" className="bg-muted text-foreground">
      {staticLayout}
      {!shouldReduceMotion && (
        <div ref={ref} data-testid="expand-statement" style={{ height: TRACK_HEIGHT }} className="relative hidden md:block">
          <div className="sticky top-0 h-svh overflow-hidden">
            <motion.div style={{ clipPath }} className="absolute inset-0">
              <Media image={image} fill priority />
            </motion.div>
            <motion.div style={{ opacity, x }} className="absolute inset-y-0 right-0 flex w-1/2 flex-col justify-center px-12">
              <Copy {...copy} />
            </motion.div>
          </div>
        </div>
      )}
    </section>
  );
}
