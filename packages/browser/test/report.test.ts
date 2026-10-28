import { describe, expect, it } from "bun:test";
import type { ExploreReport } from "../src/explore";
import { makeFinding } from "../src/findings";
import { formatReport, hasErrors } from "../src/report";
import { truncateSnapshot } from "../src/snapshot";

function reportWith(findings: ExploreReport["findings"]): ExploreReport {
  return { routes: ["/", "/menu"], pagesChecked: 6, formsTested: 2, buttonsClicked: 3, findings, screenshots: [], pageShots: [], notes: [] };
}

describe("formatReport", () => {
  it("says so when nothing is wrong", () => {
    const text = formatReport(reportWith([]));
    expect(text).toContain("✅");
    expect(text).toContain("No problems found");
  });

  it("merges the same problem seen at several screen sizes into one line", () => {
    const mobile = makeFinding("horizontal-overflow", { route: "/menu", viewport: "mobile" }, "Page scrolls sideways");
    const tablet = makeFinding("horizontal-overflow", { route: "/menu", viewport: "tablet" }, "Page scrolls sideways");
    const text = formatReport(reportWith([mobile, tablet]));
    expect(text.split("\n").filter((line) => line.startsWith("- "))).toHaveLength(1);
    expect(text).toContain("(mobile, tablet)");
  });

  it("links the screenshot when a url builder is given", () => {
    const finding = { ...makeFinding("broken-image", { route: "/", viewport: "desktop" }, "x"), screenshot: "home-desktop.png" };
    const text = formatReport(reportWith([finding]), { screenshotUrl: (name) => `/shots/${name}` });
    expect(text).toContain("[screenshot](/shots/home-desktop.png)");
  });

  it("caps the listed problems and counts the rest", () => {
    const many = Array.from({ length: 30 }, (_, index) =>
      makeFinding("console-error", { route: "/", viewport: "desktop" }, `error ${index}`),
    );
    expect(formatReport(reportWith(many))).toContain("(+10 more)");
  });

  it("treats warnings alone as not failing", () => {
    const warning = makeFinding("unlabelled-control", { route: "/", viewport: "desktop" }, "button");
    expect(hasErrors(reportWith([warning]))).toBe(false);
  });
});

describe("truncateSnapshot", () => {
  it("keeps short snapshots whole", () => {
    expect(truncateSnapshot("- heading\n- button")).toBe("- heading\n- button");
  });

  it("cuts at the line limit and says how many lines were hidden", () => {
    const text = truncateSnapshot("a\nb\nc\nd", { maxLines: 2, maxBytes: 1000 });
    expect(text).toBe("a\nb\n(+2 more lines)");
  });

  it("always stays inside the byte budget", () => {
    const text = truncateSnapshot("x".repeat(50).concat("\n").repeat(10), { maxLines: 100, maxBytes: 120 });
    expect(Buffer.byteLength(text.split("\n(+")[0] ?? "", "utf8")).toBeLessThanOrEqual(120);
  });
});
