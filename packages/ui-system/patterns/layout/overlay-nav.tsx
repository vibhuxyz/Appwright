"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import {
  DURATION_S,
  EASE_IN_OUT,
  EASE_OUT,
  REVEAL_OFFSET_PX,
  STAGGER_S,
} from "@/components/patterns/shared/motion";
import { usePrefersReducedMotion } from "@/components/patterns/shared/reduced-motion";

const LINKS_DELAY_S = 0.2;
const DEFAULT_HOME_HREF = "#";

export interface OverlayNavProps {
  brand: string;
  links: readonly { label: string; href: string }[];
  contact?: { label: string; href: string };
  meta?: string;
  homeHref?: string;
}

export function OverlayNav({ brand, links, contact, meta, homeHref = DEFAULT_HOME_HREF }: OverlayNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const shouldReduceMotion = usePrefersReducedMotion();
  const firstLinkRef = useRef<HTMLAnchorElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    firstLinkRef.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setIsOpen(false);
      toggleRef.current?.focus();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

  return (
    <>
      <header
        data-section="nav.overlay-menu"
        className="fixed inset-x-0 top-0 z-50 bg-background/80 text-foreground backdrop-blur"
      >
        <div className="mx-auto grid max-w-screen-2xl grid-cols-2 items-start gap-4 px-4 py-4 text-xs uppercase tracking-widest md:grid-cols-4 md:px-8">
          <a href={homeHref} className="inline-flex min-h-6 items-center font-medium">
            {brand}
          </a>
          {meta && (
            <p className="hidden min-h-6 items-center text-muted-foreground md:flex">{meta}</p>
          )}
          <div className="col-start-2 flex justify-end gap-6 md:col-start-4">
            {contact && (
              <a
                href={contact.href}
                className="hidden min-h-6 items-center hover:opacity-60 sm:inline-flex"
              >
                {contact.label}
              </a>
            )}
            <button
              ref={toggleRef}
              type="button"
              aria-expanded={isOpen}
              aria-controls="overlay-menu"
              onClick={() => setIsOpen((open) => !open)}
              className="inline-flex min-h-6 items-center uppercase tracking-widest hover:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
            >
              {isOpen ? "Close" : "Menu"}
            </button>
          </div>
        </div>
      </header>
      <AnimatePresence>
        {isOpen && (
          <motion.nav
            id="overlay-menu"
            aria-label="Main"
            className="fixed inset-0 z-40 flex items-end bg-background px-4 pb-16 text-foreground md:px-8"
            initial={
              shouldReduceMotion
                ? { opacity: 1 }
                : { clipPath: "inset(0 0 100% 0)" }
            }
            animate={
              shouldReduceMotion
                ? { opacity: 1 }
                : { clipPath: "inset(0 0 0% 0)" }
            }
            exit={
              shouldReduceMotion
                ? { opacity: 0 }
                : {
                    clipPath: "inset(0 0 100% 0)",
                    transition: { duration: DURATION_S.panel, ease: EASE_OUT },
                  }
            }
            transition={{
              duration: shouldReduceMotion
                ? DURATION_S.reducedFade
                : DURATION_S.overlay,
              ease: EASE_IN_OUT,
            }}
          >
            <ul className="space-y-2">
              {links.map((link, index) => (
                <motion.li
                  key={link.href}
                  initial={
                    shouldReduceMotion
                      ? false
                      : { opacity: 0, y: REVEAL_OFFSET_PX }
                  }
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: DURATION_S.reveal,
                    delay: LINKS_DELAY_S + index * STAGGER_S.item,
                    ease: EASE_OUT,
                  }}
                >
                  <a
                    ref={index === 0 ? firstLinkRef : undefined}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className="font-heading text-5xl leading-none tracking-tight transition-opacity hover:opacity-50 focus-visible:outline-2 focus-visible:outline-ring md:text-8xl"
                  >
                    {link.label}
                  </a>
                </motion.li>
              ))}
            </ul>
          </motion.nav>
        )}
      </AnimatePresence>
    </>
  );
}
