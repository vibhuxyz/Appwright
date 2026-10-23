import { describe, expect, it } from "bun:test";
import { approvedBlueprintIdFromRows } from "../src/worker/approved-blueprint-id";

describe("approvedBlueprintIdFromRows", () => {
  it("returns the plan the user approved on the theme row", () => {
    const rows = [
      { data: null },
      { data: { intake: true, theme: {}, blueprintId: "bp-approved" } },
    ];
    expect(approvedBlueprintIdFromRows(rows)).toBe("bp-approved");
  });

  it("returns nothing when no plan was approved, so the worker plans fresh", () => {
    expect(approvedBlueprintIdFromRows([{ data: { intake: true, theme: {} } }, { data: null }])).toBeUndefined();
  });
});
