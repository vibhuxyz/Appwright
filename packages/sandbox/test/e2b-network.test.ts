import { describe, expect, it } from "bun:test";
import { ALL_TRAFFIC } from "e2b";
import {
  EGRESS_NETWORK,
  SUPERVISOR_RUN_OPTS,
  WORKSPACE_SNAPSHOT_COMMAND,
} from "../src/providers/e2b-provider";

describe("E2B egress network", () => {
  it("denies all outbound traffic except the npm/pip/GitHub allowlist", () => {
    expect(EGRESS_NETWORK.denyOut).toEqual([ALL_TRAFFIC]);
    expect(EGRESS_NETWORK.allowOut).toContain("registry.npmjs.org");
    expect(EGRESS_NETWORK.allowOut).toContain("github.com");
    expect(EGRESS_NETWORK.allowOut).toContain("pypi.org");
  });
});

describe("E2B supervisor process", () => {
  it("disables the 60s command timeout so the background supervisor outlives the first minute", () => {
    expect(SUPERVISOR_RUN_OPTS.background).toBe(true);
    expect(SUPERVISOR_RUN_OPTS.timeoutMs).toBe(0);
  });
});

describe("E2B workspace snapshot", () => {
  it("sets a git identity before the baseline commit", () => {
    expect(WORKSPACE_SNAPSHOT_COMMAND).toContain("git config user.email agent@appwright.local");
    expect(WORKSPACE_SNAPSHOT_COMMAND).toContain("git config user.name Appwright");
    expect(WORKSPACE_SNAPSHOT_COMMAND).toContain("safe.directory /workspace");
    expect(WORKSPACE_SNAPSHOT_COMMAND).toContain("--allow-empty");
  });
});

