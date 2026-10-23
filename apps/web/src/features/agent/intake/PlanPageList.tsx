import type { PlanPage } from "@repo/contracts";
import { ImageIcon } from "lucide-react";
import { Badge } from "@/shared/components/ui/Badge";

function PlanPageItem({ page }: { page: PlanPage }) {
  return (
    <li className="flex flex-col gap-1.5 rounded-xl border border-border-soft p-3">
      <div className="flex flex-wrap items-baseline gap-2">
        <span className="font-mono text-xs text-foreground">{page.route}</span>
        <span className="text-xs text-muted">{page.purpose}</span>
      </div>
      {page.sections.length > 0 && (
        <ul className="flex flex-wrap gap-1.5" aria-label={`Sections on ${page.route}`}>
          {page.sections.map((section) => (
            <li key={section.name}>
              <Badge tone={section.image ? "accent" : "neutral"}>
                {section.image && <ImageIcon className="size-3" aria-hidden />}
                {section.name}
                {section.image && <span className="sr-only">, needs a {section.image} image</span>}
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

export function PlanPageList({ pages }: { pages: readonly PlanPage[] }) {
  return (
    <ul className="flex flex-col gap-2">
      {pages.map((page) => (
        <PlanPageItem key={page.route} page={page} />
      ))}
    </ul>
  );
}
