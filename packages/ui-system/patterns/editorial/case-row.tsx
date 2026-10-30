import { cn } from "@/components/ui/utils";
import { Media, type MediaImage } from "@/components/patterns/shared/media";
import { Reveal } from "@/components/patterns/shared/reveal";

const MAX_ROWS = 4;
const DEFAULT_LINK_LABEL = "Case study";

export interface CaseRowItem {
  eyebrow?: string;
  title: string;
  summary: string;
  href: string;
  linkLabel?: string;
  image: MediaImage;
}

export interface CaseRowProps {
  heading?: string;
  items: readonly CaseRowItem[];
}

interface RowProps {
  item: CaseRowItem;
  isFlipped: boolean;
}

function Row({ item, isFlipped }: RowProps) {
  return (
    <article className="grid grid-cols-12 items-end gap-y-8 md:gap-x-8">
      <Reveal from={isFlipped ? "right" : "left"} className={cn("col-span-12 md:col-span-6", isFlipped && "md:order-2")}>
        <Media image={item.image} ratio="4:5" hover="zoom" />
      </Reveal>
      <Reveal delay={0.1} className={cn("col-span-12 md:col-span-5", isFlipped ? "md:order-1" : "md:col-start-8")}>
        {item.eyebrow && <p className="mb-4 text-xs uppercase tracking-widest text-muted-foreground">{item.eyebrow}</p>}
        <h3 className="font-heading text-3xl tracking-tight text-balance md:text-5xl">{item.title}</h3>
        <p className="mt-4 line-clamp-2 text-muted-foreground">{item.summary}</p>
        <a href={item.href} className="group mt-6 inline-flex items-center gap-3 text-xs uppercase tracking-widest">
          {item.linkLabel ?? DEFAULT_LINK_LABEL}
          <span aria-hidden="true" className="h-px w-10 origin-left bg-current transition-transform duration-300 ease-out group-hover:scale-x-150" />
        </a>
      </Reveal>
    </article>
  );
}

export function CaseRow({ heading, items }: CaseRowProps) {
  const rows = items.slice(0, MAX_ROWS);
  if (rows.length === 0) return null;
  return (
    <section data-section="story.case-row" className="bg-background text-foreground">
      <div className="mx-auto max-w-screen-xl px-4 py-24 md:px-8 md:py-32">
        {heading && <h2 className="mb-16 text-xs uppercase tracking-widest text-muted-foreground">{heading}</h2>}
        <div className="flex flex-col gap-24 md:gap-40">
          {rows.map((item, index) => (
            <Row key={`${item.title}-${index}`} item={item} isFlipped={index % 2 === 1} />
          ))}
        </div>
      </div>
    </section>
  );
}
