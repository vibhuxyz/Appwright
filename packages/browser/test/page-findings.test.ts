import { describe, expect, it } from "bun:test";
import type { PageMeasurements } from "../src/session";
import { pageFindings, type PageObservation } from "../src/visual";

const HEALTHY: PageMeasurements = {
  viewportWidth: 375,
  scrollWidth: 375,
  bodyTextLength: 500,
  overflowing: [],
  brokenImages: [],
  unlabelledControls: [],
  clippedText: [],
  overlappingText: [],
  links: [],
};

function observation(overrides: Partial<PageObservation> = {}): PageObservation {
  return {
    route: "/menu",
    viewport: "mobile",
    pageUrl: "http://127.0.0.1:3000/menu",
    navigation: { status: 200 },
    measurements: HEALTHY,
    events: { consoleErrors: [], pageErrors: [], failedRequests: [], badResponses: [] },
    ...overrides,
  };
}

describe("pageFindings", () => {
  it("returns nothing for a healthy page", () => {
    expect(pageFindings(observation())).toEqual([]);
  });

  it("reports sideways scrolling with the offending elements", () => {
    const findings = pageFindings(
      observation({ measurements: { ...HEALTHY, scrollWidth: 900, overflowing: ['div.wide "wide"'] } }),
    );
    expect(findings).toHaveLength(1);
    expect(findings[0]?.kind).toBe("horizontal-overflow");
    expect(findings[0]?.message).toContain("900px wide in a 375px viewport");
    expect(findings[0]?.message).toContain("div.wide");
  });

  it("does not report a one pixel rounding difference", () => {
    expect(pageFindings(observation({ measurements: { ...HEALTHY, scrollWidth: 376 } }))).toEqual([]);
  });

  it("reports a failed navigation and nothing else", () => {
    const findings = pageFindings(observation({ navigation: { status: null, error: "net::ERR_CONNECTION_REFUSED" } }));
    expect(findings.map((finding) => finding.kind)).toEqual(["navigation-failed"]);
  });

  it("reports an error status once and does not call the page empty", () => {
    const findings = pageFindings(
      observation({
        navigation: { status: 500 },
        measurements: { ...HEALTHY, bodyTextLength: 0 },
        events: {
          consoleErrors: [],
          pageErrors: [],
          failedRequests: [],
          badResponses: [{ url: "http://127.0.0.1:3000/menu", status: 500 }],
        },
      }),
    );
    expect(findings.map((finding) => finding.kind)).toEqual(["http-error"]);
  });

  it("reports failing API calls once per status and path", () => {
    const badResponse = { url: "http://127.0.0.1:3000/api/items", status: 500 };
    const findings = pageFindings(
      observation({ events: { consoleErrors: [], pageErrors: [], failedRequests: [], badResponses: [badResponse, badResponse] } }),
    );
    expect(findings).toHaveLength(1);
    expect(findings[0]?.message).toBe("Request returned 500: /api/items");
  });

  it("reports uncaught errors, console errors, broken images, unlabelled controls and empty pages", () => {
    const findings = pageFindings(
      observation({
        measurements: { ...HEALTHY, bodyTextLength: 3, brokenImages: ["/a.png"], unlabelledControls: ["button"] },
        events: { consoleErrors: ["bad"], pageErrors: ["boom"], failedRequests: [], badResponses: [] },
      }),
    );
    expect(findings.map((finding) => finding.kind)).toEqual([
      "page-error",
      "console-error",
      "broken-image",
      "unlabelled-control",
      "empty-page",
    ]);
  });

  it("marks unlabelled controls as warnings and layout breaks as errors", () => {
    const findings = pageFindings(
      observation({ measurements: { ...HEALTHY, scrollWidth: 800, unlabelledControls: ["button"] } }),
    );
    expect(findings.find((finding) => finding.kind === "unlabelled-control")?.severity).toBe("warning");
    expect(findings.find((finding) => finding.kind === "horizontal-overflow")?.severity).toBe("error");
  });
});
