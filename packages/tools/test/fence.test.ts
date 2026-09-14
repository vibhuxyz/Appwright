import { safeResolve } from "@repo/contracts";
import { isDenied } from "../src/fence";
import { describe, expect, test } from "bun:test";

describe("safeResolve", () => {
  test("throws on a path that escapes the workspace", () => {
    expect(() => safeResolve("vite-react", "../../.env")).toThrow();
  });

  test("resolves an in-workspace path without throwing", () => {
    expect(() => safeResolve("vite-react", "src/App.tsx")).not.toThrow();
  });
});

describe("isDenied", () => {
  test("denies .env at the root", () => {
    expect(isDenied(".env")).toBe(true);
  });

  test("denies .env variants nested in a subdirectory", () => {
    expect(isDenied("packages/api/.env.local")).toBe(true);
  });

  test("denies anything under .git/", () => {
    expect(isDenied("nested/.git/config")).toBe(true);
  });

  test("denies key files", () => {
    expect(isDenied("keys/prod.pem")).toBe(true);
    expect(isDenied("id_rsa")).toBe(true);
  });

  test("allows an ordinary source file", () => {
    expect(isDenied("src/App.tsx")).toBe(false);
  });
});
