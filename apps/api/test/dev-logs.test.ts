import { describe, expect, test } from "bun:test";
import { createLogBuffer } from "../src/dev-logs/log-buffer";
import { splitLines } from "../src/dev-logs/split-lines";

describe("splitLines", () => {
  test("keeps the unfinished line pending and strips colour codes", () => {
    const first = splitLines("", "\u001b[32mready\u001b[0m\r\nlist");
    expect(first).toEqual({ lines: ["ready"], pending: "list" });
    expect(splitLines(first.pending, "ening\n")).toEqual({ lines: ["listening"], pending: "" });
  });
});

describe("createLogBuffer", () => {
  test("returns only lines after the cursor and drops the oldest past the cap", () => {
    const buffer = createLogBuffer(3);
    for (const text of ["a", "b", "c", "d"]) buffer.append("stdout", text, "t");
    const all = buffer.since(0);
    expect(all.lines.map((line) => line.text)).toEqual(["b", "c", "d"]);
    expect(all.nextSeq).toBe(4);
    expect(buffer.since(4)).toEqual({ lines: [], nextSeq: 4 });
  });
});
