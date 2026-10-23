import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { existsSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { exploreApp, type ExploreReport } from "../src/explore";
import { launchPlaywrightSession, type BrowserSession } from "../src/session";

const FILLER = "A page with enough visible words to count as rendered content for the empty page rule.";

const PAGES: Readonly<Record<string, string>> = {
  "/": `<main><h1>Home</h1><p>${FILLER}</p><a href="/menu">Menu</a> <a href="/ghost">Ghost</a></main>`,
  "/menu": `<main><h1>Menu</h1><p>${FILLER}</p><div style="width:900px;height:20px;background:#ccc">wide</div><img src="/missing.png" alt="missing"></main>`,
  "/boom": `<main><h1>Boom</h1><p>${FILLER}</p><script>throw new Error("planted runtime bug")</script></main>`,
  "/api-fail": `<main><h1>Orders</h1><p>${FILLER}</p><script>fetch("/api/orders")</script></main>`,
  "/empty": "<main></main>",
};

const ROUTES = Object.keys(PAGES);

let server: ReturnType<typeof Bun.serve>;
let session: BrowserSession;
let outputDir: string;

function findingsOf(report: ExploreReport, kind: string, route: string) {
  return report.findings.filter((finding) => finding.kind === kind && finding.route === route);
}

beforeAll(async () => {
  server = Bun.serve({
    port: 0,
    fetch(request) {
      const { pathname } = new URL(request.url);
      if (pathname === "/api/orders") return new Response("fail", { status: 500 });
      const body = PAGES[pathname];
      if (body === undefined) return new Response("not found", { status: 404 });
      return new Response(`<!doctype html><html lang="en"><head><title>t</title></head><body>${body}</body></html>`, {
        headers: { "content-type": "text/html" },
      });
    },
  });
  session = await launchPlaywrightSession();
  outputDir = await mkdtemp(join(tmpdir(), "browser-check-"));
});

afterAll(async () => {
  await session.close();
  await server.stop(true);
  await rm(outputDir, { recursive: true, force: true });
});

describe("exploreApp against a fixture with planted bugs", () => {
  it("finds every planted bug and leaves the healthy page clean", async () => {
    const report = await exploreApp({ baseUrl: `http://127.0.0.1:${server.port}`, routes: ROUTES, session, outputDir });

    expect(findingsOf(report, "horizontal-overflow", "/menu").map((finding) => finding.viewport)).toEqual([
      "mobile",
      "tablet",
    ]);
    expect(findingsOf(report, "broken-image", "/menu")).toHaveLength(3);
    expect(findingsOf(report, "page-error", "/boom")[0]?.message).toContain("planted runtime bug");
    expect(findingsOf(report, "http-error", "/api-fail")[0]?.message).toBe("Request returned 500: /api/orders");
    expect(findingsOf(report, "empty-page", "/empty")).toHaveLength(3);
    expect(findingsOf(report, "broken-link", "/")[0]?.message).toContain("/ghost");
    expect(report.findings.filter((finding) => finding.route === "/" && finding.kind !== "broken-link")).toEqual([]);
    expect(report.pagesChecked).toBe(ROUTES.length * 3);
  }, 90_000);

  it("takes a screenshot for every page that had a problem, and none for clean pages", async () => {
    const report = await exploreApp({ baseUrl: `http://127.0.0.1:${server.port}`, routes: ROUTES, session, outputDir });

    expect(report.screenshots).toContain("menu-mobile.png");
    expect(report.screenshots).toContain("boom-desktop.png");
    expect(report.screenshots.every((name) => existsSync(join(outputDir, name)))).toBe(true);
    expect(report.screenshots.some((name) => name.startsWith("home-"))).toBe(false);
  }, 90_000);

  it("gives identical results when run twice with no changes", async () => {
    const options = { baseUrl: `http://127.0.0.1:${server.port}`, routes: ROUTES, session, outputDir };
    const first = await exploreApp(options);
    const second = await exploreApp(options);

    expect(second.findings).toEqual(first.findings);
    expect(second.screenshots).toEqual(first.screenshots);
  }, 180_000);
});
