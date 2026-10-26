import { useMemo } from "react";
import { useAssetRequests } from "@/features/assets";
import type { IntakeGate } from "../../intake";
import type { Msg } from "../../schemas/agentSchemas";
import { findLateQuestions } from "../../transcript";
import { usePendingDockItems } from "../hooks";
import { autoImageBlueprintIds, splitAutoImageRequests } from "./auto-image-requests";
import { pickLiveGroup } from "./pick-live-group";
import { useAutoFillImages } from "./use-auto-fill-images";

export function useChatDock(input: {
  projectId: string;
  sessionId: string | undefined;
  gate: IntakeGate | null;
  messages: readonly Msg[];
  running: boolean;
}) {
  const { questions, requirements } = usePendingDockItems(input.projectId, input.sessionId);
  const { data: assetRequests = [] } = useAssetRequests(input.sessionId, input.running);
  const autoBlueprintIds = useMemo(() => autoImageBlueprintIds(input.messages), [input.messages]);
  const { auto, manual } = useMemo(
    () => splitAutoImageRequests(assetRequests.filter((request) => request.status === "PENDING"), autoBlueprintIds),
    [assetRequests, autoBlueprintIds],
  );
  useAutoFillImages({ sessionId: input.sessionId, projectId: input.projectId, autoRequests: auto });
  const live = pickLiveGroup({ gate: input.gate, questions, requirements, assetRequests: manual });
  const late = useMemo(() => findLateQuestions(input.messages), [input.messages]);
  return { live, late, pendingAssetRequests: manual };
}
