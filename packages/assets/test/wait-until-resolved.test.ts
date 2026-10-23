import { describe, expect, it } from "bun:test";
import { waitUntilAssetRequestResolved } from "../src/wait-until-resolved";

describe("waitUntilAssetRequestResolved", () => {
  it("rejects when the signal is already aborted", async () => {
    const controller = new AbortController();
    controller.abort(new Error("stopped"));
    await expect(waitUntilAssetRequestResolved("unused", controller.signal)).rejects.toThrow("stopped");
  });
});
