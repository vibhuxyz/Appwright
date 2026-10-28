import { Parallax } from "@/components/patterns/effects/scroll/parallax";
import { MaskedText } from "@/components/patterns/shared/masked-text";
import { Media, type MediaImage } from "@/components/patterns/shared/media";
import { Reveal } from "@/components/patterns/shared/reveal";

const MAX_FACTS = 4;
const MAX_CHAPTERS = 3;
const MAX_DETAIL_IMAGES = 2;

export interface CaseStudyFact {
  label: string;
  value: string;
}

export interface CaseStudyChapter {
  title: string;
  body: string;
}

export interface CaseStudyProps {
  eyebrow?: string;
  title: string;
  cover: MediaImage;
  facts: readonly CaseStudyFact[];
  chapters: readonly CaseStudyChapter[];
  details?: readonly MediaImage[];
  next?: { label: string; href: string };
}

export function CaseStudy({ eyebrow, title, cover, facts, chapters, details = [], next }: CaseStudyProps) {
  return (
    <section data-section="story.case-study" className="bg-background text-foreground">
      <div className="mx-auto max-w-screen-2xl px-4 pt-20 md:px-8">
        {eyebrow && <p className="text-xs uppercase tracking-widest text-muted-foreground">{eyebrow}</p>}
        <MaskedText as="h2" text={title} className="mt-3 max-w-5xl font-heading text-5xl font-bold leading-none tracking-tight text-balance md:text-7xl" />
      </div>
      <Parallax className="mt-12 h-svh max-h-screen">
        <Media image={cover} fill sizes="100vw" />
      </Parallax>
      <div className="mx-auto grid max-w-screen-2xl gap-12 px-4 py-20 md:grid-cols-12 md:px-8">
        <dl className="grid grid-cols-2 gap-6 self-start md:col-span-4 md:grid-cols-1">
          {facts.slice(0, MAX_FACTS).map((fact) => (
            <div key={fact.label} className="border-t border-border pt-3">
              <dt className="text-xs uppercase tracking-widest text-muted-foreground">{fact.label}</dt>
              <dd className="mt-1 text-lg">{fact.value}</dd>
            </div>
          ))}
        </dl>
        <div className="space-y-12 md:col-span-7 md:col-start-6">
          {chapters.slice(0, MAX_CHAPTERS).map((chapter) => (
            <Reveal key={chapter.title}>
              <h3 className="font-heading text-2xl font-bold">{chapter.title}</h3>
              <p className="mt-3 text-lg leading-relaxed text-muted-foreground">{chapter.body}</p>
            </Reveal>
          ))}
        </div>
      </div>
      {details.length > 0 && (
        <div className="mx-auto grid max-w-screen-2xl gap-6 px-4 pb-20 md:grid-cols-2 md:px-8">
          {details.slice(0, MAX_DETAIL_IMAGES).map((image, index) => (
            <Media key={image.src ?? image.alt} image={image} ratio={index === 0 ? "4:5" : "4:3"} entrance="wipe" sizes="(min-width: 768px) 50vw, 100vw" className={index === 1 ? "md:mt-32" : undefined} />
          ))}
        </div>
      )}
      {next && (
        <a href={next.href} className="group block border-t border-border focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring">
          <span className="mx-auto flex max-w-screen-2xl items-baseline justify-between gap-6 px-4 py-12 md:px-8">
            <span className="text-xs uppercase tracking-widest text-muted-foreground">Next</span>
            <span className="font-heading text-3xl font-bold transition-transform duration-300 ease-out group-hover:-translate-x-2 md:text-5xl">{next.label}</span>
          </span>
        </a>
      )}
    </section>
  );
}
