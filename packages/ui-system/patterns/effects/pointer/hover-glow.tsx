import { useRef, type PointerEvent, type ReactNode } from "react";
import { cn } from "@/components/ui/utils";

const GLOW_RADIUS_PX = 160;

export interface HoverGlowProps {
  children: ReactNode;
  className?: string;
}

export function HoverGlow({ children, className }: HoverGlowProps) {
  const ref = useRef<HTMLDivElement>(null);

  function handleMove(event: PointerEvent<HTMLDivElement>) {
    const element = ref.current;
    if (!element || event.pointerType !== "mouse") return;
    const box = element.getBoundingClientRect();
    element.style.setProperty("--glow-x", `${event.clientX - box.left}px`);
    element.style.setProperty("--glow-y", `${event.clientY - box.top}px`);
  }

  return (
    <div
      ref={ref}
      onPointerMove={handleMove}
      className={cn("group/glow relative isolate overflow-hidden", className)}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 opacity-0 transition-opacity duration-300 ease-out motion-reduce:transition-none pointer-fine:group-hover/glow:opacity-100"
        style={{
          background: `radial-gradient(${GLOW_RADIUS_PX}px circle at var(--glow-x, 50%) var(--glow-y, 50%), color-mix(in oklch, var(--primary) 22%, transparent), transparent 70%)`,
        }}
      />
      {children}
    </div>
  );
}
