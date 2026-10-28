import { Reveal } from "@/components/patterns/shared/reveal";

const MAX_QUOTES = 3;

export interface Quote {
  quote: string;
  name: string;
  role?: string;
}

export interface QuoteBandProps {
  heading?: string;
  quotes: readonly Quote[];
}

export function QuoteBand({ heading, quotes }: QuoteBandProps) {
  if (quotes.length === 0) return null;
  const [lead, ...rest] = quotes.slice(0, MAX_QUOTES);
  return (
    <section data-section="proof.quote-band" className="bg-background text-foreground">
      <div className="mx-auto max-w-screen-xl px-4 py-24 md:px-8">
        {heading && <h2 className="text-xs uppercase tracking-widest text-muted-foreground">{heading}</h2>}
        {lead && (
          <Reveal>
            <figure className="mt-8">
              <blockquote className="font-heading text-3xl leading-tight text-balance md:text-5xl">“{lead.quote}”</blockquote>
              <figcaption className="mt-6 text-sm">
                <span className="font-semibold">{lead.name}</span>
                {lead.role && <span className="text-muted-foreground"> · {lead.role}</span>}
              </figcaption>
            </figure>
          </Reveal>
        )}
        {rest.length > 0 && (
          <div className="mt-16 grid gap-10 md:grid-cols-2">
            {rest.map((entry) => (
              <figure key={entry.name} className="border-t border-border pt-6">
                <blockquote className="text-lg leading-relaxed">“{entry.quote}”</blockquote>
                <figcaption className="mt-4 text-sm">
                  <span className="font-semibold">{entry.name}</span>
                  {entry.role && <span className="text-muted-foreground"> · {entry.role}</span>}
                </figcaption>
              </figure>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
