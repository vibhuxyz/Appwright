import { describe, expect, it } from "bun:test";
import { currentTurnRows, currentTurnText } from "../src/worker/current-turn-text";

describe("currentTurnRows", () => {
  it("leaves out an earlier turn's theme row so it cannot force planning again", () => {
    const rows = [
      { role: "user", content: "Build a bakery site", data: null },
      { role: "user", content: "Design system chosen: Soft Glow", data: { intake: true, theme: {} } },
      { role: "assistant", content: "Plan: ...", data: null },
      { role: "user", content: "Make the header pink", data: null },
    ];
    expect(currentTurnRows(rows).map((row) => row.content)).toEqual(["Make the header pink"]);
  });

  it("keeps the theme row that belongs to this turn", () => {
    const rows = [
      { role: "user", content: "Build a bakery site", data: null },
      { role: "user", content: "Design system chosen: Soft Glow", data: { intake: true, theme: {} } },
    ];
    expect(currentTurnRows(rows)).toHaveLength(2);
  });
});

describe("currentTurnText", () => {
  it("returns a single prompt as-is", () => {
    const rows = [{ role: "user", content: "Build a bakery site", data: null }];
    expect(currentTurnText(rows)).toBe("Build a bakery site");
  });

  it("includes earlier turns before this one, intake rows aside", () => {
    const rows = [
      { role: "user", content: "Say hello", data: null },
      { role: "assistant", content: "Hello back", data: null },
      { role: "user", content: "Build a bakery site", data: null },
    ];
    expect(currentTurnText(rows)).toBe("Build a bakery site");
  });

  it("folds in clarifying Q&A for the current turn", () => {
    const rows = [
      { role: "user", content: "Build a bakery site", data: null },
      { role: "assistant", content: "Does it need online ordering?", data: { intake: true } },
      { role: "user", content: "Yes", data: { intake: true } },
    ];
    expect(currentTurnText(rows)).toBe(
      "Build a bakery site\n\nDoes it need online ordering?\n\nYes",
    );
  });
});
