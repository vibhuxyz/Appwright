import { describe, expect, it } from "bun:test";
import { createWriteFence } from "../src";

describe("createWriteFence", () => {
  const fence = createWriteFence(["src/auth/**", "src/lib/db.ts", "db:app"]);

  it("allows files under an owned directory and exact owned files", () => {
    expect(fence.check("src/auth/login.ts").allowed).toBe(true);
    expect(fence.check("./src/lib/db.ts").allowed).toBe(true);
  });

  it("rejects siblings that merely share a prefix string", () => {
    expect(fence.check("src/authx/a.ts").allowed).toBe(false);
    expect(fence.check("src/lib/db.tsx").allowed).toBe(false);
  });

  it("rejects traversal, absolute paths and backslash tricks", () => {
    expect(fence.check("src/auth/../secrets.ts").allowed).toBe(false);
    expect(fence.check("/etc/passwd").allowed).toBe(false);
    expect(fence.check("src\\auth\\..\\x.ts").allowed).toBe(false);
  });

  it("keeps only file resources as write targets", () => {
    expect(fence.ownedPrefixes).toEqual(["src/auth", "src/lib/db.ts"]);
  });
});
