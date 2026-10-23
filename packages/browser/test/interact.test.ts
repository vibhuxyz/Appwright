import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { existsSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { exploreApp, type ExploreReport } from "../src/explore";
import { launchPlaywrightSession, type BrowserSession } from "../src/session";

const SUBMIT_SCRIPT = (endpoint: string, success: string) => `<p id="out"></p><script>
document.getElementById("f").addEventListener("submit", async (event) => {
  event.preventDefault();
  const response = await fetch("${endpoint}", { method: "POST", body: new FormData(event.target) });
  document.getElementById("out").textContent = response.ok ? "${success}" : "The request failed";
});
</script>`;

const FILLER = "<p>This page has enough visible text to count as rendered for the empty page rule.</p>";

const PAGES: Readonly<Record<string, string>> = {
  "/contact": `<main><h1>Contact</h1>${FILLER}<form id="f"><h2>Contact us</h2>
    <label>Name <input name="name" required></label>
    <label>Email <input type="email" name="email" required></label>
    <label>Message <textarea name="message" required></textarea></label>
    <button type="submit">Send</button></form>${SUBMIT_SCRIPT("/api/contact", "Thanks, we got your message")}</main>`,
  "/signup-500": `<main><h1>Join</h1>${FILLER}<form id="f"><h2>Join us</h2>
    <label>Email <input type="email" name="email" required></label>
    <button type="submit">Join</button></form>${SUBMIT_SCRIPT("/api/signup", "Welcome")}</main>`,
  "/accepts-bad": `<main><h1>Save</h1>${FILLER}<form id="f" novalidate><h2>Save email</h2>
    <label>Email <input type="email" name="email" required></label>
    <button type="submit">Save</button></form>${SUBMIT_SCRIPT("/api/save", "Saved")}</main>`,
  "/dead-form": `<main><h1>Search</h1>${FILLER}<form onsubmit="return false"><h2>Search</h2>
    <label>Query <input name="q"></label><button>Go</button></form></main>`,
  "/no-submit": `<main><h1>Notes</h1>${FILLER}<form><h2>Notes</h2><label>Note <input name="note"></label></form></main>`,
  "/buttons": `<main><h1>Buttons</h1>${FILLER}
    <button type="button" onclick="document.getElementById('d').hidden = false">Show details</button>
    <p id="d" hidden>Details are now visible</p>
    <button type="button" onclick="throw new Error('crash on click')">Crash me</button>
    <button type="button" onclick="fetch('/api/deleted')">Delete everything</button>
    <button type="button" onclick="fetch('/api/data')">Load data</button></main>`,
};

const ROUTES = Object.keys(PAGES);
const FORM_KINDS = new Set(["form-server-error", "form-accepts-empty", "form-accepts-invalid", "form-no-response", "form-no-submit"]);

let server: ReturnType<typeof Bun.serve>;
let session: BrowserSession;
let outputDir: string;
let report: ExploreReport;
const calls: string[] = [];

function kindsFor(route: string): string[] {
  return [...new Set(report.findings.filter((finding) => finding.route === route).map((finding) => finding.kind))].sort();
}

beforeAll(async () => {
  server = Bun.serve({
    port: 0,
    fetch(request) {
      const { pathname } = new URL(request.url);
      if (pathname.startsWith("/api/")) calls.push(`${request.method} ${pathname}`);
      if (pathname === "/api/signup" || pathname === "/api/data") return new Response("boom", { status: 500 });
      if (pathname.startsWith("/api/")) return new Response("ok");
      const body = PAGES[pathname];
      if (body === undefined) return new Response("not found", { status: 404 });
      return new Response(`<!doctype html><html lang="en"><head><title>t</title></head><body>${body}</body></html>`, {
        headers: { "content-type": "text/html" },
      });
    },
  });
  session = await launchPlaywrightSession();
  outputDir = await mkdtemp(join(tmpdir(), "browser-interact-"));
  report = await exploreApp({ baseUrl: `http://127.0.0.1:${server.port}`, routes: ROUTES, session, outputDir });
}, 240_000);

afterAll(async () => {
  await session.close();
  await server.stop(true);
  await rm(outputDir, { recursive: true, force: true });
});

describe("interaction testing against a fixture with planted form and button bugs", () => {
  it("leaves a correct form alone", () => {
    expect(kindsFor("/contact").filter((kind) => FORM_KINDS.has(kind) || kind === "interaction-error")).toEqual([]);
    expect(calls.filter((call) => call === "POST /api/contact").length).toBeGreaterThan(0);
  });

  it("catches a form whose server answers 500", () => {
    expect(kindsFor("/signup-500")).toContain("form-server-error");
  });

  it("catches a form that accepts an empty or invalid submission", () => {
    expect(kindsFor("/accepts-bad")).toEqual(expect.arrayContaining(["form-accepts-empty", "form-accepts-invalid"]));
  });

  it("catches a form that does nothing when submitted", () => {
    expect(kindsFor("/dead-form")).toContain("form-no-response");
  });

  it("warns about a form with no submit button", () => {
    const finding = report.findings.find((candidate) => candidate.route === "/no-submit" && candidate.kind === "form-no-submit");
    expect(finding?.severity).toBe("warning");
  });

  it("clicks safe buttons, reports the ones that throw or hit a 500, and never clicks a destructive one", () => {
    const messages = report.findings.filter((finding) => finding.route === "/buttons").map((finding) => finding.message);
    expect(messages.some((message) => message.includes('Clicking "Crash me"') && message.includes("crash on click"))).toBe(true);
    expect(messages.some((message) => message.includes('Clicking "Load data"') && message.includes("500"))).toBe(true);
    expect(messages.some((message) => message.includes("Show details"))).toBe(false);
    expect(calls).not.toContain("GET /api/deleted");
    expect(report.buttonsClicked).toBeGreaterThanOrEqual(3);
  });

  it("takes screenshots of the interaction failures and counts the forms it tested", () => {
    const interactionShots = report.screenshots.filter((name) => name.includes("-form-") || name.includes("-click-"));
    expect(interactionShots.length).toBeGreaterThan(0);
    expect(interactionShots.every((name) => existsSync(join(outputDir, name)))).toBe(true);
    expect(report.formsTested).toBeGreaterThanOrEqual(4);
  });
});
