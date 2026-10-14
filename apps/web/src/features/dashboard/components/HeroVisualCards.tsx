import { Bot, Check, Sparkles, Terminal, Globe, Zap } from "lucide-react";

export function TerminalSlideVisual() {
  return (
    <div className="w-full max-w-sm rounded-2xl border border-border/80 bg-[#0C0E14]/90 p-3.5 shadow-2xl shadow-black/60 backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-border/40 pb-2">
        <div className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-rose-500/80" />
          <span className="size-2.5 rounded-full bg-amber-500/80" />
          <span className="size-2.5 rounded-full bg-emerald-500/80" />
        </div>
        <span className="font-mono text-[10px] text-muted">terminal ~ appwright</span>
      </div>
      <div className="mt-2.5 space-y-1.5 font-mono text-[11px]">
        <div className="flex items-center gap-1.5 text-foreground-secondary">
          <Terminal className="size-3 text-lime" />
          <span>npx appwright create fullstack-app</span>
        </div>
        <div className="flex items-center gap-1.5 text-emerald-400">
          <Check className="size-3" />
          <span>Initialized Next.js 15 & Tailwind v4</span>
        </div>
        <div className="flex items-center gap-1.5 text-emerald-400">
          <Check className="size-3" />
          <span>PostgreSQL + Prisma sandbox ready</span>
        </div>
        <div className="mt-1 inline-flex items-center gap-1 rounded-md bg-lime/10 px-2 py-0.5 text-[10px] font-semibold text-lime">
          <Zap className="size-3" />
          <span>Local server running on :3000</span>
        </div>
      </div>
    </div>
  );
}

export function AgentSlideVisual() {
  return (
    <div className="w-full max-w-sm rounded-2xl border border-purple-500/30 bg-[#0E0C16]/90 p-3.5 shadow-2xl shadow-purple-950/40 backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-purple-500/20 pb-2">
        <div className="flex items-center gap-1.5">
          <Bot className="size-3.5 text-purple-400" />
          <span className="text-[11px] font-semibold text-purple-300">Claude 3.7 Sonnet</span>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/20 px-2 py-0.5 text-[9px] font-bold text-purple-300">
          <Sparkles className="size-2.5" /> Reasoning
        </span>
      </div>
      <div className="mt-2.5 space-y-2 text-xs">
        <div className="rounded-xl border border-border/40 bg-surface/80 p-2 text-muted">
          &ldquo;Add Stripe billing with coupon support and modern UI&rdquo;
        </div>
        <div className="flex items-start gap-2 rounded-xl border border-purple-500/30 bg-purple-950/30 p-2">
          <div className="mt-0.5 grid size-4 shrink-0 place-items-center rounded-full bg-purple-500 text-[10px] font-black text-black">
            AI
          </div>
          <div className="space-y-1 text-[11px] text-purple-200">
            <p className="font-medium">Created checkout API & subscription card component</p>
            <div className="flex gap-1 font-mono text-[9px] text-emerald-400">
              <span>+182 lines</span>
              <span className="text-muted">•</span>
              <span>3 files modified</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function DeploySlideVisual() {
  return (
    <div className="w-full max-w-sm rounded-2xl border border-sky-500/30 bg-[#0A1017]/90 p-3.5 shadow-2xl shadow-sky-950/40 backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-sky-500/20 pb-2">
        <div className="flex items-center gap-1.5">
          <Globe className="size-3.5 text-sky-400" />
          <span className="text-[11px] font-semibold text-sky-300">Edge Network</span>
        </div>
        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-400">
          <span className="size-1.5 animate-pulse rounded-full bg-emerald-400" /> 100% Healthy
        </span>
      </div>
      <div className="mt-2.5 space-y-2">
        <div className="flex items-center justify-between rounded-xl bg-surface/80 px-3 py-2 text-xs">
          <span className="font-mono text-[11px] text-foreground-secondary">
            https://app.appwright.dev
          </span>
          <span className="rounded bg-sky-500/20 px-1.5 py-0.5 text-[10px] font-bold text-sky-300">
            LIVE
          </span>
        </div>
        <div className="grid grid-cols-3 gap-1.5 text-center font-mono">
          <div className="rounded-lg border border-border/40 bg-surface/50 p-1.5">
            <p className="text-[9px] text-muted">Latency</p>
            <p className="text-[11px] font-bold text-sky-400">14ms</p>
          </div>
          <div className="rounded-lg border border-border/40 bg-surface/50 p-1.5">
            <p className="text-[9px] text-muted">Regions</p>
            <p className="text-[11px] font-bold text-foreground">34 Edge</p>
          </div>
          <div className="rounded-lg border border-border/40 bg-surface/50 p-1.5">
            <p className="text-[9px] text-muted">SSL</p>
            <p className="text-[11px] font-bold text-emerald-400">Active</p>
          </div>
        </div>
      </div>
    </div>
  );
}
