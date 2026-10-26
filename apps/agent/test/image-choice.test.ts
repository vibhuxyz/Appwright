import { describe, expect, it } from "bun:test";
import { isAutoImageChoice } from "../src/worker/image-choice";

describe("isAutoImageChoice", () => {
  it("is true when the approval row carries the auto image choice", () => {
    expect(isAutoImageChoice([{ data: {} }, { data: { intake: true, blueprintId: "b1", imageChoice: "auto" } }])).toBe(true);
  });

  it("is false for rows without it, null data, or another value", () => {
    expect(isAutoImageChoice([{ data: null }, { data: { blueprintId: "b1" } }, { data: { imageChoice: "choose" } }])).toBe(false);
  });
});
