import { Sparkles } from "lucide-react";

export function PreviewLoadingState({
  title = "Waking up your project…",
  subtitle = "Restoring workspace from git and starting dev server (30–90s on cold start)",
}: {
  title?: string;
  subtitle?: string;
}) {
  return (
    <div className="relative flex size-full flex-col items-center justify-center overflow-hidden bg-background px-4 py-8 text-center">
      <div className="pointer-events-none absolute -top-24 size-72 rounded-full bg-lime/5 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 size-72 rounded-full bg-cyan-500/5 blur-3xl" />

      <div className="relative z-10 flex max-w-sm flex-col items-center gap-4 rounded-2xl border border-border bg-surface-2/80 p-6 shadow-2xl backdrop-blur-md">
        <div className="relative flex size-14 items-center justify-center rounded-2xl border border-lime/30 bg-lime/10 shadow-lg shadow-lime/5">
          <Sparkles className="size-6 animate-pulse text-lime" />
          <div className="absolute inset-0 animate-ping rounded-2xl border border-lime/40 opacity-25" />
        </div>

        <div className="space-y-1">
          <h3 className="text-sm font-semibold tracking-tight text-foreground">
            {title}
          </h3>
          <p className="text-xs leading-relaxed text-muted">
            {subtitle}
          </p>
        </div>

        <div className="h-1.5 w-44 overflow-hidden rounded-full bg-surface-3">
          <div className="size-full origin-left -translate-x-full animate-pulse rounded-full bg-lime" />
        </div>

        <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
          <span className="inline-flex items-center gap-1 rounded-full border border-border-soft bg-surface px-2.5 py-0.5 text-[10px] text-muted">
            <span className="size-1.5 animate-pulse rounded-full bg-lime" />
            Live Sandbox
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-border-soft bg-surface px-2.5 py-0.5 text-[10px] text-muted">
            Lazy Boot
          </span>
        </div>
      </div>
    </div>
  );
}
