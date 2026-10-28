import { describe, expect, it } from "bun:test";
import { classifyChange, copyOnlyPaths } from "../src/check";

function diff(path: string, removed: readonly string[], added: readonly string[]): string {
  return [
    `diff --git a/${path} b/${path}`,
    `--- a/${path}`,
    `+++ b/${path}`,
    `@@ -1,${removed.length} +1,${added.length} @@`,
    ...removed.map((line) => `-${line}`),
    ...added.map((line) => `+${line}`),
  ].join("\n");
}

describe("copyOnlyPaths", () => {
  it("accepts reworded JSX text and string props of a similar length", () => {
    const text = diff("src/app/page.tsx", ["      Fresh bread every morning", '  title: "Our story",'], ["      Warm bread every morning", '  title: "Our history",']);
    expect(copyOnlyPaths(text)).toEqual(["src/app/page.tsx"]);
  });

  it("rejects class changes, structure changes and much longer copy", () => {
    const classes = diff("src/app/page.tsx", ['<p className="p-4">Hi</p>'], ['<p className="p-8">Hi</p>']);
    const constant = diff("src/app/hero.tsx", ['const ACTION = "inline-flex h-12 px-6";'], ['const ACTION = "inline-flex h-14 px-8";']);
    const structure = diff("src/app/page.tsx", ["<p>Hi</p>"], ["<p>Hi</p>", "<Button>Buy</Button>"]);
    const longer = diff("src/app/page.tsx", ["      Short line"], [`      ${"A much longer marketing paragraph ".repeat(4)}`]);
    const css = diff("src/app/globals.css", ["  color: red;"], ["  color: blue;"]);
    expect(copyOnlyPaths([classes, constant, structure, longer, css].join("\n"))).toEqual([]);
  });

  it("skips the browser only when every changed source file is copy-only", () => {
    expect(classifyChange({ changedPaths: ["src/app/page.tsx"], addedPaths: [], copyOnlyPaths: ["src/app/page.tsx"] })).toBe("none");
    expect(classifyChange({ changedPaths: ["src/app/page.tsx", "src/app/hero.tsx"], addedPaths: [], copyOnlyPaths: ["src/app/page.tsx"] })).toBe("visual");
  });
});
