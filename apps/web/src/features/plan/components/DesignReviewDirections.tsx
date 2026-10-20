import { useState } from "react";
import { Check, Sparkles } from "lucide-react";
import type { DesignDirection } from "@repo/contracts";
import { Button } from "@/shared/components/ui/Button";
import { cn } from "@/shared/lib/cn";

interface DesignReviewDirectionsProps {
  directions: readonly DesignDirection[];
  onSelect: (direction: DesignDirection) => void;
  onSkip: () => void;
  isSubmitting?: boolean;
}

export function DesignReviewDirections({
  directions,
  onSelect,
  onSkip,
  isSubmitting = false,
}: DesignReviewDirectionsProps) {
  const defaultDir = directions.find((d) => d.isDefault) ?? directions[0];
  const [selectedId, setSelectedId] = useState<string>(defaultDir?.id ?? "");

  const selected = directions.find((d) => d.id === selectedId) ?? defaultDir;

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="flex items-center gap-2 text-base font-semibold text-foreground">
            <Sparkles className="size-4 text-primary" aria-hidden />
            Choose a Design Direction
          </h3>
          <p className="text-xs text-muted">
            Preview directions before code generation starts. You can change this or skip.
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={onSkip} disabled={isSubmitting}>
          Skip to default
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {directions.map((dir) => {
          const isChosen = dir.id === selectedId;
          const { colorPalette } = dir.preview;
          return (
            <button
              type="button"
              key={dir.id}
              onClick={() => setSelectedId(dir.id)}
              className={cn(
                "relative flex flex-col items-start gap-2.5 rounded-xl border p-4 text-left transition-all",
                isChosen
                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                  : "border-border bg-surface hover:border-border-subtle",
              )}
            >
              {dir.isDefault && (
                <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[10px] font-medium text-muted">
                  Default
                </span>
              )}
              <div className="flex w-full items-center justify-between">
                <span className="text-sm font-semibold text-foreground">{dir.title}</span>
                {isChosen && <Check className="size-4 text-primary" aria-hidden />}
              </div>
              <p className="text-xs leading-relaxed text-muted">{dir.description}</p>

              <div className="mt-2 flex w-full items-center gap-1.5 pt-2 border-t border-border-subtle">
                <div
                  className="size-5 rounded-full border border-border"
                  style={{ backgroundColor: colorPalette.primary }}
                  title={`Primary: ${colorPalette.primary}`}
                />
                <div
                  className="size-5 rounded-full border border-border"
                  style={{ backgroundColor: colorPalette.accent }}
                  title={`Accent: ${colorPalette.accent}`}
                />
                <span className="text-[10px] text-muted ml-auto">{dir.preview.typography}</span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-end gap-2 pt-2">
        <Button
          onClick={() => selected && onSelect(selected)}
          disabled={isSubmitting || !selected}
        >
          {isSubmitting ? "Generating plan…" : "Proceed with selected design"}
        </Button>
      </div>
    </div>
  );
}
