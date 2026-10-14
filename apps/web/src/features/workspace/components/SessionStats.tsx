import type { Session } from "@/features/agent/schemas/agentSchemas";

export function SessionStats({ session }: { session: Session | undefined }) {
  if (!session) return null;

  return (
    <div
      className="hidden shrink-0 items-center gap-1.5 rounded-full border border-border-soft bg-surface px-3 py-1 font-mono text-xs text-muted transition-colors hover:border-border md:flex"
      title={`Session spend: $${session.cost.toFixed(4)} · ${session.tokenIn.toLocaleString()} in · ${session.tokenOut.toLocaleString()} out`}
    >
      <span className="font-semibold text-foreground">
        ${session.cost.toFixed(4)}
      </span>
      <span className="text-muted/60">·</span>
      <span className="text-foreground-secondary">
        {session.tokenIn}
        <span className="ml-0.5 font-bold text-emerald-400">↑</span>
      </span>
      <span className="text-foreground-secondary">
        {session.tokenOut}
        <span className="ml-0.5 font-bold text-blue-bright">↓</span>
      </span>
      <span className="hidden font-sans text-[11px] text-muted lg:inline">
        this session
      </span>
    </div>
  );
}
