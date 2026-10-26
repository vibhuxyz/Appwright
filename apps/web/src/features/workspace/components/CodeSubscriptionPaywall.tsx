import { Code2, Download, GitBranch, Lock, Sparkles } from "lucide-react";

export function CodeSubscriptionPaywall({ onUpgrade }: { onUpgrade: () => void }) {
  return (
    <div className="flex min-h-0 flex-1 items-center justify-center p-6">
      <div className="flex max-w-md flex-col items-center rounded-2xl border border-border-soft bg-surface-2 p-8 text-center shadow-xl">
        <div className="relative mb-4 grid size-14 place-items-center rounded-2xl border border-[#E3FC18]/30 bg-[#E3FC18]/10 text-[#E3FC18]">
          <Lock className="size-7" />
        </div>

        <span className="mb-2 rounded-full border border-[#E3FC18]/30 bg-[#E3FC18]/10 px-2.5 py-0.5 text-[11px] font-semibold text-[#E3FC18]">
          PAID FEATURE
        </span>

        <h3 className="text-lg font-bold text-foreground">
          Unlock Full Codebase & Downloads
        </h3>

        <p className="mt-2 text-xs leading-relaxed text-muted">
          Free users can build and preview apps live in the browser. Upgrade to a
          paid subscription to inspect source code, edit files, and download the
          complete project codebase.
        </p>

        <div className="my-6 flex w-full flex-col gap-2.5 rounded-xl border border-border-soft/60 bg-surface/60 p-4 text-left text-xs text-foreground-secondary">
          <div className="flex items-center gap-2.5">
            <Code2 className="size-4 shrink-0 text-[#E3FC18]" />
            <span>Full project file tree & Monaco editor</span>
          </div>
          <div className="flex items-center gap-2.5">
            <Download className="size-4 shrink-0 text-[#E3FC18]" />
            <span>Download complete codebase as a .zip archive</span>
          </div>
          <div className="flex items-center gap-2.5">
            <GitBranch className="size-4 shrink-0 text-[#E3FC18]" />
            <span>Inspect git branches, isolated worktrees & diffs</span>
          </div>
        </div>

        <button
          type="button"
          onClick={onUpgrade}
          className="flex cursor-pointer items-center gap-2 rounded-xl bg-[#E3FC18] px-6 py-2.5 text-xs font-bold text-black shadow-md transition-all hover:brightness-105 active:scale-95"
        >
          <Sparkles className="size-4 fill-current" />
          <span>Upgrade to Pro — See & Download Code</span>
        </button>
      </div>
    </div>
  );
}
