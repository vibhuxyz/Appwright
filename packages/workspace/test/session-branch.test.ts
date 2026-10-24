import { expect, test } from "bun:test";
import { sessionBranchName, worktreeSessionIdOf } from "../src/session-branch";

test("sessionBranchName prefixes the worktree session id with agent/", () => {
  expect(sessionBranchName("cmvkx5abd0003k7nnyx1")).toBe(
    "agent/cmvkx5abd0003k7nnyx1",
  );
});

test("a session without a branch works in its own worktree", () => {
  expect(worktreeSessionIdOf({ id: "first", branch: null })).toBe("first");
});

test("a session on its own branch works in its own worktree", () => {
  expect(worktreeSessionIdOf({ id: "first", branch: "agent/first" })).toBe(
    "first",
  );
});

test("a new chat inherits the worktree named by its branch", () => {
  expect(worktreeSessionIdOf({ id: "second", branch: "agent/first" })).toBe(
    "first",
  );
});

test("a branch that is not an agent branch falls back to the session id", () => {
  expect(worktreeSessionIdOf({ id: "second", branch: "main" })).toBe("second");
  expect(worktreeSessionIdOf({ id: "second", branch: "agent/../escape" })).toBe(
    "second",
  );
  expect(worktreeSessionIdOf({ id: "second", branch: "agent/" })).toBe(
    "second",
  );
});
