import { safeResolve } from "@repo/contracts/files";
import { isDenied, isGeneratedUiPrimitive, uiPrimitiveImportPath } from "../src/fence";
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

describe("isGeneratedUiPrimitive", () => {
  test("matches vendored primitives in both templates", () => {
    expect(isGeneratedUiPrimitive("src/components/ui/button.tsx")).toBe(true);
    expect(isGeneratedUiPrimitive("src/components/ui/dialog.tsx")).toBe(true);
  });

  test("allows app components next to the primitives", () => {
    expect(isGeneratedUiPrimitive("src/components/Animations.tsx")).toBe(false);
    expect(isGeneratedUiPrimitive("src/app/page.tsx")).toBe(false);
  });

  test("maps a primitive path to the import the agent should use", () => {
    expect(uiPrimitiveImportPath("src/components/ui/button.tsx")).toBe(
      "@/components/ui/button",
    );
  });
});
