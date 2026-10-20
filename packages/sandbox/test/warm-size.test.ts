import { describe, expect, it } from "bun:test";
import { readWarmPoolSize } from "../src/providers/e2b-warm-size";

describe("readWarmPoolSize", () => {
  it("defaults to 0 and parses valid integers", () => {
    expect(readWarmPoolSize(undefined)).toBe(0);
    expect(readWarmPoolSize("3")).toBe(3);
  });

  it("rejects invalid values naming the input", () => {
    expect(() => readWarmPoolSize("-1")).toThrow(/SANDBOX_WARM_POOL_SIZE: -1/);
    expect(() => readWarmPoolSize("abc")).toThrow(/abc/);
    expect(() => readWarmPoolSize("99")).toThrow(/99/);
  });
});
