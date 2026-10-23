import { describe, expect, it } from "bun:test";
import { searchStockImage, type StockFetch } from "./search-stock-image";

const PNG = Uint8Array.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
]);

describe("searchStockImage", () => {
  it("downloads the first Google image result when CSE is configured", async () => {
    process.env.GOOGLE_API_KEY = "test-key";
    process.env.GOOGLE_CSE_ID = "test-cx";
    const fetchImpl: StockFetch = async (input) => {
      const url = String(input);
      if (url.includes("customsearch.v1") || url.includes("customsearch/v1")) {
        return new Response(JSON.stringify({ items: [{ link: "https://cdn.example/bakery.jpg" }] }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response(PNG, { status: 200, headers: { "Content-Type": "image/png" } });
    };
    const result = await searchStockImage({ query: "bakery hero photograph", fetchImpl });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.mimeType).toBe("image/png");
  });

  it("falls back to Wikimedia when Google keys are missing", async () => {
    delete process.env.GOOGLE_API_KEY;
    delete process.env.GOOGLE_CSE_ID;
    const fetchImpl: StockFetch = async (input) => {
      const url = String(input);
      if (url.includes("commons.wikimedia.org")) {
        return new Response(
          JSON.stringify({
            query: { pages: { "1": { imageinfo: [{ url: "https://upload.wikimedia.org/bakery.png" }] } } },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }
      return new Response(PNG, { status: 200 });
    };
    const result = await searchStockImage({ query: "bakery about photo", fetchImpl });
    expect(result.ok).toBe(true);
  });
});
