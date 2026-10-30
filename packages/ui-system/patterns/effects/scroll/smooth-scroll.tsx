"use client";

import { cancelFrame, frame } from "framer-motion";
import { ReactLenis, type LenisRef } from "lenis/react";
import "lenis/dist/lenis.css";
import { useEffect, useRef, type ReactNode } from "react";
import { usePrefersReducedMotion } from "@/components/patterns/shared/reduced-motion";

const SMOOTH_LERP = 0.1;

export interface SmoothScrollProps {
  children: ReactNode;
}

export function SmoothScroll({ children }: SmoothScrollProps) {
  const lenisRef = useRef<LenisRef>(null);
  const shouldReduceMotion = usePrefersReducedMotion();
  useEffect(() => {
    if (shouldReduceMotion) return;
    function advance({ timestamp }: { timestamp: number }) {
      lenisRef.current?.lenis?.raf(timestamp);
    }
    frame.update(advance, true);
    return () => cancelFrame(advance);
  }, [shouldReduceMotion]);
  if (shouldReduceMotion) return <>{children}</>;
  return (
    <>
      <ReactLenis root ref={lenisRef} options={{ autoRaf: false, lerp: SMOOTH_LERP }} />
      {children}
    </>
  );
}
