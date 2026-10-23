import type { SectionEntry, SectionReview } from "@repo/ui-system/sections";
import { SectionCard } from "./SectionCard";

export function SectionGrid({
  sections,
  compareIds,
  reviewFor,
  onOpen,
  onCompare,
  onReview,
}: {
  sections: readonly SectionEntry[];
  compareIds: readonly string[];
  reviewFor: (id: string) => SectionReview | undefined;
  onOpen: (id: string) => void;
  onCompare: (id: string) => void;
  onReview: (id: string, decision: SectionReview["decision"]) => void;
}) {
  if (sections.length === 0) return <p className="text-sm text-muted">No sections match these filters.</p>;
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {sections.map((section) => (
        <SectionCard
          key={section.id}
          section={section}
          review={reviewFor(section.id)}
          compared={compareIds.includes(section.id)}
          onOpen={() => onOpen(section.id)}
          onCompare={() => onCompare(section.id)}
          onReview={(decision) => onReview(section.id, decision)}
        />
      ))}
    </div>
  );
}
