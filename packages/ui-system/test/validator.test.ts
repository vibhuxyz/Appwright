import { describe, expect, it } from "bun:test";
import {
  checkAccessibilityRules,
  checkResponsiveRules,
  getLayoutShell,
  parseVisualReference,
  SHELL_LAYOUTS,
  validateUiSource,
} from "../src";

describe("validateUiSource", () => {
  it("rejects off-scale bracket values and passes standard scale classes", () => {
    const badCode = `
      export function BadCard() {
        return <div className="px-[17px] rounded-[11px] bg-primary">Hello</div>;
      }
    `;
    const result = validateUiSource(badCode);
    expect(result.valid).toBe(false);
    expect(result.issues).toHaveLength(2);
    expect(result.issues[0]?.raw).toBe("px-[17px]");
    expect(result.issues[1]?.raw).toBe("rounded-[11px]");

    const goodCode = `
      export function GoodCard() {
        return <div className="px-4 rounded-md bg-primary">Hello</div>;
      }
    `;
    const goodResult = validateUiSource(goodCode);
    expect(goodResult.valid).toBe(true);
    expect(goodResult.issues).toHaveLength(0);
  });

  it("rejects unregistered component imports", () => {
    const code = `
      import { Button } from "@/components/ui/button";
      import { FancyCarousel } from "@/components/ui/fancy-carousel";
    `;
    const result = validateUiSource(code);
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.type === "unregistered_component")).toBe(true);
  });

  it("records raw escapes and suggests missing tokens after three occurrences", () => {
    const code = `
      export function Repeated() {
        return (
          <div>
            <span className="p-[19px]">One</span>
            <span className="p-[19px]">Two</span>
            <span className="p-[19px]">Three</span>
          </div>
        );
      }
    `;
    const result = validateUiSource(code);
    expect(result.valid).toBe(false);
    expect(result.escapes.some((e) => e.value === "19px" && e.count === 3)).toBe(true);
    expect(result.missingTokenSuggestions.length).toBeGreaterThan(0);
    expect(result.missingTokenSuggestions[0]).toContain("19px");
  });
});

describe("rules (accessibility and responsive)", () => {
  it("flags accessibility violations for img without alt and icon button without aria-label", () => {
    const a11yCode = `
      export function Gallery() {
        return (
          <div>
            <img src="/photo.jpg" />
            <button><SettingsIcon /></button>
          </div>
        );
      }
    `;
    const result = checkAccessibilityRules(a11yCode);
    expect(result.passed).toBe(false);
    expect(result.violations.map((v) => v.rule)).toContain("img-alt-required");
    expect(result.violations.map((v) => v.rule)).toContain("icon-button-aria-label");
  });

  it("flags unresponsive fixed desktop width without breakpoint", () => {
    const responsiveCode = `
      export function LargeBox() {
        return <div className="w-[800px]">Desktop only</div>;
      }
    `;
    const result = checkResponsiveRules(responsiveCode);
    expect(result.passed).toBe(false);
    expect(result.violations[0]?.rule).toBe("no-unresponsive-fixed-desktop-width");
  });
});

describe("layouts and visual reference parser", () => {
  it("returns layout shells with correct structure", () => {
    const shell = getLayoutShell("sidebar-header");
    expect(shell.id).toBe("sidebar-header");
    expect(shell.headerHeight).toBe("72px");
    expect(shell.sidebarWidth).toBe("240px");
    expect(SHELL_LAYOUTS["top-nav"].mobileNav).toBe("header");
  });

  it("parses visual reference into design and layout blocks once", () => {
    const parsed = parseVisualReference({
      viewport: "1440x900",
      primaryColor: "112233",
      accentColor: "#445566",
      headerHeight: 64,
      sidebarWidth: "250px",
      columns: 12,
      radius: "lg",
    });

    expect(parsed.rawViewport).toBe("1440x900");
    expect(parsed.design.primaryColor).toBe("#112233");
    expect(parsed.design.accentColor).toBe("#445566");
    expect(parsed.design.radius).toBe("lg");
    expect(parsed.layout.header).toBe("64px");
    expect(parsed.layout.sidebar).toBe("250px");
    expect(parsed.layout.content).toBe("12-column");
  });
});
