import { describe, expect, it } from "bun:test";
import { assetKeys } from "./query-keys";
import { photoSearchPath } from "./photo-search-path";

describe("photoSearchPath", () => {
  it("encodes the query and sends the page", () => {
    expect(photoSearchPath({ query: "bread & butter", page: 2 })).toBe("/unsplash/search?query=bread+%26+butter&page=2");
  });

  it("adds orientation only when one is chosen", () => {
    expect(photoSearchPath({ query: "cake", page: 1, orientation: "landscape" })).toContain("orientation=landscape");
    expect(photoSearchPath({ query: "cake", page: 1 })).not.toContain("orientation");
  });

  it("never sends the access key from the browser", () => {
    expect(photoSearchPath({ query: "cake", page: 1 })).not.toMatch(/client_id|access|key/i);
  });
});

describe("assetKeys.photoSearch", () => {
  it("separates cache entries by query and shape", () => {
    expect(assetKeys.photoSearch("a", undefined)).not.toEqual(assetKeys.photoSearch("a", "portrait"));
    expect(assetKeys.photoSearch("a", undefined)).toEqual(assetKeys.photoSearch("a", undefined));
  });
});
