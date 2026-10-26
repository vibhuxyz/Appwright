import type { ThemeOption } from "@repo/contracts";
import { ThemeCustomControls, ThemeOptionsGrid, useThemeFonts } from "@/features/theme";

export interface ThemeOverrides {
  description?: string;
  referenceColors?: string[];
}

interface ThemeStepProps {
  themes: readonly ThemeOption[];
  selectedId: string | undefined;
  isPending: boolean;
  loadError: string | null;
  isPreset: boolean;
  onSelect: (themeId: string) => void;
  onApplyOverrides: (overrides: ThemeOverrides) => void;
}

export function ThemeStep({ themes, selectedId, isPending, loadError, isPreset, onSelect, onApplyOverrides }: ThemeStepProps) {
  useThemeFonts(themes);
  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-[15px] leading-snug font-medium text-foreground">Design — Pick a design system</h3>
        <p className="mt-1 text-xs text-muted">
          {isPreset
            ? "Starter design systems for this brief. Scroll each one, or describe a look below to generate a new set."
            : "Four full design systems from your prompt and answers: colour, contrast, type, radius, live components and rules."}
        </p>
      </div>
      {loadError ? (
        <p role="alert" className="text-sm text-danger">{loadError}</p>
      ) : (
        <ThemeOptionsGrid themes={themes} selectedId={selectedId} isPending={isPending} onSelect={onSelect} />
      )}
      <ThemeCustomControls disabled={isPending} onApply={onApplyOverrides} />
    </div>
  );
}
