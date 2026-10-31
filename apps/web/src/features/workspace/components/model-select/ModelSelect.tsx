import { useState, type MouseEvent } from "react";
import { ChevronDown } from "lucide-react";
import {
  AUTO_MODEL,
  AUTO_MODEL_ID,
  canUseModel,
  DEFAULT_EFFORT_LEVEL,
  isAutoModel,
  MODEL_CATEGORIES,
  MODEL_CATEGORY_LABEL,
  modelCategory,
  modelsForCategory,
  parseEffortLevel,
  type EffortLevel,
} from "@repo/contracts";
import { useAvailableModels } from "@/features/agent/hooks/useAvailableModels";
import type { AvailableModel, ModelCategory } from "@/features/agent/schemas/agentSchemas";
import { useAuthStore } from "@/stores/authStore";
import { AutoRow } from "./AutoRow";
import { CategoryTabs } from "./CategoryTabs";
import { EFFORT_LABEL, EFFORT_LEVELS } from "./constants";
import { EffortRow } from "./EffortRow";
import { ModelOptionRow } from "./ModelOptionRow";

const NO_MODELS: readonly AvailableModel[] = [];

export function ModelSelect({
  value,
  effort,
  disabled,
  onChange,
  onEffortChange,
}: {
  value: string;
  effort: EffortLevel | undefined;
  disabled: boolean;
  onChange: (model: string) => void;
  onEffortChange: (effort: EffortLevel) => void;
}) {
  const plan = useAuthStore((state) => state.user?.plan ?? "FREE");
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<ModelCategory>("efficient");
  const { data: models = NO_MODELS, isError, isPending } = useAvailableModels();

  const currentEffort = parseEffortLevel(effort ?? DEFAULT_EFFORT_LEVEL);
  const autoSelected = isAutoModel(value);
  const activeModel = autoSelected
    ? AUTO_MODEL
    : (models.find((m) => m.id === value) ?? models.find((m) => m.isDefault) ?? models[0]);
  const selectedId = autoSelected ? AUTO_MODEL_ID : (activeModel?.id ?? value);
  const visibleModels = modelsForCategory(models, tab);

  const openPicker = () => {
    if (!autoSelected && activeModel) setTab(modelCategory(activeModel));
    setOpen(true);
  };

  const cycleEffort = (event: MouseEvent) => {
    event.stopPropagation();
    const index = EFFORT_LEVELS.indexOf(currentEffort);
    const next = EFFORT_LEVELS[(index + 1) % EFFORT_LEVELS.length];
    if (next) onEffortChange(next);
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
        title={autoSelected ? AUTO_MODEL.description : undefined}
        onClick={() => (open ? setOpen(false) : openPicker())}
        className="flex cursor-pointer items-center gap-1 rounded-xl px-2 py-1 text-xs text-foreground-secondary transition-colors hover:bg-surface-3 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className="font-medium text-foreground">{activeModel?.name ?? "Model"}</span>
        <span className="text-muted">{EFFORT_LABEL[currentEffort]}</span>
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
            <CategoryTabs tab={tab} onTab={setTab} onMove={moveTab} />

            <div
              role="tabpanel"
              id={`model-panel-${tab}`}
              aria-labelledby={`model-tab-${tab}`}
              className="max-h-64 space-y-0.5 overflow-y-auto pr-1"
            >
              {isError && (
                <p className="px-3 py-2 text-[11px] text-muted">Couldn't refresh models. Showing the last known list.</p>
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
                <AutoRow
                  isSelected={autoSelected}
                  onSelect={() => {
                    onChange(AUTO_MODEL_ID);
                    setOpen(false);
                  }}
                />
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
            <EffortRow effort={currentEffort} onCycle={cycleEffort} />
          </div>
        </>
      )}
    </div>
  );
}
