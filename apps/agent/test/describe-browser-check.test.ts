import { describe, expect, it } from "bun:test";
import type { BrowserCheckResult, Finding } from "@repo/browser";
import { isBrowserCheckEnabled } from "../src/worker/browser-check-step";
import { describeBrowserCheck, screenshotUrlFor } from "../src/worker/describe-browser-check";

const OVERFLOW: Finding = {
  kind: "horizontal-overflow",
  severity: "error",
  route: "/menu",
  viewport: "mobile",
  message: "Page scrolls sideways",
  screenshot: "menu-mobile.png",
};

function checked(findings: readonly Finding[]): BrowserCheckResult {
  return {
    status: "checked",
    report: {
      routes: ["/menu"],
      pagesChecked: 3,
      formsTested: 0,
      buttonsClicked: 0,
      findings,
      screenshots: findings.flatMap((f) => (f.screenshot ? [f.screenshot] : [])),
      pageShots: [],
      notes: [],
    },
    skippedRoutes: [{ path: "src/app/blog/[slug]/page.tsx", reason: "dynamic segment needs real data" }],
    risk: "visual",
    viewports: ["mobile", "desktop"],
  };
}

describe("describeBrowserCheck", () => {
  it("links the screenshot through the session route and records the findings", () => {
    const message = describeBrowserCheck("s1", checked([OVERFLOW]));
    expect(message.content).toContain(`[screenshot](${screenshotUrlFor("s1", "menu-mobile.png")})`);
    expect(message.data).toMatchObject({ browserCheck: { status: "checked", passed: false, screenshots: ["menu-mobile.png"] } });
  });

  it("names the pages that were not opened and why", () => {
    const message = describeBrowserCheck("s1", checked([]));
    expect(message.content).toContain("dynamic segment needs real data");
    expect(message.data).toMatchObject({ browserCheck: { passed: true } });
  });

  it("reports a skipped check with its reason instead of dropping it", () => {
    const message = describeBrowserCheck("s1", { status: "skipped", reason: "Cannot launch Chromium" });
    expect(message.content).toContain("Cannot launch Chromium");
    expect(message.data).toEqual({ browserCheck: { status: "skipped", reason: "Cannot launch Chromium" } });
  });

  it("reports an app that would not start", () => {
    const message = describeBrowserCheck("s1", { status: "app-failed", reason: "exited with code 1" });
    expect(message.content).toContain("exited with code 1");
  });
});

describe("isBrowserCheckEnabled", () => {
  it("is on unless explicitly turned off", () => {
    expect(isBrowserCheckEnabled({})).toBe(true);
    expect(isBrowserCheckEnabled({ BROWSER_CHECK: "true" })).toBe(true);
    expect(isBrowserCheckEnabled({ BROWSER_CHECK: "false" })).toBe(false);
  });
});
