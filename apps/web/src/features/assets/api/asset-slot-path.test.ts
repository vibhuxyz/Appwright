import { describe, expect, it } from "bun:test";
import { assetSlotPath } from "./asset-slot-path";

describe("assetSlotPath", () => {
  it("keeps a home-page slot id as one path segment", () => {
    const path = assetSlotPath("req-1", "/:Hero:0", "upload");
    expect(path).toBe("/asset-requests/req-1/slots/%2F%3AHero%3A0/upload");
    expect(path.split("/").filter(Boolean)).toHaveLength(5);
  });

  it("keeps a nested page route as one path segment", () => {
    const path = assetSlotPath("req-1", "/menu:CategoryMenu:1", "upload");
    expect(path).not.toContain("/menu:");
    expect(decodeURIComponent(path.split("/")[4] ?? "")).toBe("/menu:CategoryMenu:1");
  });
});
