import { describe, expect, it } from "bun:test";
import { AssetSlotSchema } from "@repo/contracts";
import { applySlotOutcome } from "../src/assets/mark-slot-resolved";

const base = {
  pageRoute: "/",
  componentName: "Hero",
  purpose: "hero",
  altText: "hero",
  suggestedPrompt: "hero",
  status: "PENDING",
};

const slots = [
  AssetSlotSchema.parse({ ...base, id: "a", required: true }),
  AssetSlotSchema.parse({ ...base, id: "b" }),
];

describe("applySlotOutcome", () => {
  it("updates only the targeted slot and records the final path", () => {
    const result = applySlotOutcome(slots, {
      assetRequestId: "r",
      slotId: "a",
      status: "RESOLVED",
      assetId: "asset-1",
      finalPath: "/assets/hero/a.png",
    });

    expect(result[0]).toMatchObject({ status: "RESOLVED", assetId: "asset-1", finalPath: "/assets/hero/a.png" });
    expect(result[1]).toEqual(slots[1]!);
  });

  it("marks a failed generation without resolving the slot", () => {
    const result = applySlotOutcome(slots, { assetRequestId: "r", slotId: "b", status: "FAILED" });

    expect(result[1]).toMatchObject({ status: "FAILED", assetId: null });
  });

  it("does not mutate its input", () => {
    applySlotOutcome(slots, { assetRequestId: "r", slotId: "a", status: "SKIPPED" });

    expect(slots[0]?.status).toBe("PENDING");
  });
});
