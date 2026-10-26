import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { CAROUSEL_TEMPLATES, SUGGESTED_TEMPLATES, type StarterTemplate } from "../data/starterTemplates";

const BLANK_TEMPLATE = SUGGESTED_TEMPLATES[0];
const CAROUSEL_SIZE = 3;

export function StarterGrid({
  selectedTemplate,
  carouselOffset,
  isAutoPlay,
  onSelect,
  onShift,
}: {
  selectedTemplate: StarterTemplate["id"] | null;
  carouselOffset: number;
  isAutoPlay: boolean;
  onSelect: (template: StarterTemplate) => void;
  onShift: (direction: number) => void;
}) {
  const visibleTemplates = Array.from({ length: CAROUSEL_SIZE }, (_, index) =>
    CAROUSEL_TEMPLATES[(carouselOffset + index) % CAROUSEL_TEMPLATES.length],
  ).filter((template): template is StarterTemplate => Boolean(template));

  const selectTemplate = (template: StarterTemplate) => {
    onSelect(template);
  };

  if (!BLANK_TEMPLATE) return null;

  return (
    <section aria-labelledby="starter-templates-title" className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 id="starter-templates-title" className="text-xs font-bold tracking-wide text-muted uppercase">
          Suggested starters
        </h3>
        <span className="text-[11px] text-muted">
          {isAutoPlay ? "Auto rotates every 5 seconds" : "Rotation paused"}
        </span>
      </div>
      <div className="grid grid-cols-[minmax(100px,0.8fr)_minmax(0,2fr)] gap-2">
        <TemplateButton
          template={BLANK_TEMPLATE}
          isSelected={selectedTemplate === BLANK_TEMPLATE.id}
          onSelect={selectTemplate}
          className="min-h-24"
        />
        <div className="min-w-0 rounded-xl border border-border/70 bg-black/10 p-2">
          <div className="mb-2 flex items-center justify-end gap-1">
            <button type="button" aria-label="Previous templates" onClick={() => onShift(-1)} className="rounded-md p-1.5 text-muted hover:bg-surface-2 hover:text-foreground focus-visible:outline-2 focus-visible:outline-lime">
              <ArrowLeft className="size-3.5" />
            </button>
            <button type="button" aria-label="Next templates" onClick={() => onShift(1)} className="rounded-md p-1.5 text-muted hover:bg-surface-2 hover:text-foreground focus-visible:outline-2 focus-visible:outline-lime">
              <ArrowRight className="size-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2" aria-live="polite">
            {visibleTemplates.map((template) => (
              <TemplateButton
                key={template.id}
                template={template}
                isSelected={selectedTemplate === template.id}
                onSelect={selectTemplate}
                className="min-h-16"
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function TemplateButton({
  template,
  isSelected,
  onSelect,
  className,
}: {
  template: StarterTemplate;
  isSelected: boolean;
  onSelect: (template: StarterTemplate) => void;
  className: string;
}) {
  const Icon = template.Icon;
  return (
    <button
      type="button"
      aria-pressed={isSelected}
      onClick={() => onSelect(template)}
      className={cn(
        "group flex min-w-0 cursor-pointer flex-col justify-between rounded-xl border p-2.5 text-left transition-colors focus-visible:outline-2 focus-visible:outline-lime",
        isSelected ? "border-lime bg-lime/10" : "border-border/70 bg-surface/70 hover:border-border hover:bg-surface-2",
        className,
      )}
    >
      <span className="flex items-center justify-between gap-1">
        <span className={cn("grid size-6 place-items-center rounded-lg border", template.iconStyle)}>
          <Icon className="size-3" />
        </span>
        {isSelected && <Check className="size-3 shrink-0 text-lime" />}
      </span>
      <span className="mt-2 min-w-0">
        <span className="block truncate text-xs font-semibold text-foreground">{template.name}</span>
        <span className="block truncate text-[10px] text-muted">{template.desc}</span>
      </span>
    </button>
  );
}
