import { describe, expect, it } from "bun:test";
import { sessionBrowserReportPath } from "@repo/workspace";
import { screenshotPath } from "../src/browser-report";

describe("screenshotPath", () => {
  it("resolves a screenshot name inside the session's report folder", () => {
    const resolved = screenshotPath("p1", "s1", "menu-mobile.png");
    expect(resolved).toBe(`${sessionBrowserReportPath("p1", "s1")}/menu-mobile.png`);
  });

  it("rejects traversal, nested paths, other extensions and empty names", () => {
    for (const name of ["../secret.png", "a/b.png", "..%2Fx.png", "menu.jpg", ".png", "Menu.png", ""]) {
      expect(screenshotPath("p1", "s1", name)).toBeNull();
    }
  });
});
