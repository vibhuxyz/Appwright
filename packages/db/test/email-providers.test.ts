import { describe, expect, it } from "bun:test";
import { BrevoEmailProvider } from "../src/email/brevo-provider";
import { NodemailerEmailProvider } from "../src/email/nodemailer-provider";
import { EmailProviderFactory } from "../src/email/provider-factory";
import { ResendEmailProvider } from "../src/email/resend-provider";

describe("ResendEmailProvider", () => {
  const provider = new ResendEmailProvider();

  it("validates configuration correctly", () => {
    const invalidEmpty = provider.validateConfig({});
    expect(invalidEmpty.ok).toBe(false);
    expect(invalidEmpty.issues[0]).toContain("required");

    const invalidPrefix = provider.validateConfig({ RESEND_API_KEY: "bad_key" });
    expect(invalidPrefix.ok).toBe(false);
    expect(invalidPrefix.issues[0]).toContain("re_");

    const valid = provider.validateConfig({ RESEND_API_KEY: "re_test_key_123" });
    expect(valid.ok).toBe(true);
    expect(valid.issues.length).toBe(0);
  });

  it("fails fast for malformed credentials", async () => {
    const result = await provider.testCredentials({ RESEND_API_KEY: "invalid_key" });
    expect(result.ok).toBe(false);
    expect(result.message).toContain("invalid");
  });

  it("handles send without API key safely", async () => {
    const result = await provider.sendEmail(
      { to: "test@example.com", subject: "Hello" },
      {},
    );
    expect(result.ok).toBe(false);
    expect(result.error).toContain("RESEND_API_KEY is not configured");
  });
});

describe("BrevoEmailProvider", () => {
  const provider = new BrevoEmailProvider();

  it("validates configuration correctly", () => {
    const invalidEmpty = provider.validateConfig({});
    expect(invalidEmpty.ok).toBe(false);
    expect(invalidEmpty.issues[0]).toContain("required");

    const invalidShort = provider.validateConfig({ BREVO_API_KEY: "short" });
    expect(invalidShort.ok).toBe(false);
    expect(invalidShort.issues[0]).toContain("too short");

    const valid = provider.validateConfig({ BREVO_API_KEY: "xkeysib-1234567890abcdef" });
    expect(valid.ok).toBe(true);
    expect(valid.issues.length).toBe(0);
  });

  it("fails fast for missing credentials", async () => {
    const result = await provider.testCredentials({});
    expect(result.ok).toBe(false);
    expect(result.message).toContain("Missing");
  });

  it("handles send without API key safely", async () => {
    const result = await provider.sendEmail(
      { to: "test@example.com", subject: "Hello" },
      {},
    );
    expect(result.ok).toBe(false);
    expect(result.error).toContain("BREVO_API_KEY is not configured");
  });
});

describe("NodemailerEmailProvider", () => {
  const provider = new NodemailerEmailProvider();

  it("validates configuration correctly", () => {
    const invalidEmpty = provider.validateConfig({});
    expect(invalidEmpty.ok).toBe(false);
    expect(invalidEmpty.issues[0]).toContain("SMTP_HOST is required");

    const invalidPort = provider.validateConfig({
      SMTP_HOST: "smtp.example.com",
      SMTP_PORT: "999999",
    });
    expect(invalidPort.ok).toBe(false);
    expect(invalidPort.issues[0]).toContain("port");

    const valid = provider.validateConfig({
      SMTP_HOST: "smtp.example.com",
      SMTP_PORT: "587",
    });
    expect(valid.ok).toBe(true);
    expect(valid.issues.length).toBe(0);
  });

  it("handles connection failure safely and redacts password", async () => {
    const result = await provider.testCredentials({
      SMTP_HOST: "127.0.0.1",
      SMTP_PORT: "25999",
      SMTP_USER: "myuser",
      SMTP_PASSWORD: "supersecretpassword123",
    });
    expect(result.ok).toBe(false);
    expect(result.message).toContain("SMTP connection failed");
    expect(result.message).not.toContain("supersecretpassword123");
  });
});

describe("EmailProviderFactory", () => {
  it("returns correct adapter for each supported provider", () => {
    expect(EmailProviderFactory.getProvider("resend").provider).toBe("resend");
    expect(EmailProviderFactory.getProvider("brevo").provider).toBe("brevo");
    expect(EmailProviderFactory.getProvider("nodemailer").provider).toBe("nodemailer");
  });

  it("falls back to resend for unknown provider types", () => {
    expect(EmailProviderFactory.getProvider("unknown").provider).toBe("resend");
  });
});
