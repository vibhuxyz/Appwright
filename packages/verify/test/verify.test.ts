import { describe, expect, it } from "bun:test";
import { parseBuildErrors, parseLintErrors, parseTscErrors } from "../src/parser";

describe("parseTscErrors", () => {
  it("returns empty array for empty output", () => {
    expect(parseTscErrors("")).toEqual([]);
  });

  it("parses colon format tsc error", () => {
    const raw = "src/App.tsx:14:5 - error TS2304: Cannot find name 'foo'.";
    const errors = parseTscErrors(raw);
    expect(errors).toHaveLength(1);
    expect(errors[0]?.file).toBe("src/App.tsx");
    expect(errors[0]?.line).toBe(14);
    expect(errors[0]?.col).toBe(5);
    expect(errors[0]?.message).toBe("Cannot find name 'foo'.");
  });

  it("parses paren format tsc error", () => {
    const raw = "src/components/Button.tsx(22,10): error TS2322: Type 'string' is not assignable to type 'number'.";
    const errors = parseTscErrors(raw);
    expect(errors).toHaveLength(1);
    expect(errors[0]?.file).toBe("src/components/Button.tsx");
    expect(errors[0]?.line).toBe(22);
    expect(errors[0]?.col).toBe(10);
    expect(errors[0]?.message).toBe("Type 'string' is not assignable to type 'number'.");
  });
});

describe("parseBuildErrors", () => {
  it("parses build error lines", () => {
    const raw = "Building package\nError: Failed to compile module\nDone";
    const errors = parseBuildErrors(raw);
    expect(errors).toHaveLength(1);
    expect(errors[0]?.message).toBe("Error: Failed to compile module");
  });
});

describe("parseLintErrors", () => {
  it("parses lint errors", () => {
    const raw = "src/index.ts: line 5, col 1, Error - 'x' is defined but never used.";
    const errors = parseLintErrors(raw);
    expect(errors).toHaveLength(1);
    expect(errors[0]?.file).toBe("src/index.ts");
    expect(errors[0]?.line).toBe(5);
    expect(errors[0]?.col).toBe(1);
    expect(errors[0]?.message).toBe("'x' is defined but never used.");
  });
});
