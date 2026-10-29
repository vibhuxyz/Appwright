import { describe, expect, it } from "bun:test";
import { MAX_RUN_STEPS, nextRunSteps } from "../src/features/agent/store/run-steps";

describe("nextRunSteps", () => {
  it("records each new phase once", () => {
    const steps = ["Analyzing request…", "Plan formulated. Building tasks…", "Plan formulated. Building tasks…"].reduce(nextRunSteps, [] as readonly string[]);
    expect(steps).toEqual(["Analyzing request…", "Plan formulated. Building tasks…"]);
  });

  it("skips tool calls, streaming and empty statuses", () => {
    const steps = ["Running edit_file…", "Generating response…", "", "AI is working…"].reduce(nextRunSteps, [] as readonly string[]);
    expect(steps).toEqual([]);
  });

  it("caps the history", () => {
    const details = Array.from({ length: MAX_RUN_STEPS + 5 }, (_, index) => `Step ${index}`);
    const steps = details.reduce(nextRunSteps, [] as readonly string[]);
    expect(steps.length).toBe(MAX_RUN_STEPS);
    expect(steps.at(-1)).toBe(`Step ${MAX_RUN_STEPS + 4}`);
  });
});
