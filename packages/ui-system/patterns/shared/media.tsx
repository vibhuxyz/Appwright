"use client";

import { useRef } from "react";
import { cn } from "@/components/ui/utils";
import {
  HOVER_FRAME_CLASS,
  HOVER_IMAGE_CLASS,
  frameEntranceStyle,
  imageEntranceStyle,
  objectPosition,
  type FocalPoint,
  type ImageEntrance,
  type ImageHover,
} from "@/components/patterns/shared/image-treatment";
import { usePrefersReducedMotion } from "@/components/patterns/shared/reduced-motion";
import { useRevealState } from "@/components/patterns/shared/reveal-state";

const RATIO_CLASS = {
  "1:1": "aspect-square",
  "2:3": "aspect-2/3",
  "3:4": "aspect-3/4",
  "4:5": "aspect-4/5",
  "4:3": "aspect-4/3",
  "3:2": "aspect-3/2",
  "16:9": "aspect-video",
  "21:9": "aspect-21/9",
} as const;

export type MediaRatio = keyof typeof RATIO_CLASS;

export interface MediaImage {
  src?: string;
  alt: string;
  focalPoint?: FocalPoint;
}

export interface MediaProps {
  image: MediaImage;
  ratio?: MediaRatio;
  fill?: boolean;
  priority?: boolean;
  sizes?: string;
  className?: string;
  imageClassName?: string;
  entrance?: ImageEntrance;
  hover?: ImageHover;
}

export function Media({
  image,
  ratio = "4:3",
  fill = false,
  priority = false,
  sizes = "100vw",
  className,
  imageClassName,
  entrance = "none",
  hover = "none",
}: MediaProps) {
  const ref = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = usePrefersReducedMotion();
  const state = useRevealState(ref, entrance !== "none" && !priority);
  const frame = cn(
    "relative overflow-hidden bg-muted",
    fill ? "absolute inset-0 h-full w-full" : RATIO_CLASS[ratio],
    HOVER_FRAME_CLASS[hover],
    className,
  );
  if (!image.src) {
    return (
      <div
        role="img"
        aria-label={image.alt}
        className={cn(frame, "flex p-6", fill ? "items-start justify-start" : "items-center justify-center")}
      >
        <span
          aria-hidden="true"
          className="max-w-xs text-center text-xs uppercase tracking-widest text-muted-foreground"
        >
          {image.alt}
        </span>
      </div>
    );
  }
  return (
    <div
      ref={ref}
      className={frame}
      style={frameEntranceStyle(entrance, state, shouldReduceMotion)}
    >
      <img
        src={image.src}
        alt={image.alt}
        sizes={sizes}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        decoding="async"
        className={cn(
          "h-full w-full object-cover",
          HOVER_IMAGE_CLASS[hover],
          imageClassName,
        )}
        style={{
          ...objectPosition(image.focalPoint),
          ...imageEntranceStyle(entrance, state, shouldReduceMotion),
        }}
      />
    </div>
  );
}
