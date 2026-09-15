import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/shared/lib/cn";

const STORAGE_PREFIX = "appwright:split:";

/**
 * Two panes with a drag handle between them. The handle stores its position
 * as a *fraction* of the container, not pixels, so the layout survives a
 * window resize and a page reload.
 *
 * Pointer events (not mouse events) so a trackpad, a mouse and a touch pen
 * all drive the same code path, and setPointerCapture keeps the drag alive
 * when the cursor crosses the preview iframe.
 */
export function SplitPane({
  storageKey,
  left,
  right,
  defaultRatio = 0.34,
  minRatio = 0.2,
  maxRatio = 0.7,
  className,
}: {
  storageKey: string;
  left: React.ReactNode;
  right: React.ReactNode;
  defaultRatio?: number;
  minRatio?: number;
  maxRatio?: number;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [ratio, setRatio] = useState(() => {
    const saved = Number(localStorage.getItem(STORAGE_PREFIX + storageKey));
    return Number.isFinite(saved) && saved > 0 ? saved : defaultRatio;
  });
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + storageKey, String(ratio));
  }, [storageKey, ratio]);

  useEffect(() => {
    document.body.dataset.resizing = dragging ? "true" : "false";
  }, [dragging]);

  const clamp = useCallback(
    (value: number) => Math.min(maxRatio, Math.max(minRatio, value)),
    [minRatio, maxRatio],
  );

  const moveTo = useCallback(
    (clientX: number) => {
      const box = containerRef.current?.getBoundingClientRect();
      if (!box || box.width === 0) return;
      setRatio(clamp((clientX - box.left) / box.width));
    },
    [clamp],
  );

  return (
    <div ref={containerRef} className={cn("flex min-h-0 min-w-0 flex-1", className)}>
      <div className="flex min-h-0 min-w-0 flex-col" style={{ width: `${ratio * 100}%` }}>
        {left}
      </div>

      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize panels"
        tabIndex={0}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          setDragging(true);
        }}
        onPointerMove={(e) => {
          if (dragging) moveTo(e.clientX);
        }}
        onPointerUp={(e) => {
          e.currentTarget.releasePointerCapture(e.pointerId);
          setDragging(false);
        }}
        onDoubleClick={() => setRatio(defaultRatio)}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") setRatio((r) => clamp(r - 0.02));
          if (e.key === "ArrowRight") setRatio((r) => clamp(r + 0.02));
        }}
        className={cn(
          "group relative z-10 w-3 shrink-0 cursor-col-resize touch-none",
          "before:absolute before:inset-y-0 before:left-1/2 before:w-px before:-translate-x-1/2",
          "before:bg-border before:transition-colors",
          dragging ? "before:bg-lime" : "hover:before:bg-surface-3",
          "focus-visible:outline-none focus-visible:before:bg-lime",
        )}
      >
        <span
          className={cn(
            "pointer-events-none absolute top-1/2 left-1/2 h-8 w-1 -translate-1/2 rounded-full transition-opacity",
            dragging ? "bg-lime opacity-100" : "bg-surface-3 opacity-0 group-hover:opacity-100",
          )}
        />
      </div>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">{right}</div>
    </div>
  );
}
