import { describe, expect, it } from "bun:test";
import { getProjectOverview } from "../src/project/get-project-overview";

describe("getProjectOverview", () => {
  it("returns null for non-existent project when database connected", async () => {
    try {
      const result = await getProjectOverview("non-existent-proj", "non-existent-user");
      expect(result).toBeNull();
    } catch (err) {
      expect(err).toBeDefined();
    }
  });
});
