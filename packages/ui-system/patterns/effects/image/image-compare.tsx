"use client";

import { useId, useState } from "react";
import { cn } from "@/components/ui/utils";
import { Media, type MediaImage, type MediaRatio } from "@/components/patterns/shared/media";

const START_PERCENT = 50;
const STEP_PERCENT = 5;

export interface ImageCompareProps {
  before: MediaImage;
  after: MediaImage;
  label: string;
  beforeLabel?: string;
  afterLabel?: string;
  ratio?: MediaRatio;
  className?: string;
}

export function ImageCompare({
  before,
  after,
  label,
  beforeLabel = "Before",
  afterLabel = "After",
  ratio = "4:3",
  className,
}: ImageCompareProps) {
  const [percent, setPercent] = useState(START_PERCENT);
  const inputId = useId();
  const hasBothImages = Boolean(before.src && after.src);
  return (
    <div data-testid="image-compare" className={cn("relative", className)}>
      {hasBothImages ? (
        <>
          <Media image={after} ratio={ratio} />
          <div
            className="absolute inset-0"
            style={{ clipPath: `inset(0 ${100 - percent}% 0 0)` }}
          >
            <Media image={before} ratio={ratio} />
          </div>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 w-0.5 bg-background"
            style={{ left: `${percent}%` }}
          />
        </>
      ) : (
        <Media
          image={{ alt: `${beforeLabel}: ${before.alt}. ${afterLabel}: ${after.alt}.` }}
          ratio={ratio}
          className="pt-12"
        />
      )}
      <span className="absolute left-3 top-3 bg-background px-2 py-1 text-xs uppercase tracking-widest text-foreground">
        {beforeLabel}
      </span>
      <span className="absolute right-3 top-3 bg-background px-2 py-1 text-xs uppercase tracking-widest text-foreground">
        {afterLabel}
      </span>
      <label htmlFor={inputId} className="sr-only">
        {label}
      </label>
      <input
        id={inputId}
        type="range"
        min={0}
        max={100}
        step={STEP_PERCENT}
        value={percent}
        onChange={(event) => setPercent(Number(event.target.value))}
        className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0"
      />
    </div>
  );
}
