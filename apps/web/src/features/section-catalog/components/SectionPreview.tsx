function frameClass(layout: string): string {
  if (layout === "split" || layout === "aside" || layout === "stage" || layout === "split-form") return "grid-cols-2";
  if (layout === "icon-row" || layout === "scroller" || layout === "metric-strip" || layout === "columns" || layout === "card-grid" || layout === "image-row") {
    return "grid-cols-3";
  }
  if (layout === "sidebar") return "grid-cols-[40px_1fr]";
  return "grid-cols-1";
}

export function SectionPreview({ layout, label }: { layout: string; label: string }) {
  const cells = layout === "band" || layout === "quote" || layout === "inline" || layout === "centered" ? 1 : 3;
  return (
    <div className={`grid h-24 gap-1 rounded-md border border-border bg-background p-2 ${frameClass(layout)}`} aria-hidden>
      {Array.from({ length: cells }, (_, index) => (
        <div key={`${label}-${index}`} className={index === 0 ? "rounded-sm bg-surface-3" : "rounded-sm bg-surface-2"} />
      ))}
    </div>
  );
}
