import { describe, expect, it } from "bun:test";
import path from "node:path";

const PATTERNS_DIR = path.resolve(import.meta.dir, "../patterns");
const CLIENT_ONLY_API = /\buse[A-Z][A-Za-z]*\(|from ["']framer-motion["']|lenis\/react/;
const DIRECTIVE_WINDOW_LINES = 3;

describe("client directives on shipped patterns", () => {
  it("start every hook-using component file with 'use client', so a server layout or page can import it", async () => {
    const missing: string[] = [];
    for await (const relative of new Bun.Glob("**/*.tsx").scan(PATTERNS_DIR)) {
      const source = await Bun.file(path.join(PATTERNS_DIR, relative)).text();
      if (!CLIENT_ONLY_API.test(source)) continue;
      const head = source.split("\n").slice(0, DIRECTIVE_WINDOW_LINES).join("\n");
      if (!/["']use client["']/.test(head)) missing.push(relative);
    }
    expect(missing.sort()).toEqual([]);
  });
});
