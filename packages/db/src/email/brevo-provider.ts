import { redactSecrets } from "../lib/mongo-redact";
import {
  BREVO_API_KEY_KEY,
  DEFAULT_EMAIL_FROM,
  EMAIL_FROM_KEY,
  EMAIL_TIMEOUT_MS,
} from "./constants";
import type {
  EmailProvider,
  EmailProviderTestResult,
  SendEmailInput,
  SendEmailResult,
} from "./types";

export class BrevoEmailProvider implements EmailProvider {
  readonly provider = "brevo" as const;

  validateConfig(config: Record<string, string>): { ok: boolean; issues: string[] } {
    const issues: string[] = [];
    const apiKey = config[BREVO_API_KEY_KEY];
    if (!apiKey || !apiKey.trim()) {
      issues.push("BREVO_API_KEY is required");
    } else if (apiKey.length < 10) {
      issues.push("BREVO_API_KEY is too short (minimum 10 characters)");
    }
    return { ok: issues.length === 0, issues };
  }

  async testCredentials(
    config: Record<string, string>,
  ): Promise<EmailProviderTestResult> {
    const apiKey = config[BREVO_API_KEY_KEY];
    if (!apiKey || apiKey.length < 10) {
      return { ok: false, message: "Missing or invalid BREVO_API_KEY" };
    }

    const start = Date.now();
    try {
      const res = await fetch("https://api.brevo.com/v3/account", {
        headers: { "api-key": apiKey },
        signal: AbortSignal.timeout(EMAIL_TIMEOUT_MS),
      });

      const latencyMs = Date.now() - start;
      if (res.ok) {
        return {
          ok: true,
          message: `Brevo credentials verified successfully (${latencyMs}ms)`,
          latencyMs,
        };
      }

      if (res.status === 401 || res.status === 403) {
        return { ok: false, message: "Invalid Brevo API key" };
      }

      return {
        ok: false,
        message: `Brevo verification returned HTTP ${res.status}`,
      };
    } catch (err) {
      const raw = err instanceof Error ? err.message : String(err);
      return {
        ok: false,
        message: `Brevo connection failed: ${redactSecrets(raw)}`,
      };
    }
  }

  async sendEmail(
    input: SendEmailInput,
    config: Record<string, string>,
  ): Promise<SendEmailResult> {
    const apiKey = config[BREVO_API_KEY_KEY];
    if (!apiKey) {
      return { ok: false, error: "BREVO_API_KEY is not configured" };
    }

    const from = input.from || config[EMAIL_FROM_KEY] || DEFAULT_EMAIL_FROM;
    try {
      const res = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sender: { email: from },
          to: [{ email: input.to }],
          subject: input.subject,
          textContent: input.text,
          htmlContent: input.html,
          replyTo: input.replyTo ? { email: input.replyTo } : undefined,
        }),
        signal: AbortSignal.timeout(EMAIL_TIMEOUT_MS),
      });

      const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      if (!res.ok) {
        const errorMsg = typeof body.message === "string" ? body.message : `HTTP ${res.status}`;
        return { ok: false, error: redactSecrets(errorMsg) };
      }

      const messageId = typeof body.messageId === "string" ? body.messageId : undefined;
      return { ok: true, messageId };
    } catch (err) {
      const raw = err instanceof Error ? err.message : String(err);
      return { ok: false, error: redactSecrets(raw) };
    }
  }
}

export const brevoEmailProvider = new BrevoEmailProvider();
