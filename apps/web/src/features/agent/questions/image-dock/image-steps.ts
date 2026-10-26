import type { AssetRequestResponse, AssetSlot } from "@repo/contracts";

export interface ImageStep {
  id: string;
  assetRequestId: string;
  slot: AssetSlot;
}

export function isSlotDone(slot: AssetSlot): boolean {
  return slot.status === "RESOLVED" || slot.status === "SKIPPED";
}

export function buildImageSteps(requests: readonly AssetRequestResponse[]): ImageStep[] {
  return requests.flatMap((request) => request.slots.map((slot) => ({ id: slot.id, assetRequestId: request.id, slot })));
}

export function firstOpenStepIndex(steps: readonly ImageStep[]): number {
  return Math.max(steps.findIndex((step) => !isSlotDone(step.slot)), 0);
}
