import { describe, expect, it } from "bun:test";
import { codingModelFor, codingProfileFor, delegatedStatus, withCodingBrief } from "../src/coding-agent";

describe("codingProfileFor", () => {
  it("routes pages and auth to different agents and leaves scaffold general", () => {
    expect(codingProfileFor("PAGE").label).toBe("UI Agent");
    expect(codingProfileFor("app_shell").id).toBe("ui");
    expect(codingProfileFor("auth").envKey).toBe("AUTH_AGENT_MODEL");
    expect(codingProfileFor("payment").id).toBe("integration");
    expect(codingProfileFor("schema").id).toBe("data");
    expect(codingProfileFor("scaffold").brief).toBe("");
  });
});

describe("codingModelFor", () => {
  it("uses the specialist model when configured and the session model otherwise", () => {
    const page = codingProfileFor("page");
    expect(codingModelFor(page, "session-model", { UI_AGENT_MODEL: "fast-ui" })).toBe("fast-ui");
    expect(codingModelFor(page, "session-model", {})).toBe("session-model");
  });

  it("routes Auto to a UI-tier model when the override is unset", () => {
    const page = codingProfileFor("page");
    const env = { GEMINI_API_KEY: "x", OPENAI_API_KEY: "x" };
    expect(codingModelFor(page, "auto", env, { plan: "MAX" })).toBe("gemini-3.1-pro-preview");
    expect(codingModelFor(page, "auto", { ...env, UI_AGENT_MODEL: "fast-ui" }, { plan: "MAX" })).toBe("fast-ui");
  });
});

describe("withCodingBrief", () => {
  it("prefixes a specialist line and leaves a general task unchanged", () => {
    expect(withCodingBrief("You are the UI agent.", "Task: Home")).toBe("You are the UI agent.\n\nTask: Home");
    expect(withCodingBrief("", "Task: Home")).toBe("Task: Home");
  });
});

describe("delegatedStatus", () => {
  it("names the agents and the running tasks", () => {
    expect(delegatedStatus([])).toBe("Building…");
    expect(delegatedStatus([
      { title: "Home", label: "UI Agent" },
      { title: "Login", label: "Auth Agent" },
    ])).toBe("Delegated to Auth Agent, UI Agent: Home, Login");
  });
});
