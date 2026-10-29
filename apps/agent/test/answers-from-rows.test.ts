import { describe, expect, it } from "bun:test";
import { answersFromRows } from "../src/worker/answers-from-rows";

describe("answersFromRows", () => {
  it("collects typed answers from the reply row and drops skipped ones", () => {
    const rows = [
      { data: null },
      {
        data: {
          intake: true,
          answers: [
            { need: "ordering-mode", answer: "Order online", source: "user" },
            { need: "hours", answer: "9-5", source: "default" },
            { need: "notes", answer: "", source: "skip" },
          ],
        },
      },
    ];
    expect(answersFromRows(rows)).toEqual({ "ordering-mode": "Order online", hours: "9-5" });
  });

  it("returns undefined when no row carries answers", () => {
    expect(answersFromRows([{ data: { intake: true } }, { data: null }])).toBeUndefined();
  });

  it("ignores malformed answer data", () => {
    expect(answersFromRows([{ data: { answers: [{ need: 3 }] } }])).toBeUndefined();
  });
});
