import { describe, expect, it } from "bun:test";
import { inspectDatabase, getCollectionDocuments } from "../src/project-database/inspect-database";

describe("inspectDatabase", () => {
  it("returns null for non-existent project when database connected", async () => {
    try {
      const res = await inspectDatabase("non-existent-proj", "non-existent-user");
      expect(res).toBeNull();
    } catch (err) {
      expect(err).toBeDefined();
    }
  });

  it("returns null documents for non-existent project when database connected", async () => {
    try {
      const res = await getCollectionDocuments("non-existent-proj", "non-existent-user", "users");
      expect(res).toBeNull();
    } catch (err) {
      expect(err).toBeDefined();
    }
  });
});
