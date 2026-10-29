import { describe, expect, test } from "bun:test";
import { truncate } from "../src/engine/truncate";

describe("truncate", () => {
  test("leaves short content untouched", () => {
    expect(truncate("hello", 100)).toBe("hello");
  });

  test("cuts long content down and says how much was omitted", () => {
    const content = "x".repeat(10_000);
    const result = truncate(content, 100);

    expect(result.length).toBeLessThan(content.length);
    expect(result).toContain("omitted");
  });

  test("keeps head and tail on either side of the cut", () => {
    const content = `HEAD${"x".repeat(10_000)}TAIL`;
    const result = truncate(content, 200);

    expect(result.startsWith("HEAD")).toBe(true);
    expect(result.endsWith("TAIL")).toBe(true);
    expect(Buffer.byteLength(result, "utf8")).toBeLessThanOrEqual(200);
  });
});
