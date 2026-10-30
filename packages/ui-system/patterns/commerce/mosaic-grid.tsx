import { cn } from "@/components/ui/utils";
import { Media, type MediaImage } from "@/components/patterns/shared/media";
import { ON_IMAGE_TEXT_CLASS, ON_IMAGE_TINT_CLASS } from "@/components/patterns/shared/on-image";
import { Reveal } from "@/components/patterns/shared/reveal";

const MAX_TILES = 4;
const LEAD_LAYOUT_TILE_COUNT = 3;
const DEFAULT_LINK_LABEL = "Shop now";

export interface MosaicTile {
  title: string;
  subtitle?: string;
  href: string;
  linkLabel?: string;
  image: MediaImage;
}

export interface MosaicGridProps {
  heading?: string;
  tiles: readonly MosaicTile[];
}

interface TileProps {
  tile: MosaicTile;
  className?: string;
}

function Tile({ tile, className }: TileProps) {
  return (
    <Reveal from="scale" className={cn("h-full", className)}>
      <a href={tile.href} className="group relative block aspect-4/5 h-full overflow-hidden focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring md:aspect-auto">
        <Media image={tile.image} fill imageClassName="transition-transform duration-700 ease-out motion-safe:group-hover:scale-105" />
        <div aria-hidden="true" className={cn("absolute inset-0", ON_IMAGE_TINT_CLASS)} />
        <div className={cn("absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center", ON_IMAGE_TEXT_CLASS)}>
          <h3 className="font-heading text-2xl font-semibold uppercase tracking-tight text-balance md:text-4xl">{tile.title}</h3>
          {tile.subtitle && <p className="text-sm">{tile.subtitle}</p>}
          <span className="text-xs uppercase tracking-widest underline underline-offset-4">{tile.linkLabel ?? DEFAULT_LINK_LABEL}</span>
        </div>
      </a>
    </Reveal>
  );
}

export function MosaicGrid({ heading, tiles }: MosaicGridProps) {
  const shown = tiles.slice(0, MAX_TILES);
  if (shown.length === 0) return null;
  const hasLead = shown.length === LEAD_LAYOUT_TILE_COUNT;
  return (
    <section data-section="commerce.mosaic" className="bg-background px-4 py-10 md:px-8">
      <div className="mx-auto max-w-screen-2xl">
        {heading && <h2 className="mb-6 text-xs font-semibold uppercase tracking-widest">{heading}</h2>}
        <div className={cn("grid grid-cols-2 gap-2 md:gap-3", hasLead && "md:grid-cols-3 md:grid-rows-2 md:aspect-2/1")}>
          {shown.map((tile, index) => (
            <Tile key={`${tile.title}-${index}`} tile={tile} className={cn(hasLead && index === 0 && "col-span-2 md:row-span-2")} />
          ))}
        </div>
      </div>
    </section>
  );
}
