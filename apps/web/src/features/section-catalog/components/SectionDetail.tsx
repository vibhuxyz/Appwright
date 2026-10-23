import type { SectionEntry, SectionReview } from "@repo/ui-system/sections";
import { sourceById } from "@repo/ui-system/sections";
import { Button } from "@/shared/components/ui/Button";

export function SectionDetail({
  section,
  review,
  onClose,
}: {
  section: SectionEntry;
  review: SectionReview | undefined;
  onClose: () => void;
}) {
  const source = sourceById(section.sourceId);
  return (
    <aside className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-foreground">{section.name}</h2>
          <p className="text-xs text-muted">{section.id}</p>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={onClose}>
          Close
        </Button>
      </div>
      <p className="text-sm text-foreground-secondary">{section.description}</p>
      {review && <p className="text-xs text-muted">Your review: {review.decision}</p>}
      <dl className="grid gap-2 text-xs">
        <div>
          <dt className="text-muted">Source</dt>
          <dd>{source ? `${source.author} · ${source.license} · ${source.decision}` : section.sourceId}</dd>
        </div>
        <div>
          <dt className="text-muted">Revision</dt>
          <dd>{source?.revision ?? "unknown"}</dd>
        </div>
        <div>
          <dt className="text-muted">Primitives</dt>
          <dd>{section.primitives.join(", ")}</dd>
        </div>
        <div>
          <dt className="text-muted">Content fields</dt>
          <dd>{section.contentFields.join(", ")}</dd>
        </div>
        <div>
          <dt className="text-muted">Assets</dt>
          <dd>{section.assets.length === 0 ? "none" : section.assets.map((asset) => `${asset.purpose} ${asset.aspect}`).join(", ")}</dd>
        </div>
        <div>
          <dt className="text-muted">Responsive</dt>
          <dd>{section.responsive}</dd>
        </div>
        <div>
          <dt className="text-muted">Checks</dt>
          <dd>{section.checks.map((check) => `${check.id}: ${check.status}`).join("; ")}</dd>
        </div>
      </dl>
      <p className="text-xs text-muted">{source?.reason}</p>
    </aside>
  );
}
