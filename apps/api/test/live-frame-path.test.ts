import { describe, expect, it } from "bun:test";
import { sessionBrowserReportPath } from "@repo/workspace";
import { liveFramePath } from "../src/browser-report";

describe("liveFramePath", () => {
  it("points at live.jpg inside the session report folder", () => {
    expect(liveFramePath("p1", "s1")).toBe(`${sessionBrowserReportPath("p1", "s1")}/live.jpg`);
  });

  it("rejects ids that could leave the report folder", () => {
    expect(liveFramePath("p1", "../s1")).toBeNull();
    expect(liveFramePath("../p1", "s1")).toBeNull();
    expect(liveFramePath("p1", "a/b")).toBeNull();
    expect(liveFramePath("p1", "")).toBeNull();
  });
});
