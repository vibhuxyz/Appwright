import { describe, expect, it } from "bun:test";
import { PROMPT_ANALYSIS_LIMITS } from "@repo/contracts";
import { extractErrorHints } from "../src/analyze";

describe("extractErrorHints files", () => {
  const cases: { name: string; text: string; files: { path: string; line?: number }[] }[] = [
    {
      name: "a Node stack frame",
      text: "TypeError: x is undefined\n    at MenuList (src/app/menu/page.tsx:42:18)",
      files: [{ path: "src/app/menu/page.tsx", line: 42 }],
    },
    {
      name: "a TypeScript compiler error",
      text: "src/app/atelier/page.tsx(16,11): error TS2322: Type 'Element' is not assignable",
      files: [{ path: "src/app/atelier/page.tsx", line: 16 }],
    },
    {
      name: "a Next overlay location with a space before the position",
      text: "Console Error\r\n\r\nsrc/components/SiteHeader.tsx (62:13)",
      files: [{ path: "src/components/SiteHeader.tsx", line: 62 }],
    },
    {
      name: "a webpack-style relative path",
      text: "./src/app/page.tsx:7:3\nModule not found: Can't resolve '@/lib/menu'",
      files: [{ path: "src/app/page.tsx", line: 7 }],
    },
    {
      name: "an absolute sandbox path, cut back to the project root",
      text: "at Page (/home/sandbox/.workspaces/abc/src/app/page.tsx:3:1)",
      files: [{ path: "src/app/page.tsx", line: 3 }],
    },
    {
      name: "a bare file name without a line, which is not a hint",
      text: "We use Next.js and React",
      files: [],
    },
    {
      name: "a node_modules frame, which is skipped",
      text: "at render (node_modules/react-dom/cjs/react-dom.development.js:100:3)",
      files: [],
    },
  ];
  for (const testCase of cases) {
    it(`reads ${testCase.name}`, () => {
      expect(extractErrorHints(testCase.text).files).toEqual(testCase.files);
    });
  }

  it("keeps the first line seen for a repeated path", () => {
    const text = "at a (src/a.tsx:1:1)\nat b (src/a.tsx:9:1)";
    expect(extractErrorHints(text).files).toEqual([{ path: "src/a.tsx", line: 1 }]);
  });

  it("caps the number of files", () => {
    const text = Array.from({ length: 20 }, (_, index) => `at f (src/file-${index}.ts:1:1)`).join("\n");
    expect(extractErrorHints(text).files.length).toBe(PROMPT_ANALYSIS_LIMITS.maxHintFiles);
  });
});

describe("extractErrorHints error lines", () => {
  it("collects flattened error lines and skips the rest", () => {
    const text = "Some context\nTypeError:   Cannot read properties of undefined\r\nmore text\nerror TS2304: Cannot find name 'x'.";
    expect(extractErrorHints(text).errorLines).toEqual([
      "TypeError: Cannot read properties of undefined",
      "error TS2304: Cannot find name 'x'.",
    ]);
  });
});
