import { Check, Loader2, Square } from "lucide-react";
import { AGENT_WAIT_STATUS } from "@repo/contracts";
import { useAgentStore } from "../store/agentStore";
import { AgentBlock } from "./AgentBlock";
import { DelegationChip } from "./chips/DelegationChip";
import { delegationAgent } from "./chips/present";

const IMAGE_WAIT_STATUS = "Waiting for section images…";
const VISIBLE_DONE_STEPS = 6;

const WAIT_HINTS: ReadonlyMap<string, string> = new Map([
  [IMAGE_WAIT_STATUS, "Pick an image for each section below to continue."],
  [AGENT_WAIT_STATUS.answers, "Answer the questions below to continue."],
  [AGENT_WAIT_STATUS.keys, "Choose how to connect each service below."],
]);

function DoneSteps({ steps }: { steps: readonly string[] }) {
  const hiddenCount = Math.max(0, steps.length - VISIBLE_DONE_STEPS);
  return (
    <ul className="space-y-1 text-xs text-muted">
      {hiddenCount > 0 && <li>(+{hiddenCount} earlier steps)</li>}
      {steps.slice(hiddenCount).map((step, index) => (
        <li key={`${hiddenCount + index}-${step}`} className="flex items-center gap-1.5">
          <Check aria-hidden="true" className="size-3 shrink-0 text-success" />
          <span className="truncate">{step}</span>
        </li>
      ))}
    </ul>
  );
}

export function RunningStatusRow({ statusDetail, onStop, onViewAgent }: { statusDetail: string; onStop: () => void; onViewAgent?: (agent: string) => void }) {
  const runSteps = useAgentStore((state) => state.runSteps);
  const current = statusDetail || "Working on your app…";
  const doneSteps = runSteps.at(-1) === current ? runSteps.slice(0, -1) : runSteps;
  const hint = WAIT_HINTS.get(statusDetail);
  const agent = delegationAgent(current);
  return (
    <AgentBlock text={null}>
      <div role="status" aria-live="polite" className="space-y-2">
        <DoneSteps steps={doneSteps} />
        {agent && onViewAgent ? <DelegationChip agent={agent} onView={onViewAgent} /> : null}
        <div className="flex items-center gap-2.5 rounded-xl border border-border-soft bg-surface-2 px-3 py-2.5">
          <Loader2 aria-hidden="true" className="size-3.5 shrink-0 animate-spin text-lime" />
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-[12px] text-foreground">{current}</span>
            {hint && <span className="truncate text-[11px] text-muted">{hint}</span>}
          </div>
          <button
            type="button"
            onClick={onStop}
            title="Stop AI execution"
            className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-[11px] text-foreground-secondary transition-colors hover:border-danger/50 hover:text-danger"
          >
            <Square aria-hidden="true" className="size-3 fill-current" /> Stop
          </button>
        </div>
      </div>
    </AgentBlock>
  );
}
