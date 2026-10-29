import { describe, expect, it } from "bun:test";
import { FakeProvider, type AgentEvent, type Runtime } from "@repo/agent-core";
import type { PersistFields } from "../src/worker/persist";
import { decideRepair, parseTestingReview, reviewAfterVerification, runTestingAgent, testingPrompt } from "../src/worker/testing-agent";
import type { TestingEvidence } from "../src/worker/testing-agent";

const runtime: Runtime & { flush(): Promise<void> } = {
  readFile: async () => "export const page = 1;\n",
  writeFile: async () => {},
  listDir: async () => [],
  exec: async () => ({ stdout: "", stderr: "", exitCode: 0 }),
  flush: async () => {},
};

const evidence: TestingEvidence = {
  verification: ["tsc passed", "build passed", "lint passed"],
  routes: ["/", "/shop"],
  changedPaths: ["src/app/shop/page.tsx"],
  findings: ["/shop (mobile) horizontal-overflow: Page scrolls sideways"],
  visualNotes: [],
};

function reviewInput(overrides: Partial<Parameters<typeof reviewAfterVerification>[0]> = {}) {
  return {
    projectId: "project",
    sessionId: "session",
    userId: "user",
    worktreeDir: "/tmp/appwright-testing-agent-not-a-repo",
    verifyResults: [{ ok: true, check: "tsc" as const, errors: [] }],
    sessionModel: "fake-model",
    runtime,
    emit: async () => {},
    signal: new AbortController().signal,
    persist: async () => ({}),
    messages: [],
    browserEnabled: false,
    publish: () => {},
    ...overrides,
  };
}

describe("parseTestingReview", () => {
  it("reads a fenced review and turns a pass with defects into a fail", () => {
    const review = parseTestingReview('```json\n{"status":"pass","notes":"Looks fine","mustFix":["Fix the shop overflow"]}\n```');
    expect(review).toEqual({ status: "fail", notes: "Looks fine", mustFix: ["Fix the shop overflow"] });
  });

  it("returns nothing when the model adds prose around the JSON", () => {
    expect(parseTestingReview('Here is the review {"status":"pass","notes":"","mustFix":[]}')).toBeUndefined();
  });
});

describe("decideRepair", () => {
  it("keeps a measured defect when the agent reports a pass", () => {
    const decision = decideRepair(
      { status: "pass", notes: "ok", mustFix: [] },
      ["[browser] /shop (mobile) horizontal-overflow: Page scrolls sideways"],
    );
    expect(decision.status).toBe("fail");
    expect(decision.mustFix).toEqual(["[browser] /shop (mobile) horizontal-overflow: Page scrolls sideways"]);
  });

  it("does not repair when nothing is listed", () => {
    expect(decideRepair({ status: "pass", notes: "ok", mustFix: [] }, []).mustFix).toEqual([]);
  });
});

describe("testingPrompt", () => {
  it("names the routes and findings and tells the agent not to edit", () => {
    const prompt = testingPrompt(evidence);
    expect(prompt).toContain("/shop");
    expect(prompt).toContain("horizontal-overflow");
    expect(prompt).toContain("you do not edit");
    expect(prompt).toContain("src/app/shop/page.tsx");
  });
});

describe("runTestingAgent", () => {
  it("returns the structured review and rejects a write tool", async () => {
    const events: AgentEvent[] = [];
    const review = await runTestingAgent({
      evidence,
      nowMs: Date.now(),
      review: {
        provider: new FakeProvider([
          { kind: "toolCall", toolCallId: "write-1", toolName: "write_file", args: { path: "src/app/page.tsx", content: "nope" } },
          { kind: "toolCall", toolCallId: "read-1", toolName: "read_file", args: { path: "src/app/shop/page.tsx" } },
          { kind: "text", text: '{"status":"fail","notes":"Shop overflows","mustFix":["Fix the shop page overflow"]}' },
        ]),
        sessionModel: "fake-model",
        runtime,
        emit: (event) => {
          events.push(event);
        },
        signal: new AbortController().signal,
        sessionId: "session",
      },
    });
    expect(review).toEqual({ status: "fail", notes: "Shop overflows", mustFix: ["Fix the shop page overflow"] });
    expect(events.some((event) => event.type === "tool_error" && event.error.includes("unknown tool"))).toBe(true);
    expect(events.some((event) => event.type === "tool_call_end" && event.toolCallId === "read-1")).toBe(true);
  });
});

describe("reviewAfterVerification", () => {
  it("delegates, then repairs once when the agent lists a must-fix item", async () => {
    const published: string[] = [];
    const repairs: string[] = [];
    const persisted: PersistFields[] = [];
    await reviewAfterVerification(reviewInput({
      provider: new FakeProvider([
        { kind: "text", text: '{"status":"fail","notes":"Overflow on the shop page","mustFix":["Fix the shop page overflow"]}' },
      ]),
      publish: (detail) => {
        published.push(detail);
      },
      persist: async (fields) => {
        persisted.push(fields);
        return fields;
      },
      repairTurn: async (prompt) => {
        repairs.push(prompt);
        return true;
      },
    }));
    expect(published).toEqual(["Delegated to Testing Agent", "Testing Agent finished"]);
    expect(repairs).toHaveLength(1);
    expect(repairs[0]).toContain("Fix the shop page overflow");
    expect(persisted.some((row) => row.content.startsWith("Testing Agent: fail."))).toBe(true);
    expect(persisted.some((row) => row.data?.transcriptOnly === true)).toBe(true);
  });

  it("does not repair a clean pass", async () => {
    const repairs: string[] = [];
    const persisted: PersistFields[] = [];
    await reviewAfterVerification(reviewInput({
      provider: new FakeProvider([{ kind: "text", text: '{"status":"pass","notes":"No defect.","mustFix":[]}' }]),
      persist: async (fields) => {
        persisted.push(fields);
        return fields;
      },
      repairTurn: async (prompt) => {
        repairs.push(prompt);
        return true;
      },
    }));
    expect(repairs).toEqual([]);
    expect(persisted.some((row) => row.content.includes("No defect."))).toBe(true);
  });
});
