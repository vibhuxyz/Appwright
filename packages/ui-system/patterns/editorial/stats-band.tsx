import CountUp from "@/components/patterns/effects/text/count-up";
import { Reveal } from "@/components/patterns/shared/reveal";

const MAX_STATS = 4;

export interface Stat {
  value: number;
  suffix?: string;
  label: string;
}

export interface StatsBandProps {
  heading?: string;
  stats: readonly Stat[];
  sourceNote?: string;
}

export function StatsBand({ heading, stats, sourceNote }: StatsBandProps) {
  if (stats.length === 0) return null;
  return (
    <section data-section="stats.band" className="bg-muted text-foreground">
      <div className="mx-auto max-w-screen-2xl px-4 py-20 md:px-8">
        {heading && <h2 className="max-w-xl font-heading text-3xl font-bold tracking-tight md:text-4xl">{heading}</h2>}
        <dl className="mt-10 grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-4">
          {stats.slice(0, MAX_STATS).map((stat) => (
            <Reveal key={stat.label} className="border-t border-border pt-4">
              <dt className="text-xs uppercase tracking-widest text-muted-foreground">{stat.label}</dt>
              <dd className="mt-2 font-heading text-5xl font-bold tabular-nums tracking-tight md:text-6xl">
                <CountUp to={stat.value} separator="," />
                {stat.suffix}
              </dd>
            </Reveal>
          ))}
        </dl>
        {sourceNote && <p className="mt-8 text-sm text-muted-foreground">{sourceNote}</p>}
      </div>
    </section>
  );
}
