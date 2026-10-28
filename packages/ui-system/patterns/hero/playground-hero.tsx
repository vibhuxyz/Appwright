import { DraggableCards } from "@/components/patterns/effects/pointer/draggable-cards";
import { MaskedText } from "@/components/patterns/shared/masked-text";
import { Media, type MediaImage } from "@/components/patterns/shared/media";

const MAX_CARDS = 6;
const CARD_LAYOUT = [
  { left: 6, top: 14, rotate: -6 },
  { left: 30, top: 48, rotate: 4 },
  { left: 56, top: 10, rotate: -3 },
  { left: 74, top: 46, rotate: 7 },
  { left: 16, top: 60, rotate: 3 },
  { left: 48, top: 62, rotate: -5 },
] as const;

export interface PlaygroundItem {
  id: string;
  label: string;
  image: MediaImage;
}

export interface PlaygroundHeroProps {
  eyebrow?: string;
  title: string;
  intro?: string;
  items: readonly PlaygroundItem[];
  action?: { label: string; href: string };
}

export function PlaygroundHero({ eyebrow, title, intro, items, action }: PlaygroundHeroProps) {
  const shown = items.slice(0, MAX_CARDS);
  const cards = shown.map((item, index) => ({
    id: item.id,
    label: item.label,
    left: CARD_LAYOUT[index]?.left ?? 0,
    top: CARD_LAYOUT[index]?.top ?? 0,
    rotate: CARD_LAYOUT[index]?.rotate ?? 0,
    content: (
      <figure className="w-40 bg-card p-2 pb-3 text-card-foreground shadow-lg lg:w-52">
        <Media image={item.image} ratio="4:5" sizes="208px" />
        <figcaption className="mt-2 text-xs uppercase tracking-widest">{item.label}</figcaption>
      </figure>
    ),
  }));
  return (
    <section data-section="hero.playground" className="relative overflow-hidden bg-background text-foreground">
      <div className="mx-auto max-w-screen-2xl px-4 pt-28 md:px-8">
        {eyebrow && <p className="text-xs uppercase tracking-widest text-muted-foreground">{eyebrow}</p>}
        <MaskedText
          as="h1"
          playOnMount
          text={title}
          className="mt-4 max-w-5xl font-heading text-5xl font-bold leading-none tracking-tight text-balance md:text-8xl"
        />
        <div className="mt-6 flex flex-wrap items-end justify-between gap-6">
          {intro && <p className="max-w-md text-lg text-muted-foreground">{intro}</p>}
          {action && (
            <a
              href={action.href}
              className="inline-flex h-12 items-center bg-primary px-6 text-sm font-semibold text-primary-foreground transition-transform duration-150 ease-out motion-safe:active:scale-96 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              {action.label}
            </a>
          )}
        </div>
      </div>
      {cards.length > 0 && (
        <>
          <DraggableCards label="Arrange the work" cards={cards} className="mx-auto mt-6 hidden h-svh max-w-screen-2xl md:block" />
          <ul data-allow-clip className="mt-10 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 pb-16 md:hidden">
            {shown.map((item) => (
              <li key={item.id} className="w-3/5 shrink-0 snap-start">
                <Media image={item.image} ratio="4:5" sizes="60vw" />
                <p className="mt-2 text-xs uppercase tracking-widest">{item.label}</p>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
