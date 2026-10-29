import { describe, expect, it } from "bun:test";
import { FakeProvider, type Provider } from "@repo/agent-core";
import { intakeAction, runIntakeRound } from "../src/intake";
import { replyToChat } from "../src/intake/reply-to-chat";

function throwingProvider(message: string): Provider {
  return {
    model: "fake",
    async *stream() {
      throw new Error(message);
    },
  };
}

const CHAT_DECISION = JSON.stringify({
  intent: "chat", changeType: "unknown", risk: "low", route: "none",
  component: "none", complexity: 0, ambiguity: 0, confidence: 0.95,
});

const TWEAK_DECISION = JSON.stringify({
  intent: "modify", changeType: "style", risk: "low", route: "none",
  component: "none", complexity: 1, ambiguity: 0, confidence: 0.9,
});

function roundFor(prompt: string, provider: Provider) {
  return runIntakeRound({ request: { prompt }, projectId: null, provider, onProgress: () => {} });
}

describe("intakeAction", () => {
  it("replies in chat only when the session can take a chat reply", () => {
    expect(intakeAction("reply", { canReplyInChat: true })).toBe("reply");
    expect(intakeAction("reply", { canReplyInChat: false })).toBe("send");
  });

  it("maps plan and direct sends", () => {
    expect(intakeAction("plan", { canReplyInChat: true })).toBe("plan");
    expect(intakeAction("send-direct", { canReplyInChat: true })).toBe("send");
  });
});

describe("runIntakeRound", () => {
  it("sends a chat verdict when there is no project to reply in", async () => {
    const round = await roundFor("what can you actually do for me", new FakeProvider([{ kind: "text", text: CHAT_DECISION }]));
    expect(round.action).toBe("send");
    expect(round.analysis?.suggestedPath).toBe("reply");
  });

  it("sends a small tweak with its analysis attached", async () => {
    const round = await roundFor("make the button blue", new FakeProvider([{ kind: "text", text: TWEAK_DECISION }]));
    expect(round.action).toBe("send");
    expect(round.questions).toEqual([]);
    expect(round.analysis?.intent).toBe("modify");
  });

  it("sends a pasted error straight to the agent even when the model is down", async () => {
    const round = await roundFor("TypeError: x is undefined, fix it", throwingProvider("503"));
    expect(round.action).toBe("send");
    expect(round.analysis?.source).toBe("fallback");
    expect(round.analysis?.intent).toBe("debug");
  });
});

describe("replyToChat", () => {
  it("returns the trimmed model reply", async () => {
    const provider = new FakeProvider([{ kind: "text", text: "  Hi! What would you like to build?  " }]);
    expect(await replyToChat("hy", provider)).toEqual({ kind: "replied", text: "Hi! What would you like to build?" });
  });

  it("reports a provider failure instead of throwing", async () => {
    const result = await replyToChat("hy", throwingProvider("503 unavailable"));
    expect(result).toEqual({ kind: "failed", message: "503 unavailable" });
  });

  it("reports an empty reply as a failure", async () => {
    const result = await replyToChat("hy", new FakeProvider([{ kind: "text", text: "   " }]));
    expect(result.kind).toBe("failed");
  });
});
