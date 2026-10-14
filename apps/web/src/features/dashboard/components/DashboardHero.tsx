import { useState, useEffect } from "react";
import { cn } from "@/shared/lib/cn";
import { HERO_SLIDES } from "../data/heroSlides";
import { TerminalSlideVisual, AgentSlideVisual, DeploySlideVisual } from "./HeroVisualCards";

const PIPELINE_STAGES = ["IDEAS", "BUILD", "DEPLOY", "SCALE"] as const;

export function DashboardHero() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [isPaused]);

  const slide = HERO_SLIDES[currentSlide];

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="relative w-full overflow-hidden rounded-3xl border border-border/40 bg-linear-to-b from-surface-2/60 to-surface/40 p-6 sm:px-10 sm:py-7 lg:px-12 lg:py-8"
    >
      {/* Dynamic ambient neon glow */}
      <div
        className={cn(
          "pointer-events-none absolute -top-24 right-0 size-96 rounded-full blur-3xl transition-all duration-700",
          slide.glowColor1,
        )}
      />
      <div
        className={cn(
          "pointer-events-none absolute right-20 -bottom-10 size-64 rounded-full blur-2xl transition-all duration-700",
          slide.glowColor2,
        )}
      />

      <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
        {/* Left side text with smooth transition key */}
        <div key={slide.id} className="max-w-2xl transition-opacity duration-300">
          <div className="mb-2 flex items-center gap-2 font-mono text-[11px] font-semibold tracking-widest text-muted uppercase">
            {slide.tags.map((tag, idx) => (
              <span key={tag} className="flex items-center gap-2">
                <span>{tag}</span>
                {idx < slide.tags.length - 1 && <span className="text-border">›</span>}
              </span>
            ))}
          </div>

          <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            {slide.titlePrefix}
            <span className={slide.highlightClass}>{slide.titleHighlight}</span>
          </h1>

          <p className="mt-2 text-xs text-muted sm:text-sm md:text-base">
            {slide.description}
          </p>
        </div>

        {/* Center / Right Visual graphic */}
        <div className="flex shrink-0 items-center justify-center lg:justify-end">
          {currentSlide === 0 && <TerminalSlideVisual />}
          {currentSlide === 1 && <AgentSlideVisual />}
          {currentSlide === 2 && <DeploySlideVisual />}
        </div>

        {/* Right decorative pipeline sequence */}
        <div className="hidden shrink-0 flex-col items-end gap-1.5 font-mono text-[11px] font-bold tracking-widest text-muted/60 lg:flex">
          {PIPELINE_STAGES.map((stage) => {
            const isActive = stage === slide.activeStage;
            return (
              <span
                key={stage}
                className={cn(
                  "transition-all duration-300",
                  isActive ? "scale-105 text-lime" : "text-muted/40",
                  stage === "DEPLOY" && isActive && "text-pink-500",
                )}
              >
                {stage}
              </span>
            );
          })}
        </div>
      </div>

      {/* Slide Navigation Dots & Progress */}
      <div className="relative mt-4 flex items-center gap-2 pt-2">
        {HERO_SLIDES.map((s, idx) => {
          const isActive = idx === currentSlide;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setCurrentSlide(idx)}
              aria-label={`Slide ${idx + 1}`}
              className={cn(
                "h-1.5 cursor-pointer rounded-full transition-all duration-300",
                isActive ? "w-7 bg-lime" : "w-2 bg-border hover:bg-muted",
              )}
            />
          );
        })}
        <span className="ml-2 font-mono text-[10px] text-muted/50">
          0{currentSlide + 1} / 0{HERO_SLIDES.length}
        </span>
      </div>
    </div>
  );
}
