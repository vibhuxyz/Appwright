import { PLATFORM_FEATURES } from "../data/sectionContent";

export function PlatformSection() {
  return (
    <section id="platform" className="border-b border-border-soft px-6 py-16 sm:py-26">
      <div className="mx-auto max-w-350">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-5">
          <div className="max-w-140">
            <h2 className="m-0 text-sm font-bold tracking-[0.14em] text-lime">PLATFORM</h2>
            <p className="mt-3 text-[26px] leading-tight font-bold tracking-tighter sm:text-[42px]">
              Backend included, not bolted on.
            </p>
          </div>
          <a
            href="#top"
            className="flex-none rounded-[11px] bg-lime px-6 py-3.5 text-[14.5px] font-bold text-background-deep hover:brightness-110"
          >
            Try for free
          </a>
        </div>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-3.5">
          <div className="col-span-2 flex min-h-70 min-w-0 flex-col gap-4.5 rounded-[18px] border border-border bg-linear-to-b from-lime/7 to-white/2 p-6.5">
            <span className="font-geist-mono text-[11.5px] text-lime">AGENT WORKSPACE</span>
            <p className="m-0 max-w-105 text-[22px] leading-[1.12] font-bold tracking-tight sm:text-[30px]">
              Chat on the left, your running app on the right.
            </p>
            <p className="m-0 max-w-110 text-[14.5px] leading-relaxed text-foreground-secondary">
              Code, database, logs, analytics and a live preview in one workspace. Ask for a
              change; watch it rebuild in seconds.
            </p>
            <div className="mt-auto flex flex-wrap gap-2.5">
              {["Hot reload", "Diff review", "Rollback"].map((chip) => (
                <span
                  key={chip}
                  className="rounded-full border border-border bg-surface-2 px-3 py-1.5 text-xs text-foreground-secondary"
                >
                  {chip}
                </span>
              ))}
            </div>
          </div>

          {PLATFORM_FEATURES.map((feature) => (
            <div
              key={feature.tag}
              className="flex min-h-50 min-w-0 flex-col gap-3 rounded-[18px] border border-border bg-surface p-5.5 hover:bg-surface-3"
            >
              <span className="font-geist-mono text-[11.5px] text-muted">{feature.tag}</span>
              <div className="text-[19px] font-bold tracking-tight">{feature.name}</div>
              <div className="text-sm leading-relaxed text-pretty text-foreground-secondary">
                {feature.copy}
              </div>
              <div className="mt-auto font-geist-mono text-[12.5px] text-blue">{feature.meta}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
