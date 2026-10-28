import { describe, expect, it } from "bun:test";
import { classifyChange, viewportsForRisk } from "../src/check";

describe("classifyChange", () => {
  it.each([
    [{ changedPaths: ["README.md", "package.json"], addedPaths: [] }, "none"],
    [{ changedPaths: ["src/app/api/orders/route.ts", "src/lib/cart.ts"], addedPaths: [] }, "functional"],
    [{ changedPaths: ["src/app/page.tsx", "src/lib/cart.ts"], addedPaths: [] }, "visual"],
    [{ changedPaths: ["src/app/globals.css"], addedPaths: [] }, "page"],
    [{ changedPaths: ["src/theme.css"], addedPaths: [] }, "page"],
    [{ changedPaths: ["src/app/shop/shop.css"], addedPaths: [] }, "visual"],
    [{ changedPaths: ["src/app/shop/page.tsx"], addedPaths: ["src/app/shop/page.tsx"] }, "page"],
    [{ changedPaths: ["src/lib/new.ts"], addedPaths: ["src/lib/new.ts"] }, "functional"],
  ] as const)("%o → %s", (scope, risk) => {
    expect(classifyChange(scope)).toBe(risk);
  });
});

describe("viewportsForRisk", () => {
  it("checks more screen sizes as the risk grows", () => {
    expect(viewportsForRisk("functional").map((viewport) => viewport.name)).toEqual(["desktop"]);
    expect(viewportsForRisk("visual").map((viewport) => viewport.name)).toEqual(["mobile", "desktop"]);
    expect(viewportsForRisk("page").map((viewport) => viewport.name)).toEqual(["mobile", "tablet", "desktop"]);
  });
});
