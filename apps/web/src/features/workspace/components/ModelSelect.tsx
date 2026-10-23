import { useState } from "react";
import { ChevronDown, ChevronRight, Info, Lock } from "lucide-react";
import {
  canUseModel,
  MODEL_CATEGORIES,
  MODEL_CATEGORY_LABEL,
  modelCategory,
  requiredPlanFor,
  modelsForCategory,
} from "@repo/contracts";
import {
  useAvailableModels,
  FALLBACK_MODELS,
} from "@/features/agent/hooks/useAvailableModels";
import type { AvailableModel, ModelCategory } from "@/features/agent/schemas/agentSchemas";
import { useAuthStore } from "@/stores/authStore";
import { cn } from "@/shared/lib/cn";

const EFFORT_LEVELS = ["Low", "Medium", "High"] as const;

function ModelOptionRow({
  item,
  isSelected,
  isLocked,
  onSelect,
}: {
  item: AvailableModel;
  isSelected: boolean;
  isLocked: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={isSelected}
      aria-disabled={isLocked}
      disabled={isLocked}
      onClick={onSelect}
      className={cn(
        "flex w-full cursor-pointer flex-col rounded-xl px-3 py-2 text-left transition-colors hover:bg-surface-2",
        isSelected && "bg-surface-2",
        isLocked && "cursor-not-allowed opacity-50 hover:bg-transparent",
      )}
    >
      <div className="flex items-center gap-1.5">
        <span className="text-[13px] font-medium text-foreground">{item.name}</span>
        {isLocked && (
          <span className="inline-flex items-center gap-1 rounded bg-surface-3 px-1.5 py-0.5 text-[10px] font-semibold text-muted">
            <Lock className="size-2.5" />
            {requiredPlanFor(item.id)}
          </span>
        )}
        {item.badge && (
          <span className="inline-flex items-center gap-1 rounded bg-surface-3 px-1.5 py-0.5 text-[10px] text-muted">
            <Info className="size-2.5" />
            {item.badge}
          </span>
        )}
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
  const plan = useAuthStore((state) => state.user?.plan ?? "FREE");
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<ModelCategory>("efficient");
  const [effortIndex, setEffortIndex] = useState(1);

  const { data: models = FALLBACK_MODELS, isError, isPending } = useAvailableModels();

  const effort = EFFORT_LEVELS[effortIndex];
  const activeModel =
    models.find((m) => m.id === value) ??
    models.find((m) => m.isDefault) ??
    models[0];
  const selectedId = activeModel?.id ?? value;
  const visibleModels = modelsForCategory(models, tab);

  const openPicker = () => {
    if (activeModel) setTab(modelCategory(activeModel));
    setOpen(true);
  };

  const handleCycleEffort = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEffortIndex((prev) => (prev + 1) % EFFORT_LEVELS.length);
  };

  const moveTab = (direction: 1 | -1) => {
    const index = MODEL_CATEGORIES.indexOf(tab);
    const next = MODEL_CATEGORIES[(index + direction + MODEL_CATEGORIES.length) % MODEL_CATEGORIES.length];
    if (next) setTab(next);
  };

  return (
    <div className="relative">
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Select model"
        onClick={() => (open ? setOpen(false) : openPicker())}
        className="flex cursor-pointer items-center gap-1 rounded-xl px-2 py-1 text-xs text-foreground-secondary transition-colors hover:bg-surface-3 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className="font-medium text-foreground">{activeModel?.name ?? "Model"}</span>
        <span className="text-muted">{effort}</span>
        <ChevronDown className="size-3 text-muted" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className="absolute right-0 bottom-full z-50 mb-2 w-76 rounded-2xl border border-border bg-surface/95 p-1.5 shadow-2xl shadow-black/90 backdrop-blur-md sm:w-80"
            onKeyDown={(event) => {
              if (event.key === "Escape") setOpen(false);
            }}
          >
            <div
              role="tablist"
              aria-label="Model category"
              className="mb-1 flex gap-0.5 rounded-xl bg-surface-2 p-0.5"
              onKeyDown={(event) => {
                if (event.key === "ArrowRight") {
                  event.preventDefault();
                  moveTab(1);
                }
                if (event.key === "ArrowLeft") {
                  event.preventDefault();
                  moveTab(-1);
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
                    onClick={() => setTab(category)}
                    className={cn(
                      "flex-1 cursor-pointer rounded-lg px-2 py-1.5 text-[11px] font-semibold tracking-wide uppercase transition-colors",
                      active
                        ? "bg-surface-3 text-foreground"
                        : "text-muted hover:text-foreground-secondary",
                    )}
                  >
                    {MODEL_CATEGORY_LABEL[category]}
                  </button>
                );
              })}
            </div>

            <div
              role="tabpanel"
              id={`model-panel-${tab}`}
              aria-labelledby={`model-tab-${tab}`}
              className="max-h-64 space-y-0.5 overflow-y-auto pr-1"
            >
              {isError && (
                <p className="px-3 py-2 text-[11px] text-muted">
                  Couldn't refresh models. Showing the last known list.
                </p>
              )}
              {isPending && models.length === 0 && (
                <p className="px-3 py-2 text-[11px] text-muted">Loading models…</p>
              )}
              {!isError && !isPending && models.length === 0 && (
                <p className="px-3 py-2 text-[11px] text-muted">No models available.</p>
              )}
              {models.length > 0 && visibleModels.length === 0 && (
                <p className="px-3 py-2 text-[11px] text-muted">
                  No {MODEL_CATEGORY_LABEL[tab].toLowerCase()} models.
                </p>
              )}
              <div role="listbox" aria-label={MODEL_CATEGORY_LABEL[tab]}>
                {visibleModels.map((item) => (
                  <ModelOptionRow
                    key={item.id}
                    item={item}
                    isSelected={selectedId === item.id}
                    isLocked={!canUseModel(plan, item.id)}
                    onSelect={() => {
                      onChange(item.id);
                      setOpen(false);
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="my-1 border-t border-border-soft" />
            <button
              type="button"
              onClick={handleCycleEffort}
              aria-label={`Effort ${effort}`}
              className="flex w-full cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-left text-xs transition-colors hover:bg-surface-2"
            >
              <span className="text-foreground">Effort</span>
              <div className="flex items-center gap-1 text-muted">
                <span>{effort}</span>
                <ChevronRight className="size-3.5" />
              </div>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
