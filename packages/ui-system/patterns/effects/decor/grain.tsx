"use client";

import { useId } from "react";
import { cn } from "@/components/ui/utils";

const NOISE_FREQUENCY = 0.8;
const NOISE_OCTAVES = 3;

export interface GrainProps {
  className?: string;
}

export function Grain({ className }: GrainProps) {
  const filterId = useId();
  return (
    <svg
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 h-full w-full opacity-10 mix-blend-multiply",
        className,
      )}
    >
      <filter id={filterId}>
        <feTurbulence
          type="fractalNoise"
          baseFrequency={NOISE_FREQUENCY}
          numOctaves={NOISE_OCTAVES}
          stitchTiles="stitch"
        />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${filterId})`} />
    </svg>
  );
}
