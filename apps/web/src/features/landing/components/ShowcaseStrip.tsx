import { Play } from "lucide-react";
import { SHOWCASE_ITEMS } from "../data/content";

export function ShowcaseStrip() {
  return (
    <section id="top" className="relative border-b border-border-soft px-6">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div
          className="absolute inset-x-[-20%] bottom-[-10%] h-[78%] origin-bottom transform-[perspective(640px)_rotateX(62deg)]"
          style={{
            backgroundImage:
              "linear-gradient(#ffffff14 1px,transparent 1px),linear-gradient(90deg,#ffffff14 1px,transparent 1px)",
            backgroundSize: "78px 78px",
          }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(90%_70%_at_50%_25%,rgba(15,17,19,0)_0%,#0f1113_78%)]" />
        <div className="absolute -top-45 left-1/2 h-105 w-190 -translate-x-1/2 bg-[radial-gradient(closest-side,rgba(227,252,24,.14),transparent)]" />
      </div>

      <div className="relative mx-auto max-w-380 pb-9 sm:pb-16">
        <div className="flex [scroll-snap-type:x_mandatory] scrollbar-thin gap-3.5 overflow-x-auto pb-1.5">
          {SHOWCASE_ITEMS.map((item) => (
            <a
              key={item.id}
              href="#templates"
              className="flex min-w-0 flex-[0_0_clamp(280px,32vw,460px)] snap-start flex-col gap-3"
            >
              <div className="relative aspect-16/10 overflow-hidden rounded-md border border-border bg-surface">
                <div className="flex size-full items-center justify-center bg-linear-to-br from-surface-2 to-surface p-4 text-center font-geist-mono text-xs text-muted">
                  {item.placeholder}
                </div>
                <div
                  className={`absolute top-3 left-3 rounded-full bg-background-deep/72 px-2.5 py-1 font-geist-mono text-[10.5px] font-bold tracking-wider ${item.tint}`}
                >
                  {item.kind}
                </div>
                <span className="absolute right-3 bottom-3 grid size-9.5 place-items-center rounded-full border border-[#3a3d3f] bg-background-deep/66 text-lime">
                  <Play className="size-3.5 fill-current" />
                </span>
              </div>
              <div>
                <div className="text-sm font-extrabold tracking-wide text-foreground uppercase">
                  {item.name}
                </div>
                <div className="mt-1.5 text-[14.5px] leading-snug text-foreground-secondary">
                  {item.copy}
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
