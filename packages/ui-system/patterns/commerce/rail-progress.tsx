"use client";

import { useEffect, useRef, type RefObject } from "react";

const MIN_THUMB_RATIO = 0.1;

export interface RailProgressProps {
  railRef: RefObject<HTMLElement | null>;
}

interface ThumbState {
  ratio: number;
  progress: number;
}

function measureRail(rail: HTMLElement): ThumbState {
  const scrollable = rail.scrollWidth - rail.clientWidth;
  if (scrollable <= 0) return { ratio: 1, progress: 0 };
  return {
    ratio: Math.max(MIN_THUMB_RATIO, rail.clientWidth / rail.scrollWidth),
    progress: Math.min(1, Math.max(0, rail.scrollLeft / scrollable)),
  };
}

export function RailProgress({ railRef }: RailProgressProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const rail = railRef.current;
    const track = trackRef.current;
    const thumb = thumbRef.current;
    if (!rail || !track || !thumb) return;
    function update() {
      if (!rail || !track || !thumb) return;
      const { ratio, progress } = measureRail(rail);
      const offsetPx = track.clientWidth * (1 - ratio) * progress;
      track.style.visibility = ratio >= 1 ? "hidden" : "visible";
      thumb.style.transform = `translateX(${offsetPx}px) scaleX(${ratio})`;
    }
    update();
    rail.addEventListener("scroll", update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(rail);
    return () => {
      rail.removeEventListener("scroll", update);
      observer.disconnect();
    };
  }, [railRef]);
  return (
    <div ref={trackRef} aria-hidden="true" className="mx-4 mt-2 h-0.5 bg-border md:mx-8">
      <div ref={thumbRef} className="h-full origin-left bg-foreground" />
    </div>
  );
}
