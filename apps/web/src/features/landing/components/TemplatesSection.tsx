import { ArrowRight } from "lucide-react";
import { TEMPLATES } from "../data/sectionContent";

export function TemplatesSection() {
  return (
    <section id="templates" className="border-b border-border-soft px-6 py-16 sm:py-26">
      <div className="mx-auto max-w-350">
        <div className="mb-9 flex flex-wrap items-end justify-between gap-5">
          <div className="max-w-140">
            <h2 className="m-0 text-sm font-bold tracking-[0.14em] text-lime">TEMPLATES</h2>
            <p className="mt-3 text-[26px] leading-tight font-bold tracking-tighter sm:text-[42px]">
              Start from a production-ready app.
            </p>
          </div>
          <a
            href="#top"
            className="flex-none rounded-[10px] border border-border px-4 py-2.75 text-sm font-semibold text-foreground"
          >
            View all templates →
          </a>
        </div>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-3.5">
          {TEMPLATES.map((template) => (
            <div
              key={template.name}
              className="flex min-w-0 flex-col gap-3.5 rounded-2xl border border-border bg-surface p-3.5 hover:border-lime"
            >
              <div
                className="flex h-33 flex-col justify-between rounded-[11px] border border-border-soft p-3"
                style={{
                  background: `linear-gradient(160deg, ${template.wash}, rgba(255,255,255,.02))`,
                }}
              >
                <div className="flex items-center justify-between font-geist-mono text-xs text-foreground-secondary">
                  <span>{template.chrome}</span>
                  <span style={{ color: template.accent }}>{template.stat}</span>
                </div>
                <div className="flex h-13.5 items-end gap-1.5">
                  <span className="h-[38%] flex-1 rounded-sm bg-surface-3" />
                  <span className="h-[66%] flex-1 rounded-sm bg-surface-3" />
                  <span
                    className="h-full flex-1 rounded-sm opacity-75"
                    style={{ background: template.accent }}
                  />
                  <span className="h-[52%] flex-1 rounded-sm bg-surface-3" />
                </div>
              </div>
              <div className="text-[17px] font-bold tracking-tight">{template.name}</div>
              <div className="text-[13.5px] leading-snug text-pretty text-foreground-secondary">
                {template.copy}
              </div>
              <div className="mt-auto flex items-center justify-between gap-2.5">
                <span className="font-geist-mono text-[11.5px] text-muted">{template.stack}</span>
                <span className="grid size-7.5 flex-none place-items-center rounded-full bg-lime text-background-deep">
                  <ArrowRight className="size-3.5" strokeWidth={3} />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
