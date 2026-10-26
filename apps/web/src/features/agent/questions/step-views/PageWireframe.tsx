import { ImageIcon } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { layoutBlocks, type WireBlock, type WireKind } from "./wireframe-layout";
import type { PlanSectionSummary } from "./plan-summary";

const LINE = "h-1.5 rounded-full bg-border";
const PHOTO = "grid place-items-center rounded-md bg-info/15 text-info";

function Lines({ widths }: { widths: readonly string[] }) {
  return (
    <div className="flex flex-1 flex-col justify-center gap-1.5">
      {widths.map((width) => <span key={width} className={cn(LINE, width)} />)}
    </div>
  );
}

function Photo({ className }: { className?: string }) {
  return (
    <span className={cn(PHOTO, className)}>
      <ImageIcon aria-hidden="true" className="size-3.5" />
    </span>
  );
}

function BlockArt({ block }: { block: WireBlock }) {
  const art: Record<WireKind, () => React.ReactNode> = {
    header: () => <div className="flex items-center gap-2"><span className="h-2 w-8 rounded-full bg-border" /><span className="ml-auto flex gap-1.5"><span className={cn(LINE, "w-6")} /><span className={cn(LINE, "w-6")} /><span className={cn(LINE, "w-6")} /></span></div>,
    hero: () => <div className="flex gap-3"><Lines widths={["w-3/4", "w-1/2", "w-1/3"]} />{block.hasImage && <Photo className="h-16 w-24 shrink-0" />}</div>,
    gallery: () => <div className="grid grid-cols-4 gap-1.5">{[0, 1, 2, 3].map((slot) => <Photo key={slot} className="h-10" />)}</div>,
    cards: () => <div className="grid grid-cols-3 gap-1.5">{[0, 1, 2].map((slot) => <span key={slot} className="h-10 rounded-md border border-border bg-surface-3" />)}</div>,
    contact: () => <div className="flex flex-col gap-1.5"><span className="h-3 rounded border border-border bg-surface-3" /><span className="h-3 rounded border border-border bg-surface-3" /><span className="h-3 w-16 rounded bg-lime/30" /></div>,
    map: () => <div className="flex gap-3">{block.hasImage ? <Photo className="h-12 w-full" /> : <span className="h-12 w-full rounded-md border border-border bg-surface-3" />}</div>,
    footer: () => <div className="flex gap-3"><span className={cn(LINE, "w-10")} /><span className={cn(LINE, "w-10")} /><span className={cn(LINE, "ml-auto w-8")} /></div>,
    about: () => <div className="flex gap-3">{block.hasImage && <Photo className="h-14 w-16 shrink-0" />}<Lines widths={["w-full", "w-5/6", "w-2/3"]} /></div>,
    text: () => <div className="flex gap-3">{block.hasImage && <Photo className="h-12 w-14 shrink-0" />}<Lines widths={["w-full", "w-3/4"]} /></div>,
  };
  return art[block.kind]();
}

export function PageWireframe({ title, sections }: { title: string; sections: readonly PlanSectionSummary[] }) {
  const blocks = layoutBlocks(sections);
  return (
    <figure aria-label={`Layout sketch of the ${title}`} className="mx-3 mb-3">
      <div className="space-y-1.5 rounded-xl border border-border bg-background p-2">
        {blocks.map((block) => (
          <div key={block.label} className="rounded-lg border border-border-soft bg-surface-2 p-2">
            <p className="mb-1.5 flex items-center gap-1 text-[10px] font-medium tracking-wide text-muted uppercase">
              {block.label}
              {block.hasImage && <ImageIcon aria-label="A photo goes here" className="size-3 text-info" />}
            </p>
            <BlockArt block={block} />
          </div>
        ))}
      </div>
      <figcaption className="mt-1.5 text-[11px] text-muted">A rough sketch, top to bottom. Blue boxes are where photos go.</figcaption>
    </figure>
  );
}
