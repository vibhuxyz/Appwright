import { describe, expect, it } from "bun:test";
import { parseResponseJson } from "./parse-response";

describe("parseResponseJson", () => {
  it("treats 204 and empty bodies as success with no payload", () => {
    expect(parseResponseJson(204, "")).toBeUndefined();
    expect(parseResponseJson(205, "   ")).toBeUndefined();
    expect(parseResponseJson(200, "")).toBeUndefined();
  });

  it("parses JSON bodies", () => {
    expect(parseResponseJson(200, '{"ok":true}')).toEqual({ ok: true });
  });

  it("throws on invalid JSON when a body is present", () => {
    expect(() => parseResponseJson(200, "{")).toThrow();
  });
});
