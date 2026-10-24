import { describe, expect, it } from "bun:test";
import { reusableAssetWhere } from "../src/create-asset-request";

describe("reusableAssetWhere", () => {
  it("keeps another session's photos out of this request", () => {
    expect(reusableAssetWhere("project-1", "session-1", ["hero", "social"])).toEqual({
      projectId: "project-1",
      sessionId: "session-1",
      purpose: { in: ["hero", "social"] },
    });
  });
});
