"use client";

import { useEffect, useRef, type ElementType } from "react";
import { usePrefersReducedMotion } from "@/components/patterns/shared/reduced-motion";

const SCRAMBLE_GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/<>-_";
const SCRAMBLE_DURATION_MS = 700;
const SCRAMBLE_VIEW_THRESHOLD = 0.6;

export interface TextScrambleProps {
  text: string;
  as?: ElementType;
  className?: string;
}

function scrambledFrame(text: string, settledCount: number): string {
  return Array.from(text)
    .map((char, index) => {
      if (index < settledCount || char === " ") return char;
      return SCRAMBLE_GLYPHS.charAt(Math.floor(Math.random() * SCRAMBLE_GLYPHS.length));
    })
    .join("");
}

export function TextScramble({ text, as: Tag = "span", className }: TextScrambleProps) {
  const ref = useRef<HTMLElement>(null);
  const shouldReduceMotion = usePrefersReducedMotion();
  useEffect(() => {
    const element = ref.current;
    if (!element || shouldReduceMotion) return;
    let frameId = 0;
    function play(startedAt: number) {
      function step(now: number) {
        const progress = Math.min(1, (now - startedAt) / SCRAMBLE_DURATION_MS);
        if (element) element.textContent = scrambledFrame(text, Math.floor(progress * text.length));
        if (progress < 1) frameId = requestAnimationFrame(step);
      }
      frameId = requestAnimationFrame(step);
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        play(performance.now());
      },
      { threshold: SCRAMBLE_VIEW_THRESHOLD },
    );
    observer.observe(element);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frameId);
      element.textContent = text;
    };
  }, [text, shouldReduceMotion]);
  return (
    <Tag ref={ref} aria-label={text} className={className}>
      {text}
    </Tag>
  );
}
