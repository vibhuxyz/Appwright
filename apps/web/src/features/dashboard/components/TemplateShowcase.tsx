import { ArrowRight } from "lucide-react";
import { TEMPLATES, type TemplateItem } from "../data/templatesData";
import { TemplateCard } from "./TemplateCard";

export function TemplateShowcase({
  onSelectTemplate,
}: {
  onSelectTemplate: (template: TemplateItem) => void;
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            Ready-to-use templates
          </h2>
          <p className="mt-1 text-sm text-muted">
            Production-ready apps you can deploy in minutes.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onSelectTemplate(TEMPLATES[0])}
          className="group flex cursor-pointer items-center gap-1.5 text-sm font-semibold text-foreground-secondary transition-colors hover:text-lime"
        >
          <span>View all templates</span>
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>

      <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
        {TEMPLATES.map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            onSelect={onSelectTemplate}
          />
        ))}
      </div>
    </section>
  );
}
