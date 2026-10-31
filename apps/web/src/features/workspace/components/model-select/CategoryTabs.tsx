import { MODEL_CATEGORIES, MODEL_CATEGORY_LABEL } from "@repo/contracts";
import type { ModelCategory } from "@/features/agent/schemas/agentSchemas";
import { cn } from "@/shared/lib/cn";

export function CategoryTabs({
  tab,
  onTab,
  onMove,
}: {
  tab: ModelCategory;
  onTab: (category: ModelCategory) => void;
  onMove: (direction: 1 | -1) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Model category"
      className="mb-1 flex gap-0.5 rounded-xl bg-surface-2 p-0.5"
      onKeyDown={(event) => {
        if (event.key === "ArrowRight") {
          event.preventDefault();
          onMove(1);
        }
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          onMove(-1);
        }
      }}
    >
      {MODEL_CATEGORIES.map((category) => {
        const active = category === tab;
        return (
          <button
            key={category}
            type="button"
            role="tab"
            id={`model-tab-${category}`}
            aria-selected={active}
            aria-controls={`model-panel-${category}`}
            tabIndex={active ? 0 : -1}
            onClick={() => onTab(category)}
            className={cn(
              "flex-1 cursor-pointer rounded-lg px-2 py-1.5 text-[11px] font-semibold tracking-wide uppercase transition-colors",
              active ? "bg-surface-3 text-foreground" : "text-muted hover:text-foreground-secondary",
            )}
          >
            {MODEL_CATEGORY_LABEL[category]}
          </button>
        );
      })}
    </div>
  );
}
