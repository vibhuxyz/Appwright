import { describe, expect, it } from "bun:test";
import type { MessageRow } from "@repo/agent-core";
import { historyMessages } from "../src/worker/history";

const AT = new Date("2026-10-27T00:00:00.000Z");
const IMAGE = { name: "hero.png", mimeType: "image/png", type: "image" as const, sizeBytes: 4_900_000, dataUrl: `data:image/png;base64,${"A".repeat(1000)}`, status: "COMPLETED" as const };
const REASONING = { reasoningContent: "long reasoning ".repeat(100) };

function row(seq: number, fields: Partial<MessageRow>): MessageRow {
  return { id: `m${seq}`, sessionId: "s1", seq, role: "user", type: "text", content: "", data: {}, createdAt: AT, ...fields };
}

const rows: MessageRow[] = [
  row(0, { content: "Build a hiring site", data: { attachments: [IMAGE] } }),
  row(1, { role: "assistant", type: "toolCall", content: "read_file", data: { toolCallId: "c1", toolName: "read_file", args: { path: "src/app/page.tsx" }, providerMeta: REASONING } }),
  row(2, { role: "tool", type: "toolResponse", content: "page source", data: { toolCallId: "c1" } }),
  row(3, { role: "assistant", content: "Built the hiring site.", data: { providerMeta: REASONING } }),
  row(4, { content: "Continue building the remaining tasks" }),
  row(5, { role: "assistant", type: "toolCall", content: "read_file", data: { toolCallId: "c2", toolName: "read_file", args: { path: "src/env.ts" }, providerMeta: REASONING } }),
  row(6, { role: "tool", type: "toolResponse", content: "env source", data: { toolCallId: "c2" } }),
];

describe("historyMessages", () => {
  const messages = historyMessages(rows);

  it("keeps only the text of earlier turns: no old tool calls, results, images or reasoning", () => {
    const earlier = messages.slice(0, 2);
    expect(earlier.map((message) => message.type)).toEqual(["text", "text"]);
    expect(earlier[0]).toEqual({
      role: "user",
      type: "text",
      content: "Build a hiring site\n\n[Attached in an earlier turn: hero.png (image). Its content was used then; ask the user to attach it again if you need to see it.]",
    });
    expect(earlier[1]).toEqual({ role: "assistant", type: "text", content: "Built the hiring site." });
  });

  it("keeps the current turn whole, including its reasoning for DeepSeek's tool loop", () => {
    const current = messages.slice(2);
    expect(current.map((message) => message.type)).toEqual(["text", "toolCall", "toolResponse"]);
    const sent = JSON.stringify(messages);
    expect(sent.match(/reasoningContent/g)).toHaveLength(1);
    expect(sent).not.toContain("base64");
    expect(sent).not.toContain("page source");
    expect(sent).toContain("env source");
  });

  it("leaves a single-turn session untouched", () => {
    expect(historyMessages(rows.slice(0, 3)).map((message) => message.type)).toEqual(["text", "toolCall", "toolResponse"]);
  });
});

describe("historyMessages drops what the next turn does not need", () => {
  it("keeps the last two turns and leaves older requests out of the message list", () => {
    const sent = JSON.stringify(historyMessages([
      row(0, { content: "Build a hiring site" }),
      row(1, { role: "assistant", content: "Built the hiring site." }),
      row(2, { content: "Add the dashboard" }),
      row(3, { role: "assistant", content: "Added the dashboard." }),
      row(4, { content: "Make the hero bigger" }),
    ]));
    expect(sent).not.toContain("hiring site");
    expect(sent).toContain("Add the dashboard");
    expect(sent).toContain("Make the hero bigger");
  });

  it("drops thanks and older verification transcripts", () => {
    const sent = JSON.stringify(historyMessages([
      row(0, { content: "Build the home page" }),
      row(1, { role: "assistant", content: "Built the home page." }),
      row(2, { content: "thanks" }),
      row(3, { role: "assistant", content: "Glad it helped." }),
      row(4, { content: "Verification failed, retrying:\nerror TS2304" , data: { verificationRetry: true } }),
      row(5, { content: "Add a pricing page" }),
    ]));
    expect(sent).not.toContain("thanks");
    expect(sent).not.toContain("Glad it helped");
    expect(sent).not.toContain("TS2304");
    expect(sent).toContain("Build the home page");
    expect(sent).toContain("Add a pricing page");
  });
});

describe("historyMessages with a reverted turn", () => {
  it("drops the reverted turn and its marker, keeping the turns around it", () => {
    const marker = {
      transcriptOnly: true,
      revertMarker: true,
      revertedTurn: { sha: "a".repeat(40), revertSha: "b".repeat(40), fromSeq: 2, toSeq: 3, fromAt: AT.toISOString(), toAt: AT.toISOString(), mainUpdated: true },
    };
    const sent = JSON.stringify(historyMessages([
      row(0, { content: "Build the home page" }),
      row(1, { role: "assistant", content: "Built the home page." }),
      row(2, { content: "Add a student dashboard" }),
      row(3, { role: "assistant", content: "Built the dashboard." }),
      row(4, { role: "assistant", content: "↩️ Undid the turn", data: marker }),
      row(5, { content: "Make the hero bigger" }),
    ]));
    expect(sent).toContain("Build the home page");
    expect(sent).toContain("Make the hero bigger");
    expect(sent).not.toContain("dashboard");
    expect(sent).not.toContain("Undid the turn");
  });
});
