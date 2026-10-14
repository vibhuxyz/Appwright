import { describe, expect, it } from "bun:test";
import { isDeniedInMode, requiresApproval } from "../src/permission";

describe("requiresApproval", () => {
  it("never asks approval for read-only tools", () => {
    expect(requiresApproval({ toolName: "read_file", mode: "default" })).toBe(false);
    expect(requiresApproval({ toolName: "list_files", mode: "default" })).toBe(false);
    expect(requiresApproval({ toolName: "grep", mode: "default" })).toBe(false);
  });

  it("asks for write_file and edit_file in default mode", () => {
    expect(requiresApproval({ toolName: "write_file", mode: "default" })).toBe(true);
    expect(requiresApproval({ toolName: "edit_file", mode: "default" })).toBe(true);
  });

  it("auto-allows write_file and edit_file in accept-edits mode", () => {
    expect(requiresApproval({ toolName: "write_file", mode: "accept-edits" })).toBe(false);
    expect(requiresApproval({ toolName: "edit_file", mode: "accept-edits" })).toBe(false);
  });

  it("always asks for bash unless bypass mode", () => {
    expect(requiresApproval({ toolName: "bash", mode: "default" })).toBe(true);
    expect(requiresApproval({ toolName: "bash", mode: "accept-edits" })).toBe(true);
    expect(requiresApproval({ toolName: "bash", mode: "bypass" })).toBe(false);
  });

  it("always asks for git push even in bypass mode", () => {
    expect(
      requiresApproval({
        toolName: "bash",
        mode: "bypass",
        args: { command: "git push origin main" },
      }),
    ).toBe(true);
  });

  it("auto-allows tools listed in allowedTools", () => {
    expect(
      requiresApproval({
        toolName: "write_file",
        mode: "default",
        allowedTools: ["write_file"],
      }),
    ).toBe(false);
    expect(
      requiresApproval({
        toolName: "bash",
        mode: "default",
        allowedTools: ["bash"],
        args: { command: "ls -la" },
      }),
    ).toBe(false);
  });

  it("still asks for dangerous git push even if bash is in allowedTools", () => {
    expect(
      requiresApproval({
        toolName: "bash",
        mode: "default",
        allowedTools: ["bash"],
        args: { command: "git push origin main" },
      }),
    ).toBe(true);
  });
});

describe("isDeniedInMode", () => {
  it("denies every mutating tool in plan mode", () => {
    expect(isDeniedInMode({ toolName: "write_file", mode: "plan" })).toBe(true);
    expect(isDeniedInMode({ toolName: "bash", mode: "plan" })).toBe(true);
  });

  it("keeps read-only tools available in plan mode", () => {
    expect(isDeniedInMode({ toolName: "read_file", mode: "plan" })).toBe(false);
  });

  it("never denies outright outside plan mode", () => {
    expect(isDeniedInMode({ toolName: "bash", mode: "default" })).toBe(false);
  });
});
