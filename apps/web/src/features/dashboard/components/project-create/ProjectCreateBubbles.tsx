const BUBBLE_POSITIONS = [
  "left-[12%] bottom-1 size-2",
  "left-[28%] bottom-3 size-3 delay-100",
  "left-[47%] bottom-1.5 size-2 delay-300",
  "left-[66%] bottom-4 size-2.5 delay-150",
  "left-[84%] bottom-2 size-3 delay-500",
] as const;

export function ProjectCreateBubbles() {
  return (
    <span aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {BUBBLE_POSITIONS.map((position) => (
        <span key={position} className={`absolute rounded-full bg-white/50 motion-safe:animate-ping ${position}`} />
      ))}
    </span>
  );
}
