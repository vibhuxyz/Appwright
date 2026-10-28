import { cn } from "@/components/ui/utils";
import { Grain } from "@/components/patterns/effects/decor/grain";
import { PointerDrift } from "@/components/patterns/effects/pointer/pointer-drift";
import { Media, type MediaImage, type MediaRatio } from "@/components/patterns/shared/media";
import { Reveal } from "@/components/patterns/shared/reveal";

const MAX_IMAGES = 5;
const PLACEMENTS: readonly { className: string; ratio: MediaRatio }[] = [
  { className: "col-span-2 md:col-span-7 md:col-start-1 md:row-start-1 md:row-span-3", ratio: "4:5" },
  { className: "md:col-span-4 md:col-start-8 md:row-start-1 md:mt-24", ratio: "3:4" },
  { className: "md:col-span-3 md:col-start-6 md:row-start-3 md:-mt-32 md:z-10 md:self-start md:bg-background md:p-3 md:shadow-lg", ratio: "1:1" },
  { className: "md:col-span-4 md:col-start-9 md:row-start-3", ratio: "4:3" },
  { className: "col-span-2 md:col-span-5 md:col-start-2 md:row-start-4", ratio: "3:2" },
];

export interface CollageImage {
  image: MediaImage;
  caption?: string;
}

export interface ImageCollageProps {
  eyebrow?: string;
  heading: string;
  body?: string;
  images: readonly CollageImage[];
  isInteractive?: boolean;
  hasGrain?: boolean;
}

function CollageFigure({ item, index }: { item: CollageImage; index: number }) {
  const placement = PLACEMENTS[index] ?? PLACEMENTS[0];
  return (
    <figure className={cn("relative", placement?.className)}>
      <Media image={item.image} ratio={placement?.ratio ?? "4:5"} entrance={index === 0 ? "mask" : "wipe"} sizes="(min-width: 768px) 50vw, 100vw" />
      {item.caption && <figcaption className="mt-2 text-xs uppercase tracking-widest text-muted-foreground">{item.caption}</figcaption>}
    </figure>
  );
}

export function ImageCollage({ eyebrow, heading, body, images, isInteractive = false, hasGrain = false }: ImageCollageProps) {
  const shown = images.slice(0, MAX_IMAGES);
  const [lead, ...rest] = shown;
  return (
    <section data-section="gallery.collage" className="relative isolate overflow-hidden bg-background py-24 text-foreground md:py-32">
      {hasGrain && <Grain />}
      <div className="mx-auto max-w-screen-2xl px-4 md:px-8">
        <Reveal className="max-w-2xl">
          {eyebrow && <p className="text-xs uppercase tracking-widest text-muted-foreground">{eyebrow}</p>}
          <h2 className="mt-3 font-heading text-4xl font-bold leading-none tracking-tight text-balance md:text-6xl">{heading}</h2>
          {body && <p className="mt-5 text-lg text-muted-foreground">{body}</p>}
        </Reveal>
        <div className="mt-14 grid grid-cols-2 gap-4 md:grid-cols-12 md:gap-6">
          {lead &&
            (isInteractive ? (
              <PointerDrift className={PLACEMENTS[0]?.className}>
                <CollageFigure item={lead} index={0} />
              </PointerDrift>
            ) : (
              <CollageFigure item={lead} index={0} />
            ))}
          {rest.map((item, index) => (
            <CollageFigure key={item.image.src ?? item.image.alt} item={item} index={index + 1} />
          ))}
        </div>
      </div>
    </section>
  );
}
