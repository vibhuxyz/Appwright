import type { AgentQuestionResponse, AssetRequestResponse, PendingIntegrationRequirement } from "@repo/contracts";
import type { IntakeGate } from "../../intake";

export type LiveDockGroup =
  | { kind: "intake"; key: string }
  | { kind: "agent"; key: string }
  | { kind: "images"; key: string };

function intakeKey(gate: IntakeGate): string | null {
  const base = `intake:${gate.afterSeq}`;
  if (gate.status === "asking" && gate.questions.length > 0) return `${base}:asking:${gate.questions.map((question) => question.need).join("|")}`;
  if (gate.status === "reviewing-plan" && gate.plan) return `${base}:plan:${gate.plan.blueprintId}`;
  if (gate.status === "choosing-theme") return `${base}:theme`;
  return null;
}

function hasOpenSlot(request: AssetRequestResponse): boolean {
  return request.slots.some((slot) => slot.status !== "RESOLVED" && slot.status !== "SKIPPED");
}

export function pickLiveGroup(input: {
  gate: IntakeGate | null;
  questions: readonly AgentQuestionResponse[];
  requirements: readonly PendingIntegrationRequirement[];
  assetRequests: readonly AssetRequestResponse[];
}): LiveDockGroup | null {
  const intake = input.gate ? intakeKey(input.gate) : null;
  if (intake) return { kind: "intake", key: intake };
  const agentIds = [...input.questions.map((row) => row.id), ...input.requirements.map((row) => row.id)];
  if (agentIds.length > 0) return { kind: "agent", key: `agent:${agentIds.sort().join("|")}` };
  const imageIds = input.assetRequests.filter(hasOpenSlot).map((request) => request.id);
  return imageIds.length > 0 ? { kind: "images", key: `images:${imageIds.sort().join("|")}` } : null;
}
