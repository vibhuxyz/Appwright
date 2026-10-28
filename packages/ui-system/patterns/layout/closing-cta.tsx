import { AmbientGradient } from "@/components/patterns/effects/ambient/ambient-gradient";
import { HighlightText } from "@/components/patterns/effects/text/highlight-text";
import { Reveal } from "@/components/patterns/shared/reveal";

const ACTION_CLASS =
  "inline-flex h-12 items-center px-6 text-sm font-semibold transition-transform duration-150 ease-out motion-safe:active:scale-96 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

export interface ClosingCtaProps {
  heading: string;
  highlight?: string;
  body?: string;
  action: { label: string; href: string };
  secondary?: { label: string; href: string };
  hasAmbient?: boolean;
}

export function ClosingCta({ heading, highlight, body, action, secondary, hasAmbient = false }: ClosingCtaProps) {
  return (
    <section data-section="cta.band" className="relative isolate overflow-hidden bg-foreground text-background">
      {hasAmbient && <AmbientGradient />}
      <Reveal className="mx-auto max-w-screen-xl px-4 py-24 text-center md:px-8 md:py-32">
        <h2 className="mx-auto max-w-4xl font-heading text-4xl font-bold leading-none tracking-tight text-balance md:text-7xl">
          {heading}
          {highlight && (
            <>
              {" "}
              <HighlightText variant="underline">{highlight}</HighlightText>
            </>
          )}
        </h2>
        {body && <p className="mx-auto mt-6 max-w-xl text-lg opacity-80">{body}</p>}
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <a href={action.href} className={`${ACTION_CLASS} bg-primary text-primary-foreground`}>
            {action.label}
          </a>
          {secondary && (
            <a href={secondary.href} className={`${ACTION_CLASS} border border-current`}>
              {secondary.label}
            </a>
          )}
        </div>
      </Reveal>
    </section>
  );
}
