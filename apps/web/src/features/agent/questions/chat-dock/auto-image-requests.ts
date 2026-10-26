import { IMAGE_CHOICE_AUTO, type AssetRequestResponse } from "@repo/contracts";
import type { Msg } from "../../schemas/agentSchemas";

export function autoImageBlueprintIds(messages: readonly Pick<Msg, "data">[]): ReadonlySet<string> {
  const ids = messages.flatMap((message) =>
    message.data?.imageChoice === IMAGE_CHOICE_AUTO && message.data.blueprintId ? [message.data.blueprintId] : [],
  );
  return new Set(ids);
}

function hasFailedSlot(request: AssetRequestResponse): boolean {
  return request.slots.some((slot) => slot.status === "FAILED");
}

function isAutoFillable(request: AssetRequestResponse, autoBlueprintIds: ReadonlySet<string>): boolean {
  return autoBlueprintIds.has(request.blueprintId) && !hasFailedSlot(request);
}

export function splitAutoImageRequests(
  requests: readonly AssetRequestResponse[],
  autoBlueprintIds: ReadonlySet<string>,
): { auto: AssetRequestResponse[]; manual: AssetRequestResponse[] } {
  const auto = requests.filter((request) => isAutoFillable(request, autoBlueprintIds));
  const manual = requests.filter((request) => !isAutoFillable(request, autoBlueprintIds));
  return { auto, manual };
}
