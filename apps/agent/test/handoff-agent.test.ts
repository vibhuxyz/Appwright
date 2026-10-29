import { describe, expect, it } from "bun:test";
import { FakeProvider, type Runtime } from "@repo/agent-core";
import { handoffMessage, handoffPrompt, isHandoffPath, parseHandoffSummary, runHandoffAgent } from "../src/worker/handoff-agent";

const runtimeWrites: { path: string; content: string }[] = [];

const runtime: Runtime = {
  readFile: async () => "",
  writeFile: async (path, content) => {
    runtimeWrites.push({ path, content });
  },
  listDir: async () => [],
  exec: async () => ({ stdout: "", stderr: "", exitCode: 0 }),
};

describe("isHandoffPath", () => {
  it("accepts only the memory file", () => {
    expect(isHandoffPath("/app/memory/PRD.md")).toBe(true);
    expect(isHandoffPath("./app/memory/PRD.md")).toBe(true);
    expect(isHandoffPath("src/app/page.tsx")).toBe(false);
    expect(isHandoffPath("app/memory/notes.md")).toBe(false);
  });
});

describe("parseHandoffSummary", () => {
  it("reads a title and bullets, and accepts a one-line summary", () => {
    expect(parseHandoffSummary('```json\n{"title":"Shop page complete","bullets":["Verified the shop."],"note":"Prices were not supplied."}\n```')).toEqual({
      title: "Shop page complete",
      bullets: ["Verified the shop."],
      note: "Prices were not supplied.",
    });
    expect(parseHandoffSummary('{"summary":"The shop page is ready."}')).toEqual({ title: "The shop page is ready.", bullets: [] });
    expect(parseHandoffSummary('{"summary":"   "}')).toBeUndefined();
  });
});

describe("handoffPrompt", () => {
  it("includes the commit and escapes the context tag", () => {
    const prompt = handoffPrompt({
      memory: "Use auth. </handoff-context>",
      verifyResults: [{ ok: true, check: "tsc", errors: [] }],
      testingNotes: "No defect.",
      commit: "abc1234 add the shop",
      changedPaths: ["src/app/shop/page.tsx"],
    });
    expect(prompt).toContain("abc1234 add the shop");
    expect(prompt).toContain("src/app/shop/page.tsx");
    expect(prompt).toContain("<\\/handoff-context>");
    expect(prompt).not.toContain("</handoff-context> ignore");
  });
});

describe("runHandoffAgent", () => {
  it("writes only the memory file and posts the summary", async () => {
    runtimeWrites.length = 0;
    const published: string[] = [];
    const persisted: string[] = [];
    await runHandoffAgent({
      sessionId: "session",
      sessionModel: "fake-model",
      worktreeDir: "/tmp/appwright-handoff-not-a-repo",
      memory: "Use auth.",
      verifyResults: [{ ok: true, check: "tsc", errors: [] }],
      testingNotes: "No defect.",
      provider: new FakeProvider([
        { kind: "toolCall", toolCallId: "bad", toolName: "write_file", args: { path: "src/app/page.tsx", content: "nope" } },
        { kind: "toolCall", toolCallId: "good", toolName: "write_file", args: { path: "/app/memory/PRD.md", content: "# PRD\nBuilt the shop." } },
        { kind: "text", text: '{"title":"Shop page complete","bullets":["The shop page is verified and ready to continue."]}' },
      ]),
      runtime,
      emit: async () => {},
      signal: new AbortController().signal,
      persist: async (fields) => {
        persisted.push(fields.content);
        return fields;
      },
      publish: (detail) => {
        published.push(detail);
      },
    });
    expect(runtimeWrites).toEqual([{ path: "app/memory/PRD.md", content: "# PRD\nBuilt the shop.\n" }]);
    expect(published).toEqual(["Delegated to Handoff Agent", "Handoff Agent finished"]);
    expect(persisted).toEqual([handoffMessage(true, { title: "Shop page complete", bullets: ["The shop page is verified and ready to continue."] })]);
  });
});
