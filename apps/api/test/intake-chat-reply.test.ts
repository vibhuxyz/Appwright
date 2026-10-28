import { describe, expect, it } from "bun:test";
import { FakeProvider, type Provider } from "@repo/agent-core";
import { intakeAction } from "../src/intake";
import { promptKind } from "../src/intake/prompt-kind";
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

describe("promptKind", () => {
  it("answers a greeting without calling the model", async () => {
    expect(await promptKind("hy how are you", throwingProvider("must not be called"))).toBe("chat");
  });

  it("treats a model chat verdict as chat", async () => {
    const provider = new FakeProvider([{ kind: "text", text: CHAT_DECISION }]);
    expect(await promptKind("what can you actually do for me", provider)).toBe("chat");
  });

  it("falls back to keywords when the model is down", async () => {
    expect(await promptKind("build a bakery website", throwingProvider("503"))).toBe("new-app");
    expect(await promptKind("tell me a joke about cats", throwingProvider("503"))).toBe("other");
  });
});

describe("intakeAction chat", () => {
  it("replies to chat even in a project that already has an app", () => {
    expect(intakeAction({ prompt: "thanks", isFollowUp: true, isNewApp: false, isChat: true })).toBe("reply");
  });

  it("never replies to a repair prompt", () => {
    const prompt = "fix why getting this error, app is not starting";
    expect(intakeAction({ prompt, isFollowUp: false, isNewApp: false, isChat: true })).toBe("send");
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
