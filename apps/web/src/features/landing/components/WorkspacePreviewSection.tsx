import { DEPLOY_CHECKS, WORKSPACE_STATS } from "../data/sectionContent";

export function WorkspacePreviewSection() {
  return (
    <section
      id="workspace"
      className="border-b border-border-soft bg-background-deep/40 px-6 py-16 sm:py-26"
    >
      <div className="mx-auto grid max-w-350 grid-cols-[repeat(auto-fit,minmax(300px,1fr))] items-center gap-7">
        <div className="min-w-0">
          <h2 className="m-0 text-sm font-bold tracking-[0.14em] text-lime">LIVE PREVIEW</h2>
          <p className="mt-3 text-[26px] leading-tight font-bold tracking-tighter text-balance sm:text-[42px]">
            Every build ships with a URL, not a zip file.
          </p>
          <p className="mt-4 max-w-120 text-base leading-relaxed text-pretty text-foreground-secondary">
            Appwright provisions the environment, runs the test suite, fixes what breaks and hands
            you a deployed application with monitoring attached.
          </p>
          <div className="mt-6.5 grid max-w-130 grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3">
            {WORKSPACE_STATS.map((stat) => (
              <div key={stat.label} className="rounded-[13px] border border-border bg-surface p-3.5">
                <div
                  className={`text-2xl font-extrabold tracking-tight ${stat.accent ? "text-lime" : ""}`}
                >
                  {stat.value}
                </div>
                <div className="mt-1 text-[12.5px] text-muted">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="min-w-0 overflow-hidden rounded-[18px] border border-border bg-surface shadow-[0_40px_90px_-50px_#000]">
          <div className="flex items-center gap-2.5 border-b border-border-soft bg-[#17191b] px-3.5 py-3">
            <span className="size-2.5 rounded-full bg-pink" />
            <span className="size-2.5 rounded-full bg-lime" />
            <span className="size-2.5 rounded-full bg-blue" />
            <span className="ml-2 font-geist-mono text-xs text-muted">shop.appwright.app</span>
            <span className="ml-auto rounded-full bg-lime/14 px-2.25 py-1 text-[11px] font-bold text-lime">
              LIVE
            </span>
          </div>
          <div className="flex flex-col gap-3 p-4.5">
            <div className="flex flex-wrap gap-3">
              <div className="min-w-35 flex-1 rounded-xl border border-border bg-surface-2 p-3.5">
                <div className="text-xs text-muted">Orders today</div>
                <div className="mt-1.5 text-[22px] font-extrabold">348</div>
              </div>
              <div className="min-w-35 flex-1 rounded-xl border border-border bg-surface-2 p-3.5">
                <div className="text-xs text-muted">Revenue</div>
                <div className="mt-1.5 text-[22px] font-extrabold text-lime">$12,548</div>
              </div>
            </div>

            <div className="flex flex-col gap-2.5 rounded-xl border border-border bg-surface-2 p-3.5">
              <div className="flex items-center justify-between text-[13px] text-foreground-secondary">
                <span>Checkout · Stripe</span>
                <span className="font-geist-mono text-muted">passing</span>
              </div>
              <div className="flex flex-col gap-2">
                {DEPLOY_CHECKS.map((check) => (
                  <div
                    key={check.label}
                    className="flex items-center gap-2.5 text-[13px] text-foreground-secondary"
                  >
                    <span className="grid size-4 flex-none place-items-center rounded-full bg-lime/16 text-[10px] font-black text-lime">
                      ✓
                    </span>
                    <span className="min-w-0 flex-1">{check.label}</span>
                    <span className="font-geist-mono text-[11.5px] text-muted">{check.time}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative overflow-hidden rounded-xl border border-border-soft bg-background px-3.5 py-3 font-geist-mono text-xs text-muted">
              <span className="text-lime">▸</span> appwright deploy --prod · build 1a1b2c3d · 12
              routes static
              <span className="absolute inset-y-0 w-20 animate-sweep bg-linear-to-r from-transparent via-lime/8 to-transparent" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
