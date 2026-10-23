import { describe, expect, it } from "bun:test";
import type { UnsplashSearchQuery } from "@repo/contracts";
import { createUnsplashClient } from "./client";
import { jsonResponse, rawPhoto, searchBody } from "./fixtures";
import type { UnsplashErrorCode, UnsplashFetch } from "./types";

const QUERY: UnsplashSearchQuery = { query: "Bread", page: 1, perPage: 12, contentFilter: "high" };
const KEY = "secret-access-key";

interface Recorder {
  readonly fetchImpl: UnsplashFetch;
  readonly calls: { url: URL; headers: Headers }[];
}

function recorder(respond: () => Response | Promise<Response>): Recorder {
  const calls: Recorder["calls"] = [];
  const fetchImpl: UnsplashFetch = async (input, init) => {
    calls.push({ url: new URL(String(input)), headers: new Headers(init?.headers) });
    return respond();
  };
  return { fetchImpl, calls };
}

function clientFor(rec: Recorder, now: () => number = () => 0, accessKey: string | null = KEY) {
  return createUnsplashClient({ accessKey: accessKey ?? undefined, fetchImpl: rec.fetchImpl, now });
}

describe("search", () => {
  it("authenticates with Client-ID and sends every filter", async () => {
    const rec = recorder(() => jsonResponse(searchBody([rawPhoto("a")])));
    await clientFor(rec).search({ ...QUERY, page: 2, perPage: 5, orientation: "landscape", color: "teal", contentFilter: "low" });
    const [call] = rec.calls;
    expect(call?.headers.get("authorization")).toBe(`Client-ID ${KEY}`);
    expect(`${call?.url.origin}${call?.url.pathname}`).toBe("https://api.unsplash.com/search/photos");
    expect(Object.fromEntries(call?.url.searchParams ?? [])).toEqual({
      query: "Bread",
      page: "2",
      per_page: "5",
      content_filter: "low",
      orientation: "landscape",
      color: "teal",
    });
  });

  it("returns normalized photos with attribution and paging", async () => {
    const rec = recorder(() => jsonResponse(searchBody([rawPhoto("a"), rawPhoto("b")], 40)));
    const result = await clientFor(rec).search(QUERY);
    expect(result.ok && result.value.items.map((photo) => photo.attribution.photographerName)).toEqual(["Ada Baker", "Ada Baker"]);
    expect(result.ok && result.value.total).toBe(40);
  });

  it("treats no results as success, not an error", async () => {
    const rec = recorder(() => jsonResponse(searchBody([])));
    const result = await clientFor(rec).search(QUERY);
    expect(result.ok && result.value.items).toEqual([]);
  });

  it("refuses to call Unsplash without a key", async () => {
    const rec = recorder(() => jsonResponse(searchBody([])));
    const result = await clientFor(rec, () => 0, null).search(QUERY);
    expect(!result.ok && result.error.code).toBe("NOT_CONFIGURED");
    expect(rec.calls).toHaveLength(0);
  });

  it("never puts the key in an error message", async () => {
    const rec = recorder(() => jsonResponse("{}", 401));
    const result = await clientFor(rec).search(QUERY);
    expect(JSON.stringify(result)).not.toContain(KEY);
  });
});

describe("errors", () => {
  const cases: readonly [number, Record<string, string>, UnsplashErrorCode][] = [
    [401, {}, "UNAUTHORIZED"],
    [403, {}, "FORBIDDEN"],
    [403, { "X-Ratelimit-Remaining": "0" }, "RATE_LIMITED"],
    [429, {}, "RATE_LIMITED"],
    [500, {}, "PROVIDER_ERROR"],
  ];

  for (const [status, headers, code] of cases) {
    it(`maps HTTP ${status} ${JSON.stringify(headers)} to ${code}`, async () => {
      const rec = recorder(() => jsonResponse("{}", status, headers));
      const result = await clientFor(rec).search(QUERY);
      expect(!result.ok && result.error.code).toBe(code);
    });
  }

  it("maps a timeout", async () => {
    const rec = recorder(() => Promise.reject(new DOMException("slow", "TimeoutError")));
    const result = await clientFor(rec).search(QUERY);
    expect(!result.ok && result.error.code).toBe("TIMEOUT");
  });

  it("maps a malformed body", async () => {
    const rec = recorder(() => jsonResponse(JSON.stringify({ nope: true })));
    const result = await clientFor(rec).search(QUERY);
    expect(!result.ok && result.error.code).toBe("INVALID_RESPONSE");
  });

  it("stops calling Unsplash for a while after a rate limit", async () => {
    let clock = 0;
    const rec = recorder(() => jsonResponse("{}", 429));
    const client = clientFor(rec, () => clock);
    await client.search(QUERY);
    const second = await client.search({ ...QUERY, query: "cake" });
    expect(!second.ok && second.error.code).toBe("RATE_LIMITED");
    expect(rec.calls).toHaveLength(1);
    clock = 10 * 60_000;
    await client.search({ ...QUERY, query: "pie" });
    expect(rec.calls).toHaveLength(2);
  });
});

describe("caching", () => {
  it("serves an identical search from cache, ignoring case and spacing", async () => {
    const rec = recorder(() => jsonResponse(searchBody([rawPhoto("a")])));
    const client = clientFor(rec);
    await client.search(QUERY);
    await client.search({ ...QUERY, query: "bread" });
    expect(rec.calls).toHaveLength(1);
  });

  it("searches again once the entry expires", async () => {
    let clock = 0;
    const rec = recorder(() => jsonResponse(searchBody([rawPhoto("a")])));
    const client = clientFor(rec, () => clock);
    await client.search(QUERY);
    clock = 11 * 60_000;
    await client.search(QUERY);
    expect(rec.calls).toHaveLength(2);
  });

  it("does not cache failures", async () => {
    let status = 500;
    const rec = recorder(() => jsonResponse(searchBody([rawPhoto("a")]), status));
    const client = clientFor(rec);
    await client.search(QUERY);
    status = 200;
    const retry = await client.search(QUERY);
    expect(retry.ok).toBe(true);
    expect(rec.calls).toHaveLength(2);
  });

  it("shares one request between concurrent identical searches", async () => {
    const rec = recorder(async () => {
      await Bun.sleep(20);
      return jsonResponse(searchBody([rawPhoto("a")]));
    });
    const client = clientFor(rec);
    const results = await Promise.all([client.search(QUERY), client.search(QUERY), client.search(QUERY)]);
    expect(results.every((result) => result.ok)).toBe(true);
    expect(rec.calls).toHaveLength(1);
  });
});

describe("trackDownload", () => {
  const photo = { downloadLocation: "https://api.unsplash.com/photos/a/download?ixid=abc" };

  it("calls the returned download endpoint with the key", async () => {
    const rec = recorder(() => jsonResponse(JSON.stringify({ url: "https://images.unsplash.com/x" })));
    const result = await clientFor(rec).trackDownload(photo);
    expect(result.ok).toBe(true);
    expect(rec.calls[0]?.url.href).toBe(photo.downloadLocation);
    expect(rec.calls[0]?.headers.get("authorization")).toBe(`Client-ID ${KEY}`);
  });

  it("reports a failed trigger", async () => {
    const rec = recorder(() => jsonResponse("{}", 429));
    const result = await clientFor(rec).trackDownload(photo);
    expect(!result.ok && result.error.code).toBe("RATE_LIMITED");
  });
});
