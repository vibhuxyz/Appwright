import { describe, expect, it } from "bun:test";
import { maskSecretValue } from "../src/lib/secret-mask";

describe("maskSecretValue", () => {
  it("masks short values completely", () => {
    expect(maskSecretValue("abc")).toBe("••••");
    expect(maskSecretValue("abcd")).toBe("••••");
  });

  it("masks medium values showing head and tail", () => {
    expect(maskSecretValue("123456")).toBe("1••••6");
    expect(maskSecretValue("12345678")).toBe("1••••8");
  });

  it("masks long values showing 3-char prefix and suffix", () => {
    expect(maskSecretValue("sk_live_1234567890abcdef")).toBe("sk_••••••••def");
  });

  it("redacts credentials in connection URIs", () => {
    const uri = "mongodb://user:supersecretpassword@cluster0.abc.mongodb.net/testdb?authSource=admin";
    const masked = maskSecretValue(uri);
    expect(masked).not.toContain("supersecretpassword");
    expect(masked).toContain("mongodb://***@cluster0.abc.mongodb.net/testdb");
  });
});
