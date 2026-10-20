import { cn } from "@/shared/lib/cn";
import { BREAKPOINT_WIDTHS_PX } from "../lib/properties";
import { BREAKPOINTS } from "../schemas/editor-schemas";
import { useDesignState } from "../store/design-state";

export function BreakpointSwitcher() {
  const breakpoint = useDesignState((s) => s.breakpoint);
  const setBreakpoint = useDesignState((s) => s.setBreakpoint);

  return (
    <div role="radiogroup" aria-label="Breakpoint" className="flex gap-1">
      {BREAKPOINTS.map((name) => (
        <button
          key={name}
          type="button"
          role="radio"
          aria-checked={breakpoint === name}
          title={`${BREAKPOINT_WIDTHS_PX[name]}px`}
          onClick={() => setBreakpoint(name)}
          className={cn(
            "rounded-md px-2 py-0.5 text-[11px]",
            breakpoint === name ? "bg-surface-3 text-foreground" : "text-muted hover:text-foreground",
          )}
        >
          {name}
        </button>
      ))}
    </div>
  );
}
