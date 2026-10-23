import { describe, expect, it } from "bun:test";
import { AssetSlotSchema } from "@repo/contracts";
import { applyClaim } from "../src/assets/claim-slot";

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

describe("applyClaim", () => {
  it("moves only the targeted slot into the in-flight status", () => {
    const result = applyClaim(slots, "a", "GENERATING");

    expect(result[0]).toMatchObject({ status: "GENERATING" });
    expect(result[1]).toEqual(slots[1]!);
  });

  it("does not mutate its input", () => {
    applyClaim(slots, "a", "UPLOADING");

    expect(slots[0]?.status).toBe("PENDING");
  });
});
