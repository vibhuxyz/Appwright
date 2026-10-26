import { Check, Sparkles } from "lucide-react";
import type { StarterTemplate } from "../../data/starterTemplates";
import { StarterMockup } from "./StarterMockup";
import styles from "./starter-preview.module.css";

export function TemplatePreview({ template }: { template: StarterTemplate | null }) {
  if (!template) {
    return (
      <section className="flex min-h-0 flex-1 items-center justify-center bg-[#101216]" aria-label="Template preview">
        <p className="max-w-sm px-6 text-center text-sm text-muted">Choose a starter below to preview it here.</p>
      </section>
    );
  }

  const Icon = template.Icon;
  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border/70 bg-[#101216]" aria-label={`${template.name} preview`}>
      <div className="flex items-center gap-2 border-b border-border/60 px-4 py-3">
        <span className="grid size-7 place-items-center rounded-lg border border-sky-400/30 bg-sky-500/10 text-sky-300">
          <Icon className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold text-foreground">{template.name}</h3>
          <p className="text-[11px] text-muted">Next.js full-stack starter</p>
        </div>
        <span className="flex items-center gap-1 rounded-full bg-success/10 px-2 py-1 text-[10px] text-success">
          <Check className="size-3" /> Preview
        </span>
      </div>
      <div className="flex min-h-0 flex-1 items-center justify-center overflow-y-auto bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-sky-500/10 via-[#101216] to-[#101216] p-6">
        <div key={template.id} className={`${styles.previewEnter} w-full max-w-2xl`}>
          <Sparkles className="mb-3 size-5 text-lime" />
          <StarterMockup template={template} />
        </div>
      </div>
      <p className="border-t border-border/60 px-4 py-3 text-xs text-muted">{template.desc}</p>
    </section>
  );
}
