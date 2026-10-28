import ScrollReveal from "@/components/patterns/effects/text/scroll-reveal";

export interface ManifestoProps {
  eyebrow?: string;
  statement: string;
}

export function Manifesto({ eyebrow, statement }: ManifestoProps) {
  return (
    <section
      data-section="statement.manifesto"
      className="bg-background text-foreground"
    >
      <div className="mx-auto max-w-5xl px-4 py-24 md:px-8 md:py-40">
        {eyebrow && (
          <p className="mb-8 text-xs uppercase tracking-widest text-muted-foreground">
            {eyebrow}
          </p>
        )}
        <ScrollReveal
          baseOpacity={0.15}
          enableBlur
          blurStrength={4}
          containerClassName="m-0"
          textClassName="font-heading text-3xl leading-snug md:text-5xl"
        >
          {statement}
        </ScrollReveal>
      </div>
    </section>
  );
}
