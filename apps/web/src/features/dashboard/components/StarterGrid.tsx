import { Check } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { SUGGESTED_TEMPLATES, type StarterTemplate } from "../data/starterTemplates";

export function StarterGrid({
  selectedTemplate,
  onSelect,
}: {
  selectedTemplate: string;
  onSelect: (template: StarterTemplate) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-bold tracking-wider text-muted uppercase">
          3. Suggested Starters
        </label>
        <span className="text-[10px] text-muted">Click to auto-configure</span>
      </div>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {SUGGESTED_TEMPLATES.map((t) => {
          const isSelected = selectedTemplate === t.name;
          const Icon = t.Icon;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onSelect(t)}
              className={cn(
                "group flex cursor-pointer flex-col justify-between rounded-xl border p-2.5 text-left transition-all",
                isSelected
                  ? "border-lime bg-lime/10 shadow-xs shadow-lime/20"
                  : "border-border/60 bg-surface/70 hover:border-border hover:bg-surface-2",
              )}
            >
              <div className="flex w-full items-center justify-between">
                <div className={cn("grid size-6 place-items-center rounded-lg border", t.iconStyle)}>
                  <Icon className="size-3" />
                </div>
                {isSelected && <Check className="size-3 text-lime" />}
              </div>
              <div className="mt-2 min-w-0">
                <p className="truncate text-xs font-semibold text-foreground group-hover:text-lime">
                  {t.name}
                </p>
                <p className="text-[10px] text-muted">{t.desc}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
