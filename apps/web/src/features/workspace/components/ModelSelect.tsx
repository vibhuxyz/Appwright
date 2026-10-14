import { useState } from "react";
import { Check, ChevronDown, ChevronRight, Info } from "lucide-react";
import {
  useAvailableModels,
  FALLBACK_MODELS,
} from "@/features/agent/hooks/useAvailableModels";
import type { AvailableModel } from "@/features/agent/schemas/agentSchemas";

const EFFORT_LEVELS = ["Low", "Medium", "High"] as const;

function ModelOptionRow({
  item,
  isSelected,
  onSelect,
}: {
  item: AvailableModel;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex w-full cursor-pointer flex-col rounded-xl px-3 py-2 text-left transition-colors hover:bg-surface-2"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-[13px] font-medium text-foreground">{item.name}</span>
          {item.badge && (
            <span className="inline-flex items-center gap-1 rounded bg-surface-3 px-1.5 py-0.5 text-[10px] text-muted">
              <Info className="size-2.5" />
              {item.badge}
            </span>
          )}
        </div>
        {isSelected && <Check className="size-4 text-blue-500" />}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[11px] text-muted">{item.description}</span>
        <span className="ml-auto shrink-0 text-[10px] font-medium text-muted/80">
          {item.provider}
        </span>
      </div>
    </button>
  );
}

export function ModelSelect({
  value,
  disabled,
  onChange,
}: {
  value: string;
  disabled: boolean;
  onChange: (model: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [effortIndex, setEffortIndex] = useState(1); // Default "Medium"

  const { data: models = FALLBACK_MODELS } = useAvailableModels();

  const effort = EFFORT_LEVELS[effortIndex];
  const activeModel =
    models.find((m) => m.id === value) ??
    models.find((m) => m.isDefault) ??
    models[0];

  const primaryModels = models.slice(0, 4);
  const displayedModels = showMore ? models : primaryModels;
  const additionalCount = models.length - primaryModels.length;

  const handleCycleEffort = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEffortIndex((prev) => (prev + 1) % EFFORT_LEVELS.length);
  };

  return (
    <div className="relative">
      {/* Trigger button: e.g. Gemini 3.7 Flash Medium ⌵ */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        className="flex cursor-pointer items-center gap-1 rounded-xl px-2 py-1 text-xs text-foreground-secondary transition-colors hover:bg-surface-3 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className="font-medium text-foreground">{activeModel?.name ?? "Model"}</span>
        <span className="text-muted">{effort}</span>
        <ChevronDown className="size-3 text-muted" />
      </button>

      {/* Popover menu */}
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 bottom-full z-50 mb-2 w-76 rounded-2xl border border-[#2D313A] bg-[#16181D]/95 p-1.5 shadow-2xl shadow-black/90 backdrop-blur-md sm:w-80">
            {/* Scrollable models area: expands slightly when showMore is active */}
            <div
              className={`space-y-0.5 overflow-y-auto pr-1 transition-all ${
                showMore ? "max-h-72" : "max-h-60"
              }`}
            >
              {displayedModels.map((item) => (
                <ModelOptionRow
                  key={item.id}
                  item={item}
                  isSelected={activeModel?.id === item.id}
                  onSelect={() => {
                    onChange(item.id);
                    setOpen(false);
                  }}
                />
              ))}
            </div>

            {/* Fixed footer: Effort always pinned at bottom */}
            <div className="my-1 border-t border-border-soft" />
            <button
              type="button"
              onClick={handleCycleEffort}
              className="flex w-full cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-left text-xs transition-colors hover:bg-surface-2"
            >
              <span className="text-foreground">Effort</span>
              <div className="flex items-center gap-1 text-muted">
                <span>{effort}</span>
                <ChevronRight className="size-3.5" />
              </div>
            </button>

            {/* Fixed footer: More models toggle always pinned at bottom */}
            {additionalCount > 0 && (
              <>
                <div className="my-1 border-t border-border-soft" />
                <button
                  type="button"
                  onClick={() => setShowMore((s) => !s)}
                  className="flex w-full cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-left text-xs transition-colors hover:bg-surface-2"
                >
                  <span className="text-foreground">
                    {showMore ? "Show fewer models" : `More models (${additionalCount})`}
                  </span>
                  <ChevronDown
                    className={`size-3.5 text-muted transition-transform ${showMore ? "rotate-180" : ""}`}
                  />
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
