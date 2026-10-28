import { motion, type Variants } from "framer-motion";
import { Fragment } from "react";
import {
  DURATION_S,
  EASE_OUT,
  STAGGER_S,
} from "@/components/patterns/shared/motion";
import { usePrefersReducedMotion } from "@/components/patterns/shared/reduced-motion";

const MASKED_TAGS = {
  h1: motion.h1,
  h2: motion.h2,
  h3: motion.h3,
  p: motion.p,
} as const;

const container: Variants = {
  hidden: {},
  shown: { transition: { staggerChildren: STAGGER_S.word } },
};

const word: Variants = {
  hidden: { y: "110%" },
  shown: { y: "0%", transition: { duration: DURATION_S.hero, ease: EASE_OUT } },
};

export interface MaskedTextProps {
  text: string;
  as?: keyof typeof MASKED_TAGS;
  className?: string;
  playOnMount?: boolean;
}

export function MaskedText({
  text,
  as = "h2",
  className,
  playOnMount = false,
}: MaskedTextProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const Tag = MASKED_TAGS[as];
  if (shouldReduceMotion) return <Tag className={className}>{text}</Tag>;
  const trigger = playOnMount
    ? { animate: "shown" }
    : {
        whileInView: "shown",
        viewport: { once: true, margin: "0px 0px -18% 0px" },
      };
  return (
    <Tag
      className={className}
      aria-label={text}
      variants={container}
      initial="hidden"
      {...trigger}
    >
      {text
        .split(/\s+/)
        .filter(Boolean)
        .map((part, index) => (
          <Fragment key={`${part}-${index}`}>
            {index > 0 && " "}
            <span
              aria-hidden="true"
              className="inline-block overflow-hidden pb-1 align-top"
            >
              <motion.span className="inline-block" variants={word}>
                {part}
              </motion.span>
            </span>
          </Fragment>
        ))}
    </Tag>
  );
}
