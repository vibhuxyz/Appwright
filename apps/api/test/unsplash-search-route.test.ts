import { afterAll, afterEach, beforeAll, describe, expect, it } from "bun:test";
import express from "express";
import type { Server } from "node:http";
import { unsplashRouter } from "../src/routes/unsplash";

const originalFetch = globalThis.fetch;
const originalKey = process.env.UNSPLASH_ACCESS_KEY;
let server: Server;
let baseUrl: string;
let keyCounter = 0;
let upstreamCalls: { url: string; authorization: string | null }[] = [];

const RAW = {
  id: "abc",
  description: "Bread",
  width: 100,
  height: 100,
  urls: { small: "https://images.unsplash.com/s", regular: "https://images.unsplash.com/r" },
  user: { name: "Ada", links: { html: "https://unsplash.com/@ada" } },
  links: { html: "https://unsplash.com/photos/abc", download_location: "https://api.unsplash.com/photos/abc/download" },
};

function stubUpstream(respond: () => Response): void {
  process.env.UNSPLASH_ACCESS_KEY = `route-test-key-${++keyCounter}`;
  upstreamCalls = [];
  globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input);
    if (!url.startsWith("https://api.unsplash.com")) return originalFetch(input, init);
    upstreamCalls.push({ url, authorization: new Headers(init?.headers).get("authorization") });
    return respond();
  }) as typeof fetch;
}

beforeAll(async () => {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    req.userId = "user-1";
    next();
  });
  app.use(unsplashRouter);
  server = await new Promise<Server>((resolve) => {
    const listening = app.listen(0, () => resolve(listening));
  });
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("no port");
  baseUrl = `http://127.0.0.1:${address.port}`;
});

afterEach(() => {
  globalThis.fetch = originalFetch;
});

afterAll(async () => {
  if (originalKey === undefined) delete process.env.UNSPLASH_ACCESS_KEY;
  else process.env.UNSPLASH_ACCESS_KEY = originalKey;
  await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
});

interface SearchBody {
  readonly error?: { readonly code: string; readonly details: unknown };
  readonly items?: readonly Record<string, unknown>[];
}

async function search(query: string) {
  const response = await fetch(`${baseUrl}/unsplash/search?${query}`);
  return { response, body: (await response.json()) as SearchBody };
}

describe("GET /unsplash/search", () => {
  it("rejects a missing query with the shared error shape", async () => {
    const { response, body } = await search("page=1");
    expect(response.status).toBe(400);
    expect(body.error).toMatchObject({ code: "INVALID_REQUEST", details: {} });
  });

  it("rejects out-of-range paging", async () => {
    expect((await search("query=bread&perPage=500")).response.status).toBe(400);
  });

  it("answers 503 when the server has no access key", async () => {
    delete process.env.UNSPLASH_ACCESS_KEY;
    const { response, body } = await search("query=bread");
    expect(response.status).toBe(503);
    expect(body.error?.code).toBe("NOT_CONFIGURED");
  });

  it("returns normalized photos and sends the Client-ID header, without leaking the key", async () => {
    stubUpstream(() => new Response(JSON.stringify({ total: 1, total_pages: 1, results: [RAW] })));
    const { response, body } = await search("query=bread&orientation=landscape");
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("private, max-age=60");
    expect(body.items?.[0]).toMatchObject({ id: "abc", smallUrl: RAW.urls.small, attribution: { photographerName: "Ada" } });
    expect(upstreamCalls[0]?.authorization).toBe(`Client-ID ${process.env.UNSPLASH_ACCESS_KEY}`);
    expect(JSON.stringify(body)).not.toContain(process.env.UNSPLASH_ACCESS_KEY ?? "never");
  });

  it("returns an empty list for a search with no matches", async () => {
    stubUpstream(() => new Response(JSON.stringify({ total: 0, total_pages: 0, results: [] })));
    const { response, body } = await search("query=zzzzqqqq");
    expect(response.status).toBe(200);
    expect(body.items).toEqual([]);
  });

  it("maps Unsplash 429 to 429 and an upstream auth failure to 502", async () => {
    stubUpstream(() => new Response("{}", { status: 429 }));
    expect((await search("query=limit")).response.status).toBe(429);
    stubUpstream(() => new Response("{}", { status: 401 }));
    expect((await search("query=auth")).response.status).toBe(502);
  });

  it("calls Unsplash once for two identical searches", async () => {
    stubUpstream(() => new Response(JSON.stringify({ total: 1, total_pages: 1, results: [RAW] })));
    await search("query=cached");
    await search("query=CACHED");
    expect(upstreamCalls).toHaveLength(1);
  });
});
