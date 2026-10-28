import { StatsBand } from "@/components/patterns/editorial/stats-band";
import { ParticleField } from "@/components/patterns/effects/canvas/particle-field";
import { ImageCompare } from "@/components/patterns/effects/image/image-compare";
import { HoverGlow } from "@/components/patterns/effects/pointer/hover-glow";
import { TiltCard } from "@/components/patterns/effects/pointer/tilt-card";
import { DrawPath } from "@/components/patterns/effects/svg/draw-path";
import { HighlightText } from "@/components/patterns/effects/text/highlight-text";
import { ClosingCta } from "@/components/patterns/layout/closing-cta";
import { FaqStack } from "@/components/patterns/layout/faq-stack";
import { Media } from "@/components/patterns/shared/media";

const FEATURES = [
  { title: "Live diff", body: "See every change to a document as it happens." },
  { title: "Branch drafts", body: "Try an edit without touching the published copy." },
  { title: "Review queue", body: "Approve, comment or send back in one place." },
];

const SWOOSH = "M4 40 C 60 4, 120 76, 180 30 S 300 10, 356 36";

export function ProductLab() {
  return (
    <main className="bg-background text-foreground">
      <section data-section="hero.particles" className="relative isolate overflow-hidden">
        <ParticleField density={0.8} />
        <div className="relative mx-auto max-w-screen-xl px-4 py-32 text-center md:px-8 md:py-44">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Draftline</p>
          <h1 className="mx-auto mt-4 max-w-4xl font-heading text-5xl font-bold leading-none tracking-tight text-balance md:text-7xl">
            Writing that <HighlightText>stays in sync</HighlightText>
          </h1>
          <DrawPath d={SWOOSH} viewBox="0 0 360 80" className="mx-auto mt-6 h-12 w-72 text-primary" />
          <a href="/signup" className="mt-8 inline-flex h-12 items-center bg-primary px-6 text-sm font-semibold text-primary-foreground transition-transform duration-150 ease-out motion-safe:active:scale-96 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
            Start free
          </a>
        </div>
      </section>
      <section data-section="features.glow" className="mx-auto grid max-w-screen-xl gap-4 px-4 pb-20 md:grid-cols-3 md:px-8">
        {FEATURES.map((feature) => (
          <TiltCard key={feature.title}>
            <HoverGlow className="h-full border border-border bg-card p-6">
              <h2 className="font-heading text-xl font-bold">{feature.title}</h2>
              <p className="mt-2 text-muted-foreground">{feature.body}</p>
            </HoverGlow>
          </TiltCard>
        ))}
      </section>
      <section data-section="compare.before-after" className="mx-auto max-w-screen-lg px-4 pb-24 md:px-8">
        <h2 className="font-heading text-3xl font-bold tracking-tight md:text-4xl">Before Draftline, and after</h2>
        <ImageCompare
          className="mt-8"
          label="Compare the editor before and after Draftline"
          before={{ alt: "Cluttered document with tracked changes" }}
          after={{ alt: "Clean document with one live diff" }}
          ratio="16:9"
        />
        <Media image={{ alt: "Draftline review queue screenshot" }} ratio="16:9" entrance="fade" className="mt-8" />
      </section>
      <StatsBand
        heading="Teams that switched"
        stats={[
          { value: 1200, label: "Teams" },
          { value: 38, suffix: "%", label: "Fewer review rounds" },
        ]}
        sourceNote="Sample figures for this showcase."
      />
      <FaqStack
        heading="Questions"
        items={[
          { question: "Does it work offline?", answer: "Edits sync when you reconnect." },
          { question: "Can I export?", answer: "Markdown, Word and PDF." },
        ]}
      />
      <ClosingCta heading="Write together" highlight="without the mess" action={{ label: "Start free", href: "/signup" }} hasAmbient />
    </main>
  );
}
