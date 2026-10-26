import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { PageWireframe } from "./PageWireframe";
import { countLabel, type PlanPageSummary } from "./plan-summary";

const INITIAL_VISIBLE_PAGES = 5;

function PlanPageRow({ page }: { page: PlanPageSummary }) {
  const [isOpen, setIsOpen] = useState(false);
  const photoNote = page.imageCount > 0 ? ` · ${countLabel(page.imageCount, "photo")}` : "";
  return (
    <li>
      <button
        type="button"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
        className="flex w-full cursor-pointer items-start gap-3 px-3 py-2.5 text-left transition-colors hover:bg-surface-3/60"
      >
        <span className="min-w-0 flex-1">
          <span className="block text-[13px] font-medium text-foreground">{page.title}</span>
          <span className="mt-0.5 block text-xs leading-snug text-muted">{page.purpose}</span>
        </span>
        <span className="shrink-0 pt-0.5 text-[11px] text-muted">{countLabel(page.sections.length, "part")}{photoNote}</span>
        {isOpen ? <ChevronDown aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 text-muted" /> : <ChevronRight aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 text-muted" />}
      </button>
      {isOpen && <PageWireframe title={page.title} sections={page.sections} />}
    </li>
  );
}

export function PlanPagesList({ pages }: { pages: readonly PlanPageSummary[] }) {
  const [isShowingAll, setIsShowingAll] = useState(false);
  const visible = isShowingAll ? pages : pages.slice(0, INITIAL_VISIBLE_PAGES);
  const hiddenCount = pages.length - visible.length;
  return (
    <div className="overflow-hidden rounded-xl border border-border-soft">
      <ul className="divide-y divide-border-soft">
        {visible.map((page) => <PlanPageRow key={page.route} page={page} />)}
      </ul>
      {pages.length > INITIAL_VISIBLE_PAGES && (
        <button
          type="button"
          onClick={() => setIsShowingAll((showing) => !showing)}
          className="w-full cursor-pointer border-t border-border-soft px-3 py-2 text-left text-xs text-muted transition-colors hover:text-foreground"
        >
          {hiddenCount > 0 ? `Show all ${pages.length} pages` : "Show fewer pages"}
        </button>
      )}
    </div>
  );
}
