import type { SectionEntry } from "@repo/ui-system/sections";
import { Button } from "@/shared/components/ui/Button";
import { SectionPreview } from "./SectionPreview";

export function CompareStrip({ sections, onClear }: { sections: readonly SectionEntry[]; onClear: () => void }) {
  if (sections.length < 2) return null;
  return (
    <section className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Compare</h2>
        <Button type="button" variant="ghost" size="sm" onClick={onClear}>
          Clear
        </Button>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {sections.map((section) => (
          <div key={section.id} className="flex flex-col gap-2">
            <SectionPreview layout={section.layoutPattern} label={section.id} />
            <p className="text-xs text-foreground">{section.name}</p>
            <p className="text-xs text-muted">
              {section.layoutPattern} · {section.styles.join(", ")} · {section.primitives.join(", ")}
            </p>
            <p className="text-xs text-foreground-secondary">{section.contentFields.join(", ")}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
