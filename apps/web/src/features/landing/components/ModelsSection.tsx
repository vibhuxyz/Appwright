import { Badge } from "@/shared/components/ui/Badge";
import { MODELS } from "../data/sectionContent";

export function ModelsSection() {
  return (
    <section id="how" className="border-b border-border-soft px-6 py-14 sm:py-20">
      <div className="mx-auto grid max-w-350 grid-cols-[repeat(auto-fit,minmax(300px,1fr))] items-stretch gap-4">
        <div className="flex min-h-90 min-w-0 flex-wrap overflow-hidden rounded-[18px] border border-border bg-surface">
          <div className="flex flex-1 basis-75 flex-col justify-center gap-4 p-6 sm:p-8">
            <div className="text-[26px] leading-[1.02] font-extrabold tracking-tight uppercase sm:text-4xl">
              Every frontier model,
              <br />
              <span className="text-lime">one build credit</span>
            </div>
            <div className="flex flex-col gap-2.5 text-[14.5px] text-foreground-secondary">
              <span>✓ Route each step to the best model automatically</span>
              <span>✓ Bring your own keys, or use platform credits</span>
              <span>✓ Parallel agents on Pro and above</span>
            </div>
            <a
              href="#pricing"
              className="self-start rounded-[11px] bg-lime px-6 py-3.5 text-[14.5px] font-bold text-background-deep shadow-[0_14px_40px_-18px_rgba(227,252,24,0.6)] hover:brightness-110"
            >
              Start with free credits
            </a>
          </div>
          <div className="relative min-h-50 min-w-45 flex-1 basis-45 border-l border-border-soft bg-linear-to-br from-surface-2 to-surface">
            <div className="flex size-full items-center justify-center p-6 text-center font-geist-mono text-xs text-muted">
              App built on Appwright
            </div>
          </div>
        </div>

        <div className="grid min-w-0 grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3">
          {MODELS.map((model) => (
            <div
              key={model.name}
              className="flex min-h-[158px] min-w-0 flex-col gap-3 rounded-2xl border border-border bg-surface p-4 hover:bg-surface-3"
            >
              <div className="flex items-start justify-between gap-2.5">
                <span className={`font-geist-mono text-[15px] ${model.tint}`}>{model.glyph}</span>
                <span className="rounded-lg border border-border bg-surface-2 px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap text-foreground-secondary">
                  {model.task}
                </span>
              </div>
              <div className="mt-auto flex flex-wrap items-center gap-2">
                <span className="text-[15.5px] font-bold tracking-tight text-foreground">
                  {model.name}
                </span>
                <Badge tone={model.pillTone} className="rounded-md px-1.5 py-0 text-[10.5px] font-extrabold tracking-wide">
                  {model.pill}
                </Badge>
              </div>
              <div className="text-[13.5px] leading-snug text-pretty text-foreground-secondary">
                {model.copy}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
