"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/components/ui/utils";
import { usePrefersReducedMotion } from "@/components/patterns/shared/reduced-motion";
import { createParticles, stepParticles, type Particle } from "@/components/patterns/effects/canvas/particles";

const MAX_DEVICE_PIXEL_RATIO = 2;
const COLOR_VARIABLE = "--primary";

export interface ParticleFieldProps {
  density?: number;
  className?: string;
}

interface FieldState {
  particles: Particle[];
  pointer: { x: number; y: number } | null;
  frame: number | null;
  isVisible: boolean;
}

function resize(canvas: HTMLCanvasElement): CanvasRenderingContext2D | null {
  const ratio = Math.min(window.devicePixelRatio || 1, MAX_DEVICE_PIXEL_RATIO);
  const { width, height } = canvas.getBoundingClientRect();
  canvas.width = Math.round(width * ratio);
  canvas.height = Math.round(height * ratio);
  const context = canvas.getContext("2d");
  context?.setTransform(ratio, 0, 0, ratio, 0, 0);
  return context;
}

function draw(context: CanvasRenderingContext2D, particles: readonly Particle[], color: string): void {
  const { width, height } = context.canvas.getBoundingClientRect();
  context.clearRect(0, 0, width, height);
  context.fillStyle = color;
  for (const particle of particles) {
    context.beginPath();
    context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
    context.fill();
  }
}

export function ParticleField({ density = 1, className }: ParticleFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const shouldReduceMotion = usePrefersReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas ? resize(canvas) : null;
    if (!canvas || !context) return;
    const color = getComputedStyle(canvas).getPropertyValue(COLOR_VARIABLE).trim() || getComputedStyle(canvas).color;
    const box = canvas.getBoundingClientRect();
    const state: FieldState = { particles: createParticles(box.width, box.height, density), pointer: null, frame: null, isVisible: true };

    function tick() {
      if (!context) return;
      const { width, height } = context.canvas.getBoundingClientRect();
      state.particles = stepParticles(state.particles, { width, height, pointer: state.pointer });
      draw(context, state.particles, color);
      state.frame = state.isVisible && !document.hidden ? requestAnimationFrame(tick) : null;
    }

    function resume() {
      if (state.frame === null && state.isVisible && !document.hidden) state.frame = requestAnimationFrame(tick);
    }

    draw(context, state.particles, color);
    if (shouldReduceMotion) return;
    const observer = new IntersectionObserver((entries) => {
      state.isVisible = entries.some((entry) => entry.isIntersecting);
      resume();
    });
    observer.observe(canvas);
    const host = canvas.parentElement ?? canvas;
    const onMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      state.pointer = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    };
    const onLeave = () => {
      state.pointer = null;
    };
    host.addEventListener("pointermove", onMove, { passive: true });
    host.addEventListener("pointerleave", onLeave);
    document.addEventListener("visibilitychange", resume);
    resume();
    return () => {
      observer.disconnect();
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("visibilitychange", resume);
      if (state.frame !== null) cancelAnimationFrame(state.frame);
    };
  }, [density, shouldReduceMotion]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      data-testid="particle-field"
      className={cn("pointer-events-none absolute inset-0 h-full w-full", className)}
    />
  );
}
