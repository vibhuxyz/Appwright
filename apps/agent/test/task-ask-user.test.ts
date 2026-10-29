import { describe, expect, it } from "bun:test";
import type { Runtime } from "@repo/agent-core";
import { AGENT_WAIT_LIMITS } from "@repo/contracts";
import {
  createTaskAskUserTool,
  TASK_ASK_USER_WAIT_MS,
  type TaskInteractiveContext,
} from "../src/worker/interactive-tools/task-ask-user";

function context(): TaskInteractiveContext {
  return {
    projectId: "p1",
    sessionId: "s1",
    worktreeSessionId: "s1",
    signal: new AbortController().signal,
    publishFrame: async () => {},
    publishStatus: () => {},
    refreshRuntimeEnv: async () => {},
    persist: async () => undefined,
  };
}

const TOOL_CONTEXT = { runtime: {} as Runtime };

const SECRET_QUESTION = {
  questions: [
    {
      label: "Key",
      text: "Paste your API key",
      options: ["I have one", "Skip"],
      defaultOptionIndex: 1,
      inputType: "single",
    },
  ],
};

describe("createTaskAskUserTool", () => {
  it("allows one question round per build and refuses the rest", async () => {
    const tool = createTaskAskUserTool(context());
    expect(await tool.execute(SECRET_QUESTION, TOOL_CONTEXT)).toContain("never ask for keys");
    expect(await tool.execute(SECRET_QUESTION, TOOL_CONTEXT)).toContain("Do not ask again");
  });

  it("does not spend the round on invalid arguments", async () => {
    const tool = createTaskAskUserTool(context());
    expect(await tool.execute({ questions: [] }, TOOL_CONTEXT)).toContain("invalid ask_user arguments");
    expect(await tool.execute(SECRET_QUESTION, TOOL_CONTEXT)).toContain("never ask for keys");
  });

  it("waits far less than the main chat loop", () => {
    expect(TASK_ASK_USER_WAIT_MS).toBe(60_000);
    expect(TASK_ASK_USER_WAIT_MS).toBeLessThan(AGENT_WAIT_LIMITS.askUserMs);
    expect(TASK_ASK_USER_WAIT_MS).toBeGreaterThanOrEqual(AGENT_WAIT_LIMITS.minimumWaitMs);
  });
});
