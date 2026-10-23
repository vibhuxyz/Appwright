import { describe, expect, it } from "bun:test";
import { allowFraming } from "../src/preview";

describe("allowFraming", () => {
  it("drops X-Frame-Options so the preview iframe can render the app", () => {
    const headers = allowFraming({ "x-frame-options": "DENY", "content-type": "text/html" });
    expect(headers).toEqual({ "content-type": "text/html" });
  });

  it("removes only the frame-ancestors directive from a CSP", () => {
    const headers = allowFraming({
      "content-security-policy": "default-src 'self'; frame-ancestors 'none'; img-src *",
    });
    expect(headers["content-security-policy"]).toBe("default-src 'self'; img-src *");
  });

  it("drops a CSP that only restricted framing", () => {
    expect(allowFraming({ "content-security-policy": "frame-ancestors 'self'" })).toEqual({});
  });

  it("leaves other headers untouched", () => {
    const headers = allowFraming({ "cache-control": "no-store", "set-cookie": ["a=1"] });
    expect(headers).toEqual({ "cache-control": "no-store", "set-cookie": ["a=1"] });
  });
});
