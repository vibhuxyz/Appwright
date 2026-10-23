import { describe, expect, test } from "bun:test";
import { browserActivityLabel, browserVisitLimit, boundedMs, MAX_PAUSE_MS } from "../src/live";
import { cursorScript } from "../src/live/cursor-script";
import { scrollScript } from "../src/session/scroll-script";

describe("browser live view", () => {
  test("watches one page at a time and names the action", () => {
    expect(browserVisitLimit(false)).toBe(3);
    expect(browserVisitLimit(true)).toBe(1);
    expect(browserActivityLabel("/", "desktop", "scrolling")).toBe("home · desktop · scrolling");
    expect(browserActivityLabel("/menu", "mobile", "interacting")).toBe(
      "/menu · mobile · clicking and filling forms",
    );
  });

  test("pause values written into page scripts stay bounded integers", () => {
    expect(scrollScript(80)).toContain("setTimeout(resolve, 80)");
    expect(scrollScript(9_999)).toContain(`setTimeout(resolve, ${MAX_PAUSE_MS})`);
    expect(scrollScript(Number.NaN)).toContain("setTimeout(resolve, 0)");
    expect(cursorScript(220).includes("280ms")).toBe(false);
    expect(cursorScript(220)).toContain("220ms");
    expect(boundedMs(-4, 500)).toBe(0);
  });
});
