import { useState } from "react";
import { EMPTY_SECTION_FILTER, SECTION_CATALOG, filterSections, type SectionFilter, type SectionReview } from "@repo/ui-system/sections";
import { AppHeader } from "@/app/layouts/AppHeader";
import { useSectionReviews } from "../hooks";
import { CatalogFilters } from "./CatalogFilters";
import { CompareStrip } from "./CompareStrip";
import { SectionDetail } from "./SectionDetail";
import { SectionGrid } from "./SectionGrid";

const MAX_COMPARE = 3;

function toggleCompare(ids: readonly string[], id: string): string[] {
  if (ids.includes(id)) return ids.filter((item) => item !== id);
  if (ids.length >= MAX_COMPARE) return [...ids];
  return [...ids, id];
}

export function SectionCatalogPage() {
  const [filter, setFilter] = useState<SectionFilter>(EMPTY_SECTION_FILTER);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const { reviews, record } = useSectionReviews();
  const visible = filterSections(SECTION_CATALOG, filter, reviews);
  const layouts = [...new Set(SECTION_CATALOG.map((section) => section.layoutPattern))].sort();
  const styles = [...new Set(SECTION_CATALOG.flatMap((section) => section.styles))].sort();
  const active = SECTION_CATALOG.find((section) => section.id === activeId);
  const compared = compareIds.flatMap((id) => {
    const section = SECTION_CATALOG.find((item) => item.id === id);
    return section ? [section] : [];
  });

  const reviewFor = (id: string): SectionReview | undefined => reviews.find((review) => review.sectionId === id);

  return (
    <div className="flex h-screen flex-col bg-background">
      <AppHeader project={<span className="text-sm text-muted">Section catalog</span>} />
      <div className="mx-auto flex w-full max-w-screen-2xl flex-1 flex-col gap-6 overflow-y-auto px-4 py-6 sm:px-8">
        <header className="flex flex-col gap-2">
          <h1 className="text-xl font-semibold text-foreground">Section catalog</h1>
          <p className="max-w-3xl text-sm text-foreground-secondary">
            Structural previews of accepted sections. Screenshots were not captured. Approvals stay in this browser and do not change planner ranking.
          </p>
        </header>
        <CatalogFilters filter={filter} layouts={layouts} styles={styles} onChange={setFilter} />
        <CompareStrip sections={compared} onClear={() => setCompareIds([])} />
        {active && <SectionDetail section={active} review={reviewFor(active.id)} onClose={() => setActiveId(null)} />}
        <SectionGrid
          sections={visible}
          compareIds={compareIds}
          reviewFor={reviewFor}
          onOpen={setActiveId}
          onCompare={(id) => setCompareIds((current) => toggleCompare(current, id))}
          onReview={(id, decision) => record({ sectionId: id, decision, note: "" })}
        />
      </div>
    </div>
  );
}
