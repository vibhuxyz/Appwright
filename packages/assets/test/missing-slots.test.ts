import { describe, expect, it } from "bun:test";
import { formatMissingAssetsNotice, unresolvedRequiredSlots } from "../src/missing-slots";

function slot(overrides: Record<string, unknown>) {
  return {
    id: "/:Hero:0",
    pageRoute: "/",
    componentName: "Hero",
    purpose: "hero",
    altText: "hero image",
    suggestedPrompt: "a hero",
    status: "PENDING",
    required: true,
    ...overrides,
  };
}

describe("unresolvedRequiredSlots", () => {
  it("reports required slots that are skipped, failed or still pending", () => {
    const slots = unresolvedRequiredSlots([
      [
        slot({ id: "a", status: "SKIPPED" }),
        slot({ id: "b", status: "FAILED" }),
        slot({ id: "c", status: "PENDING" }),
      ],
    ]);

    expect(slots.map((item) => item.id)).toEqual(["a", "b", "c"]);
  });

  it("ignores resolved slots, optional slots and malformed data", () => {
    const slots = unresolvedRequiredSlots([
      [slot({ id: "a", status: "RESOLVED" }), slot({ id: "b", status: "SKIPPED", required: false })],
      "garbage",
    ]);

    expect(slots).toEqual([]);
  });
});

describe("formatMissingAssetsNotice", () => {
  it("returns nothing when no required image is missing", () => {
    expect(formatMissingAssetsNotice([])).toBeUndefined();
  });

  it("names each missing image and says the site is not finished", () => {
    const notice = formatMissingAssetsNotice(
      unresolvedRequiredSlots([[slot({ status: "SKIPPED" })]]),
    );

    expect(notice).toContain("not finished");
    expect(notice).toContain("hero on / (skipped)");
  });
});
