import type { SectionEntry, SectionReview } from "@repo/ui-system/sections";
import { sourceById } from "@repo/ui-system/sections";
import { Button } from "@/shared/components/ui/Button";
import { SectionPreview } from "./SectionPreview";

export function SectionCard({
  section,
  review,
  compared,
  onOpen,
  onCompare,
  onReview,
}: {
  section: SectionEntry;
  review: SectionReview | undefined;
  compared: boolean;
  onOpen: () => void;
  onCompare: () => void;
  onReview: (decision: SectionReview["decision"]) => void;
}) {
  const source = sourceById(section.sourceId);
  return (
    <article className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-3">
      <SectionPreview layout={section.layoutPattern} label={section.id} />
      <div className="flex flex-col gap-1">
        <h2 className="text-sm font-semibold text-foreground">{section.name}</h2>
        <p className="text-xs text-muted">
          {section.purpose} · {section.layoutPattern} · {source?.license ?? "unknown license"}
        </p>
        <p className="text-xs text-foreground-secondary">{section.description}</p>
        {review && <p className="text-xs text-muted">Review: {review.decision}</p>}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onOpen}>
          Details
        </Button>
        <Button type="button" variant="outline" size="sm" aria-pressed={compared} onClick={onCompare}>
          {compared ? "Compared" : "Compare"}
        </Button>
        <Button type="button" variant="ghost" size="sm" aria-pressed={review?.decision === "approved"} onClick={() => onReview("approved")}>
          Approve
        </Button>
        <Button type="button" variant="ghost" size="sm" aria-pressed={review?.decision === "rejected"} onClick={() => onReview("rejected")}>
          Reject
        </Button>
      </div>
    </article>
  );
}
