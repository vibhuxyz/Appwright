import { describe, expect, test } from "bun:test";
import { BROWSER_CHECK_OPENING, browserCheckStatus, isBrowserCheckStatus } from "../src/browser-check-status";

describe("browser check status", () => {
  test("opening and checking labels are the live-view signal", () => {
    expect(isBrowserCheckStatus(BROWSER_CHECK_OPENING)).toBe(true);
    expect(isBrowserCheckStatus(browserCheckStatus("home · desktop · scrolling"))).toBe(true);
    expect(isBrowserCheckStatus("Choosing questions for this app…")).toBe(false);
    expect(isBrowserCheckStatus("")).toBe(false);
  });

  test("flattens newlines and caps the label", () => {
    const status = browserCheckStatus(`home\n<script>`);
    expect(status.startsWith("Checking home <script>")).toBe(true);
    expect(status.includes("\n")).toBe(false);
    expect(browserCheckStatus("x".repeat(400)).length).toBeLessThanOrEqual("Checking ".length + 180);
  });
});
