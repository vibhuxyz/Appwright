import { describe, expect, it } from "bun:test";
import { percentile } from "../src/site/plan-bench";
import { repairMessage } from "../src/site/paths/repair-message";

describe("percentile", () => {
  it("uses the nearest-rank value", () => {
    const values = [400, 100, 300, 200];
    expect(percentile(values, 0.5)).toBe(200);
    expect(percentile(values, 0.75)).toBe(300);
    expect(percentile(values, 1)).toBe(400);
  });

  it("returns null for no samples", () => {
    expect(percentile([], 0.75)).toBeNull();
  });
});

describe("repairMessage", () => {
  it("lists located errors and caps the list", () => {
    const errors = Array.from({ length: 45 }, (_, index) => ({ file: "src/app/page.tsx", line: index + 1, message: `bad  thing ${index}` }));
    const message = repairMessage({ ok: false, check: "tsc", errors });
    expect(message).toContain("- src/app/page.tsx:1: bad thing 0");
    expect(message).toContain("(+5 more)");
    expect(message.startsWith("Running verification checks")).toBe(true);
  });
});
