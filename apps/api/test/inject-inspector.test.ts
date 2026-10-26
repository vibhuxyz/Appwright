import { describe, expect, it, test } from "bun:test";
import { injectInspector, isHtmlResponse } from "../src/preview";

describe("injectInspector", () => {
  it("inserts the script before the last closing body tag", () => {
    const out = injectInspector("<html><body><p>hi</p></body></html>");
    expect(out.indexOf("data-aw-inspector")).toBeLessThan(out.indexOf("</body>"));
    expect(out.startsWith("<html><body><p>hi</p><script")).toBe(true);
  });

  it("appends when there is no body tag", () => {
    expect(injectInspector("<p>x</p>").endsWith("</script>")).toBe(true);
  });

  it("recognises html content types only", () => {
    expect(isHtmlResponse("text/html; charset=utf-8")).toBe(true);
    expect(isHtmlResponse("application/javascript")).toBe(false);
    expect(isHtmlResponse(undefined)).toBe(false);
  });
});

describe("telemetry injection", () => {
  test("the injected scripts parse as valid JavaScript and hook console and fetch", () => {
    const html = injectInspector("<html><body></body></html>");
    const scripts = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map((match) => match[1] ?? "");
    expect(scripts).toHaveLength(2);
    for (const source of scripts) expect(() => new Function(source)).not.toThrow();
    expect(html).toContain("aw:console");
    expect(html).toContain("aw:network");
  });
});
