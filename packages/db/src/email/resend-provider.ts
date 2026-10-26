import { redactSecrets } from "../lib/mongo-redact";
import {
  DEFAULT_EMAIL_FROM,
  EMAIL_FROM_KEY,
  EMAIL_TIMEOUT_MS,
  RESEND_API_KEY_KEY,
} from "./constants";
import type {
  EmailProvider,
  EmailProviderTestResult,
  SendEmailInput,
  SendEmailResult,
} from "./types";

export class ResendEmailProvider implements EmailProvider {
  readonly provider = "resend" as const;

  validateConfig(config: Record<string, string>): { ok: boolean; issues: string[] } {
    const issues: string[] = [];
    const apiKey = config[RESEND_API_KEY_KEY];
    if (!apiKey || !apiKey.trim()) {
      issues.push("RESEND_API_KEY is required");
    } else if (!apiKey.startsWith("re_")) {
      issues.push("RESEND_API_KEY must start with 're_'");
    }
    return { ok: issues.length === 0, issues };
  }

  async testCredentials(
    config: Record<string, string>,
  ): Promise<EmailProviderTestResult> {
    const apiKey = config[RESEND_API_KEY_KEY];
    if (!apiKey || !apiKey.startsWith("re_")) {
      return { ok: false, message: "Missing or invalid RESEND_API_KEY format" };
    }

    const start = Date.now();
    try {
      const res = await fetch("https://api.resend.com/api-keys", {
        headers: { Authorization: `Bearer ${apiKey}` },
        signal: AbortSignal.timeout(EMAIL_TIMEOUT_MS),
      });

      const latencyMs = Date.now() - start;
      if (res.ok) {
        return {
          ok: true,
          message: `Resend credentials verified successfully (${latencyMs}ms)`,
          latencyMs,
        };
      }

      if (res.status === 401 || res.status === 403) {
        return { ok: false, message: "Invalid Resend API key" };
      }

      return {
        ok: false,
        message: `Resend verification returned HTTP ${res.status}`,
      };
    } catch (err) {
      const raw = err instanceof Error ? err.message : String(err);
      return {
        ok: false,
        message: `Resend connection failed: ${redactSecrets(raw)}`,
      };
    }
  }

  async sendEmail(
    input: SendEmailInput,
    config: Record<string, string>,
  ): Promise<SendEmailResult> {
    const apiKey = config[RESEND_API_KEY_KEY];
    if (!apiKey) {
      return { ok: false, error: "RESEND_API_KEY is not configured" };
    }

    const from = input.from || config[EMAIL_FROM_KEY] || DEFAULT_EMAIL_FROM;
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: [input.to],
          subject: input.subject,
          text: input.text,
          html: input.html,
          reply_to: input.replyTo,
        }),
        signal: AbortSignal.timeout(EMAIL_TIMEOUT_MS),
      });

      const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      if (!res.ok) {
        const errorMsg = typeof body.message === "string" ? body.message : `HTTP ${res.status}`;
        return { ok: false, error: redactSecrets(errorMsg) };
      }

      const messageId = typeof body.id === "string" ? body.id : undefined;
      return { ok: true, messageId };
    } catch (err) {
      const raw = err instanceof Error ? err.message : String(err);
      return { ok: false, error: redactSecrets(raw) };
    }
  }
}

export const resendEmailProvider = new ResendEmailProvider();
