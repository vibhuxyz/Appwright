import type { VerificationResult } from "@repo/contracts";
import type { Msg } from "../../schemas/agentSchemas";
import { ToolCallGroup } from "../../components/ToolCallGroup";
import { VerificationStatusBar } from "../../components/VerificationStatusBar";
import { AgentBlock } from "../AgentBlock";
import { activityChips } from "./activity";
import { ActivityChip } from "./ActivityChip";
import { DelegationChip } from "./DelegationChip";
import { presentAgentText } from "./present";
import { SummaryCard } from "./SummaryCard";

type Responses = ReadonlyMap<string | undefined, Msg>;

export function AgentTurn({
  text,
  calls,
  responses,
  showMeta,
  projectId,
  verification = null,
  onViewAgent,
}: {
  text: Msg | null;
  calls: readonly Msg[];
  responses: Responses;
  showMeta: boolean;
  projectId?: string;
  verification?: VerificationResult[] | null;
  onViewAgent: (agent: string) => void;
}) {
  const presented = presentAgentText(text);
  const chips = activityChips(calls, responses);
  const agent = presented.delegation;
  return (
    <AgentBlock text={presented.text} meta={showMeta && text && presented.text ? { createdAt: text.createdAt } : null}>
      {agent ? <DelegationChip agent={agent} onView={onViewAgent}>{calls.length > 0 ? <ToolCallGroup calls={calls} responsesByCallId={responses} /> : undefined}</DelegationChip> : null}
      {presented.statusLabel ? <ActivityChip kind="status" label={presented.statusLabel} /> : null}
      {presented.handoff?.createdPath ? <ActivityChip kind="file" label="Created" path={presented.handoff.createdPath} /> : null}
      {chips.map((chip) => (
        <ActivityChip key={chip.id} kind={chip.kind} label={chip.label} {...(chip.path ? { path: chip.path } : {})}>
          <ToolCallGroup calls={chip.calls} responsesByCallId={responses} />
        </ActivityChip>
      ))}
      {presented.handoff ? (
        <SummaryCard title={presented.handoff.title} bullets={presented.handoff.bullets} {...(presented.handoff.note ? { note: presented.handoff.note } : {})} {...(projectId ? { projectId } : {})} />
      ) : null}
      {verification ? <VerificationStatusBar results={verification} /> : null}
    </AgentBlock>
  );
}
