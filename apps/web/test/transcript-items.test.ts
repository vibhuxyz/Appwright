import { describe, expect, it } from "bun:test";
import { THEME_FONT_NAMES } from "@repo/contracts";
import type { Msg } from "../src/features/agent/schemas/agentSchemas";
import { activityChips, buildTranscriptItems, delegationAgent, findLateQuestions, presentAgentText, retryLabel, summarizeToolGroup } from "../src/features/agent/transcript";
import { parseMessageBlocks } from "../src/features/agent/transcript/message-text/parse-message-blocks";

let nextSeq = 0;
function msg(fields: Partial<Msg> & Pick<Msg, "role" | "type">): Msg {
  nextSeq += 1;
  return { id: `m${nextSeq}`, seq: nextSeq, content: "", data: null, createdAt: "2026-10-26T00:00:00.000Z", ...fields };
}
function call(toolName: string, args: Record<string, unknown>, toolCallId: string): Msg {
  return msg({ role: "assistant", type: "toolCall", content: toolName, data: { toolName, args, toolCallId } });
}
function result(toolCallId: string, content: string): Msg {
  return msg({ role: "tool", type: "toolResponse", content, data: { toolCallId } });
}
const askArgs = {
  questions: [{ label: "Recipient", text: "Where should enquiries go?", options: ["Owner email", "Inbox"], defaultOptionIndex: 0, inputType: "single" }],
};

describe("buildTranscriptItems", () => {
  it("puts each narration line and its tool calls in one agent block", () => {
    const items = buildTranscriptItems([
      msg({ role: "user", type: "text", content: "Build it" }),
      msg({ role: "assistant", type: "text", content: "I'm checking the starter files now." }),
      call("read_file", { path: "src/App.tsx" }, "c1"),
      result("c1", "file"),
      call("list_files", { path: "src" }, "c2"),
      msg({ role: "assistant", type: "text", content: "## Done" }),
    ]);
    expect(items.map((item) => item.kind)).toEqual(["user", "agent", "agent"]);
    const [, narration, summary] = items;
    expect(narration?.kind === "agent" && narration.calls.length).toBe(2);
    expect(narration?.kind === "agent" && narration.isTurnEnd).toBe(false);
    expect(summary?.kind === "agent" && summary.isTurnEnd).toBe(true);
  });

  it("shows ask_user as a question card followed by the reply bubble", () => {
    const items = buildTranscriptItems([
      call("ask_user", askArgs, "c1"),
      msg({ role: "user", type: "text", content: "User skipped", data: { questionReply: { kind: "agent", outcome: "skipped", items: [], moreCount: 0 } } }),
      result("c1", "The user closed the questions without answering."),
    ]);
    expect(items.map((item) => item.kind)).toEqual(["question", "reply"]);
    expect(items[0]?.kind === "question" && items[0].card.status).toBe("skipped");
  });

  it("reads an intake question set's status from its reply", () => {
    const set = { kind: "intake", intro: "Before I start", items: [{ label: "Language", text: "Which language?", options: ["English"] }], moreCount: 0 };
    const waiting = buildTranscriptItems([msg({ role: "assistant", type: "text", data: { questionSet: set } })]);
    expect(waiting[0]?.kind === "question" && waiting[0].card.status).toBe("waiting");
  });
});

describe("verification retries", () => {
  const retry = (content: string) => msg({ role: "user", type: "text", content, data: { verificationRetry: true } });

  it("shows a retry prompt as a status row, not as a message from the user", () => {
    const items = buildTranscriptItems([
      msg({ role: "user", type: "text", content: "Build it" }),
      msg({ role: "assistant", type: "text", content: "## Done" }),
      retry("Verification failed, retrying:\nsrc/a.ts:1:1 bad\nsrc/b.ts:2:2 worse"),
    ]);
    expect(items.map((item) => item.kind)).toEqual(["user", "agent", "retry"]);
    expect(retryLabel("Verification failed, retrying:\nsrc/a.ts:1:1 bad\nsrc/b.ts:2:2 worse")).toBe("Checks found 2 issues: the agent is fixing them");
    expect(retryLabel("Verification failed, retrying:\nonly one")).toBe("Checks found 1 issue: the agent is fixing them");
  });

  it("marks a summary that a retry follows as superseded, and the last summary as the real turn end", () => {
    const items = buildTranscriptItems([
      msg({ role: "assistant", type: "text", content: "First summary" }),
      retry("Verification failed, retrying:\nx"),
      msg({ role: "assistant", type: "text", content: "Second summary" }),
    ]);
    const [first, , last] = items;
    expect(first?.kind === "agent" && first.isSuperseded).toBe(true);
    expect(last?.kind === "agent" && last.isSuperseded).toBe(false);
    expect(last?.kind === "agent" && last.isTurnEnd).toBe(true);
  });

  it("does not let a retry prompt count as a new user prompt for earlier questions", () => {
    const set = { kind: "intake", intro: "Before I start", items: [{ label: "Language", text: "Which language?", options: ["English"] }], moreCount: 0 };
    const items = buildTranscriptItems([msg({ role: "assistant", type: "text", data: { questionSet: set } }), retry("Verification failed, retrying:\nx")]);
    expect(items[0]?.kind === "question" && items[0].card.status).toBe("waiting");
  });
});

describe("summarizeToolGroup", () => {
  it("summarises edits, views and commands in one line", () => {
    const calls = [
      call("write_file", { path: "a.ts" }, "w1"),
      call("edit_file", { path: "b.ts" }, "w2"),
      call("edit_file", { path: "c.ts" }, "w3"),
      call("read_file", { path: "d.ts" }, "r1"),
      call("bash", { command: "bun   run build" }, "b1"),
    ];
    const results = new Map(calls.map((item) => [item.data?.toolCallId, { content: "ok" }]));
    expect(summarizeToolGroup(calls, results)).toEqual({
      icon: "edit",
      label: "Created 1, Edited 2 files · Viewed d.ts · $ bun run build",
      isRunning: false,
      hasFailure: false,
    });
  });

  it("flags running and failed steps", () => {
    const calls = [call("read_file", { path: "a" }, "r1"), call("read_file", { path: "b" }, "r2")];
    const summary = summarizeToolGroup(calls, new Map([["r1", { content: "Error: missing" }]]));
    expect(summary).toMatchObject({ label: "Viewing 2 paths", isRunning: true, hasFailure: true });
  });
});

describe("activity chips", () => {
  it("names a single viewed or created path and a shell command", () => {
    const calls = [
      call("read_file", { path: "app/test_reports/iteration_1.json" }, "r1"),
      call("write_file", { path: "app/memory/PRD.md" }, "w1"),
      call("bash", { argv: ["mkdir", "-p", "/app/memory"] }, "b1"),
    ];
    const chips = activityChips(calls, new Map(calls.map((item) => [item.data?.toolCallId, { content: "ok" }])));
    expect(chips.map((chip) => ({ kind: chip.kind, label: chip.label, path: chip.path }))).toEqual([
      { kind: "file", label: "Created", path: "/app/memory/PRD.md" },
      { kind: "file", label: "Viewed", path: "/app/test_reports/iteration_1.json" },
      { kind: "shell", label: "$ mkdir -p /app/memory", path: undefined },
    ]);
  });

  it("collapses several edits into one chip", () => {
    const calls = [call("write_file", { path: "a.ts" }, "w1"), call("edit_file", { path: "b.ts" }, "w2")];
    const chips = activityChips(calls, new Map());
    expect(chips[0]?.label).toBe("Created 1, Edited 1 files");
  });
});

describe("presentAgentText", () => {
  it("turns a delegation line and a handoff into chips and a summary card", () => {
    expect(delegationAgent("Delegated to UI Agent: Home")).toBe("UI Agent");
    const handoff = msg({
      role: "assistant",
      type: "text",
      content: "Created /app/memory/PRD.md\n\nShop page complete",
      data: { handoff: true, delegation: "Handoff Agent", summaryTitle: "Shop page complete", summaryBullets: ["Verified the shop."], summaryNote: "Prices were not supplied." },
    });
    expect(presentAgentText(handoff)).toMatchObject({
      text: null,
      delegation: "Handoff Agent",
      handoff: { title: "Shop page complete", bullets: ["Verified the shop."], note: "Prices were not supplied.", createdPath: "/app/memory/PRD.md" },
    });
  });
});

describe("parseMessageBlocks", () => {
  it("parses headings, bullet lists and inline code", () => {
    expect(parseMessageBlocks("## Done\r\n- Built `App.tsx`\n- **Checked** it\n\nAll good")).toEqual([
      { kind: "heading", level: 2, segments: [{ kind: "text", text: "Done" }] },
      { kind: "list", items: [
        [{ kind: "text", text: "Built " }, { kind: "code", text: "App.tsx" }],
        [{ kind: "bold", text: "Checked" }, { kind: "text", text: " it" }],
      ] },
      { kind: "paragraph", segments: [{ kind: "text", text: "All good" }] },
    ]);
  });
});

describe("findLateQuestions", () => {
  const skipped = { questionReply: { kind: "agent", outcome: "skipped", items: [], moreCount: 0 } } as const;

  it("offers skipped agent questions until the user sends a new message", () => {
    const messages = [call("ask_user", askArgs, "c1"), msg({ role: "user", type: "text", content: "User skipped", data: skipped })];
    expect(findLateQuestions(messages)).toMatchObject({ kind: "agent", questions: [{ label: "Recipient" }] });
    expect(findLateQuestions([...messages, msg({ role: "user", type: "text", content: "Make it blue" })])).toBeNull();
  });

  it("finds providers from an integration question set", () => {
    const set = { kind: "integration", intro: "Before I build", items: [{ key: "razorpay", label: "Razorpay", text: "How?", options: ["a", "b"] }], moreCount: 0 };
    const messages = [
      msg({ role: "assistant", type: "text", data: { questionSet: set } }),
      msg({ role: "user", type: "text", content: "User skipped", data: { questionReply: { kind: "integration", outcome: "skipped", items: [], moreCount: 0 } } }),
    ];
    expect(findLateQuestions(messages)).toMatchObject({ kind: "integration", providers: ["razorpay"] });
  });
});

describe("plan and design replies", () => {
  const theme = {
    id: "midnight",
    name: "Midnight",
    tagline: "Dark and calm",
    mood: "dark" as const,
    palette: { background: "#0a0a0a", foreground: "#fafafa", card: "#111111", primary: "#7c3aed", primaryForeground: "#ffffff", secondary: "#222222", secondaryForeground: "#fafafa", accent: "#22d3ee", accentForeground: "#001014", muted: "#1a1a1a", mutedForeground: "#a1a1aa", border: "#2a2a2a" },
    fonts: { heading: THEME_FONT_NAMES[0], body: THEME_FONT_NAMES[0] },
    radius: "md" as const,
  };

  it("shows the plan decision and a design card for a persisted theme turn", () => {
    const items = buildTranscriptItems([
      msg({ role: "user", type: "text", content: "x", data: { intake: true, theme, blueprintId: "bp1", planFeedback: ["Add a pricing page"] } }),
    ]);
    expect(items.map((item) => item.kind)).toEqual(["plan-decision", "theme-choice"]);
    expect(items[0]).toMatchObject({ feedback: ["Add a pricing page"], isApproved: true });
    expect(items[1]).toMatchObject({ theme: { name: "Midnight" } });
  });

  it("shows only the design card when no plan was reviewed", () => {
    const items = buildTranscriptItems([msg({ role: "user", type: "text", content: "x", data: { intake: true, theme } })]);
    expect(items.map((item) => item.kind)).toEqual(["theme-choice"]);
  });
});
