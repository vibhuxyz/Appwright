import { describe, expect, it } from "bun:test";
import { pollUntil } from "../src/waiting";

describe("pollUntil", () => {
  it("resolves as soon as the check returns a value", async () => {
    let calls = 0;
    const outcome = await pollUntil({
      check: async () => (++calls >= 3 ? "done" : null),
      signal: new AbortController().signal,
      timeoutMs: 1_000,
      pollMs: 1,
    });
    expect(outcome).toEqual({ status: "resolved", value: "done" });
  });

  it("times out instead of looping forever", async () => {
    const outcome = await pollUntil({ check: async () => null, signal: new AbortController().signal, timeoutMs: 20, pollMs: 5 });
    expect(outcome.status).toBe("timeout");
  });

  it("reports an abort without throwing", async () => {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 10);
    const outcome = await pollUntil({ check: async () => null, signal: controller.signal, timeoutMs: 5_000, pollMs: 1_000 });
    expect(outcome.status).toBe("aborted");
  });
});
