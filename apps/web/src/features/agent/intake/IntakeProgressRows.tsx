import { useState } from "react";
import { Check, ChevronDown, ChevronRight, HelpCircle, Loader2, Map as MapIcon, ScanSearch } from "lucide-react";
import { AgentBlock } from "../transcript";
import { useAgentStore, type IntakeStep, type IntakeTool } from "../store/agentStore";
import { groupIntakeSteps, type IntakeToolGroup } from "./intake-progress";

const TOOLS: Record<IntakeTool, { name: string; icon: typeof HelpCircle }> = {
  request: { name: "Request review", icon: ScanSearch },
  questions: { name: "Question tool", icon: HelpCircle },
  planner: { name: "Planner", icon: MapIcon },
};

function GroupDetails({ group }: { group: IntakeToolGroup }) {
  if (group.items.length > 0) {
    return (
      <ul className="space-y-1 font-mono text-[11px] text-foreground-secondary">
        {group.items.map((item) => <li key={item} className="truncate">{item}</li>)}
      </ul>
    );
  }
  return (
    <ul className="space-y-1 text-xs text-muted">
      {group.doneDetails.map((detail) => (
        <li key={detail} className="flex items-center gap-1.5"><Check aria-hidden="true" className="size-3 text-success" />{detail}</li>
      ))}
    </ul>
  );
}

function IntakeToolRow({ group, isActive }: { group: IntakeToolGroup; isActive: boolean }) {
  const [openChoice, setOpenChoice] = useState<boolean | null>(null);
  const tool = TOOLS[group.tool];
  const Icon = tool.icon;
  const hasDetails = group.items.length > 0 || group.doneDetails.length > 0;
  const isOpen = hasDetails && (openChoice ?? (isActive && group.items.length > 0));
  return (
    <div className="rounded-xl border border-border-soft bg-surface-2">
      <button
        type="button"
        aria-expanded={isOpen}
        disabled={!hasDetails}
        onClick={() => setOpenChoice(!isOpen)}
        className="flex w-full cursor-pointer items-center gap-2.5 px-3 py-2.5 text-left disabled:cursor-default"
      >
        <Icon aria-hidden="true" className="size-4 shrink-0 text-muted" />
        <span className="shrink-0 text-[12px] text-muted">{tool.name}</span>
        <span className="min-w-0 flex-1 truncate font-mono text-[12px] text-foreground-secondary">{group.detail}{isActive ? "…" : ""}</span>
        {isActive ? <Loader2 aria-label="Working" className="size-3.5 shrink-0 animate-spin text-muted" /> : <Check aria-label="Done" className="size-3.5 shrink-0 text-success" />}
        {hasDetails && (isOpen ? <ChevronDown aria-hidden="true" className="size-3.5 shrink-0 text-muted" /> : <ChevronRight aria-hidden="true" className="size-3.5 shrink-0 text-muted" />)}
      </button>
      {isOpen && <div className="border-t border-border-soft px-3 py-2"><GroupDetails group={group} /></div>}
    </div>
  );
}

export function IntakeProgressRows({ first, narration }: { first: IntakeStep; narration: string }) {
  const steps = useAgentStore((state) => state.intakeSteps);
  const groups = groupIntakeSteps([first, ...steps]);
  return (
    <AgentBlock text={narration}>
      <div role="status" aria-live="polite" className="space-y-1.5">
        {groups.map((group, index) => <IntakeToolRow key={group.id} group={group} isActive={index === groups.length - 1} />)}
      </div>
    </AgentBlock>
  );
}
