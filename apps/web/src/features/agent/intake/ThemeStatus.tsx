import { Loader2, Palette } from "lucide-react";
import { useThemeOptions } from "@/features/theme";
import { AgentBlock } from "../transcript";
import { themeRequestFor } from "./theme-request";
import type { IntakeGate } from "./use-intake";
import { WaitingCard } from "./WaitingCard";

export function ThemeStatus({ gate }: { gate: IntakeGate }) {
  const { data, isPending, error } = useThemeOptions(themeRequestFor(gate));
  const themes = data?.themes ?? [];

  if (isPending) {
    return (
      <AgentBlock text="I'm designing four design systems for your site from your request, plan and answers.">
        <div role="status" aria-live="polite" className="flex items-center gap-2.5 rounded-xl border border-border-soft bg-surface-2 px-3 py-2.5">
          <Palette aria-hidden="true" className="size-4 shrink-0 text-muted" />
          <span className="shrink-0 text-[12px] text-muted">Design</span>
          <span className="min-w-0 flex-1 truncate font-mono text-[12px] text-foreground-secondary">Designing four design systems…</span>
          <Loader2 aria-label="Working" className="size-3.5 shrink-0 animate-spin text-muted" />
        </div>
      </AgentBlock>
    );
  }
  if (error || themes.length === 0) return null;
  return (
    <WaitingCard icon={Palette} narration="Your design systems are ready. Pick the one that feels right." title={`${themes.length} design systems ready — choose one`}>
      <ul aria-label="Design systems" className="mt-2 flex flex-wrap gap-1.5">
        {themes.map((theme) => (
          <li key={theme.id} className="flex items-center gap-1.5 rounded-md border border-border-soft bg-surface px-2 py-1 text-[11px] text-foreground-secondary">
            <span aria-hidden="true" className="size-2.5 rounded-full border border-border" style={{ backgroundColor: theme.palette.primary }} />
            {theme.name}
          </li>
        ))}
      </ul>
    </WaitingCard>
  );
}
