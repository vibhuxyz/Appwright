import { describe, expect, it } from "bun:test";
import { INTEGRATION_CATALOG } from "@repo/contracts";
import { filterIntegrationCatalog } from "./filter-catalog";

describe("filterIntegrationCatalog", () => {
  it("combines category and capability search", () => {
    const results = filterIntegrationCatalog(INTEGRATION_CATALOG, "payments", "verification");
    expect(results.map((entry) => entry.provider)).toEqual(["razorpay"]);
  });

  it("matches provider names without case sensitivity", () => {
    const results = filterIntegrationCatalog(INTEGRATION_CATALOG, "all", "CLOUDINARY");
    expect(results.map((entry) => entry.provider)).toEqual(["cloudinary"]);
  });

  it("returns no entries for a category with no matching search result", () => {
    expect(filterIntegrationCatalog(INTEGRATION_CATALOG, "storage", "payments")).toEqual([]);
  });
});
