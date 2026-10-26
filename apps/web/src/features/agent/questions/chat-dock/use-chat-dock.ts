import { useMemo } from "react";
import { useAssetRequests } from "@/features/assets";
import type { IntakeGate } from "../../intake";
import type { Msg } from "../../schemas/agentSchemas";
import { findLateQuestions } from "../../transcript";
import { usePendingDockItems } from "../hooks";
import { pickLiveGroup } from "./pick-live-group";

export function useChatDock(input: {
  projectId: string;
  sessionId: string | undefined;
  gate: IntakeGate | null;
  messages: readonly Msg[];
  running: boolean;
}) {
  const { questions, requirements } = usePendingDockItems(input.projectId, input.sessionId);
  const { data: assetRequests = [] } = useAssetRequests(input.sessionId, input.running);
  const pendingAssetRequests = useMemo(() => assetRequests.filter((request) => request.status === "PENDING"), [assetRequests]);
  const live = pickLiveGroup({ gate: input.gate, questions, requirements, assetRequests: pendingAssetRequests });
  const late = useMemo(() => findLateQuestions(input.messages), [input.messages]);
  return { live, late, pendingAssetRequests };
}
