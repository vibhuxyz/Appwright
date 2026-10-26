import { Sparkles } from "lucide-react";

export function EnhancingDisplay({ text }: { text: string }) {
  return (
    <div className="relative max-h-56 min-h-18 w-full overflow-y-auto rounded-xl border border-lime/30 bg-lime/5 p-2.5 select-none">
      <div className="pointer-events-none absolute -inset-1 rounded-xl bg-linear-to-r from-lime/15 via-purple-500/10 to-cyan-500/15 blur-sm" />
      <div className="relative z-10 animate-text-shimmer bg-[linear-gradient(90deg,#e3fc18,#f59e0b,#ec4899,#06b6d4,#e3fc18)] bg-size-[250%_auto] bg-clip-text text-[13px] leading-relaxed font-medium text-transparent select-text">
        {text}
      </div>
      <div className="relative z-10 mt-2 flex items-center gap-2 text-[11px] font-medium text-lime">
        <Sparkles className="size-3.5 animate-spin" />
        <span className="animate-pulse">Improving your prompt…</span>
      </div>
    </div>
  );
}
