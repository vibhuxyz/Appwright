import { describe, expect, test } from "bun:test";
import { applyFileToolOps, type FileToolOp } from "../src/utils/projectFiles.ts";

describe("applyFileToolOps", () => {
  test("last write_file wins for a path", () => {
    const ops: FileToolOp[] = [
      { kind: "write_file", path: "src/a.tsx", content: "one" },
      { kind: "write_file", path: "src/a.tsx", content: "two" },
      { kind: "write_file", path: "src/b.tsx", content: "b" },
    ];

    const files = applyFileToolOps(ops);

    expect(files.get("src/a.tsx")).toBe("two");
    expect(files.get("src/b.tsx")).toBe("b");
  });

  test("edit_file applies after write_file when oldString is unique", () => {
    const ops: FileToolOp[] = [
      { kind: "write_file", path: "page.tsx", content: "hello world" },
      {
        kind: "edit_file",
        path: "page.tsx",
        oldString: "world",
        newString: "bakery",
      },
    ];

    expect(applyFileToolOps(ops).get("page.tsx")).toBe("hello bakery");
  });

  test("edit_file without a prior write uses existing content", () => {
    const existing = new Map([["layout.tsx", "export default function Layout() {}"]]);
    const ops: FileToolOp[] = [
      {
        kind: "edit_file",
        path: "layout.tsx",
        oldString: "Layout",
        newString: "RootLayout",
      },
    ];

    expect(applyFileToolOps(ops, existing).get("layout.tsx")).toBe(
      "export default function RootLayout() {}",
    );
  });

  test("edit_file is skipped when the path is unknown", () => {
    const ops: FileToolOp[] = [
      {
        kind: "edit_file",
        path: "missing.tsx",
        oldString: "a",
        newString: "b",
      },
    ];

    expect(applyFileToolOps(ops).size).toBe(0);
  });

  test("edit_file is skipped when oldString is missing or ambiguous", () => {
    const ops: FileToolOp[] = [
      { kind: "write_file", path: "a.txt", content: "foo foo" },
      { kind: "edit_file", path: "a.txt", oldString: "foo", newString: "bar" },
      { kind: "write_file", path: "b.txt", content: "only once" },
      { kind: "edit_file", path: "b.txt", oldString: "zzz", newString: "bar" },
    ];

    const files = applyFileToolOps(ops);
    expect(files.get("a.txt")).toBe("foo foo");
    expect(files.get("b.txt")).toBe("only once");
  });
});
