import { Check } from "lucide-react";
import type { ThemeOption } from "@repo/contracts";
import { cn } from "@/shared/lib/cn";
import { ThemeDesignSystem } from "./ThemeDesignSystem";

export function ThemeOptionCard({
  theme,
  selected,
  onSelect,
}: {
  theme: ThemeOption;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <article
      className={cn(
        "flex min-h-0 flex-col overflow-hidden rounded-xl border",
        selected ? "border-lime ring-1 ring-lime" : "border-border",
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={selected}
        aria-label={`Select ${theme.name} design system`}
        className={cn(
          "flex items-center justify-between gap-2 px-3 py-2 text-left",
          selected ? "bg-lime/10" : "bg-surface-2 hover:bg-surface-3",
        )}
      >
        <span>
          <span className="block text-xs font-semibold text-foreground">{theme.name}</span>
          <span className="block text-[10px] text-muted capitalize">
            {theme.mood}
            {theme.density ? ` · ${theme.density}` : ""}
            {` · ${theme.fonts.heading}`}
          </span>
        </span>
        {selected ? <Check className="size-4 shrink-0 text-lime" aria-hidden /> : null}
      </button>
      <div
        className="max-h-160 overflow-y-auto overscroll-contain"
        tabIndex={0}
        aria-label={`${theme.name} design system`}
      >
        <ThemeDesignSystem theme={theme} />
      </div>
    </article>
  );
}
