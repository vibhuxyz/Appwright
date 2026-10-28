import { motion } from "framer-motion";
import Magnet from "@/components/patterns/effects/pointer/magnet";
import { MaskedText } from "@/components/patterns/shared/masked-text";
import { Media, type MediaImage } from "@/components/patterns/shared/media";
import {
  DURATION_S,
  EASE_OUT,
  REVEAL_OFFSET_PX,
} from "@/components/patterns/shared/motion";
import {
  ON_IMAGE_SCRIM_CLASS,
  ON_IMAGE_TEXT_CLASS,
} from "@/components/patterns/shared/on-image";
import { usePrefersReducedMotion } from "@/components/patterns/shared/reduced-motion";

const IMAGE_START_SCALE = 1.08;
const ACTIONS_DELAY_S = 0.4;
const MAX_SECONDARY_ACTIONS = 2;
const ACTION_BASE_CLASS =
  "inline-flex h-12 items-center px-7 text-sm font-semibold uppercase tracking-wider transition-transform duration-150 ease-out motion-safe:active:scale-96 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current";
const PRIMARY_ACTION_CLASS = `${ACTION_BASE_CLASS} bg-primary text-primary-foreground`;
const SECONDARY_ACTION_CLASS = `${ACTION_BASE_CLASS} border border-current`;

export interface CinematicHeroProps {
  image: MediaImage;
  title: string;
  subtitle?: string;
  actions: readonly { label: string; href: string }[];
}

export function CinematicHero({
  image,
  title,
  subtitle,
  actions,
}: CinematicHeroProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const [primary, ...secondary] = actions;
  return (
    <section
      data-section="hero.cinematic"
      className="relative isolate flex min-h-svh items-end overflow-hidden bg-muted"
    >
      <motion.div
        className="absolute inset-0 -z-10"
        initial={shouldReduceMotion ? false : { scale: IMAGE_START_SCALE }}
        animate={{ scale: 1 }}
        transition={{ duration: DURATION_S.heroImage, ease: EASE_OUT }}
      >
        <Media image={image} fill priority />
      </motion.div>
      <div
        className={`absolute inset-0 -z-10 ${ON_IMAGE_SCRIM_CLASS}`}
        aria-hidden="true"
      />
      <div className={`mx-auto w-full max-w-screen-2xl px-4 pb-16 md:px-8 md:pb-24 ${ON_IMAGE_TEXT_CLASS}`}>
        <MaskedText
          as="h1"
          playOnMount
          text={title}
          className="max-w-3xl font-heading text-5xl font-bold uppercase leading-none tracking-tight text-balance md:text-7xl"
        />
        <motion.div
          initial={
            shouldReduceMotion
              ? { opacity: 0 }
              : { opacity: 0, y: REVEAL_OFFSET_PX }
          }
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: DURATION_S.reveal,
            delay: shouldReduceMotion ? 0 : ACTIONS_DELAY_S,
            ease: EASE_OUT,
          }}
        >
          {subtitle && (
            <p className="mt-4 max-w-xl text-lg uppercase tracking-wide md:text-2xl">
              {subtitle}
            </p>
          )}
          <div className="mt-8 flex flex-wrap gap-3">
            {primary && (
              <Magnet
                disabled={shouldReduceMotion}
                padding={40}
                magnetStrength={4}
              >
                <a href={primary.href} className={PRIMARY_ACTION_CLASS}>
                  {primary.label}
                </a>
              </Magnet>
            )}
            {secondary.slice(0, MAX_SECONDARY_ACTIONS).map((action) => (
              <a
                key={action.href}
                href={action.href}
                className={SECONDARY_ACTION_CLASS}
              >
                {action.label}
              </a>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
