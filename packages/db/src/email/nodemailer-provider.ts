import nodemailer from "nodemailer";
import { redactSecrets } from "../lib/mongo-redact";
import {
  DEFAULT_EMAIL_FROM,
  DEFAULT_SMTP_PORT,
  EMAIL_FROM_KEY,
  EMAIL_TIMEOUT_MS,
  SMTP_HOST_KEY,
  SMTP_PASSWORD_KEY,
  SMTP_PORT_KEY,
  SMTP_SECURE_KEY,
  SMTP_USER_KEY,
} from "./constants";
import type {
  EmailProvider,
  EmailProviderTestResult,
  SendEmailInput,
  SendEmailResult,
} from "./types";

function parseSmtpConfig(config: Record<string, string>) {
  const host = config[SMTP_HOST_KEY]?.trim() ?? "";
  const rawPort = config[SMTP_PORT_KEY]?.trim();
  const port = rawPort ? Number.parseInt(rawPort, 10) : DEFAULT_SMTP_PORT;
  const secure = config[SMTP_SECURE_KEY] === "true" || port === 465;
  const user = config[SMTP_USER_KEY]?.trim();
  const password = config[SMTP_PASSWORD_KEY]?.trim();

  return { host, port, secure, user, password };
}

export class NodemailerEmailProvider implements EmailProvider {
  readonly provider = "nodemailer" as const;

  validateConfig(config: Record<string, string>): { ok: boolean; issues: string[] } {
    const issues: string[] = [];
    const { host, port } = parseSmtpConfig(config);

    if (!host) {
      issues.push("SMTP_HOST is required");
    }
    if (Number.isNaN(port) || port <= 0 || port > 65535) {
      issues.push("SMTP_PORT must be a valid port number (1-65535)");
    }

    return { ok: issues.length === 0, issues };
  }

  async testCredentials(
    config: Record<string, string>,
  ): Promise<EmailProviderTestResult> {
    const { host, port, secure, user, password } = parseSmtpConfig(config);
    if (!host) {
      return { ok: false, message: "Missing SMTP_HOST" };
    }

    const start = Date.now();
    try {
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: user && password ? { user, pass: password } : undefined,
        connectionTimeout: EMAIL_TIMEOUT_MS,
        greetingTimeout: EMAIL_TIMEOUT_MS,
        socketTimeout: EMAIL_TIMEOUT_MS,
      });

      await transporter.verify();
      const latencyMs = Date.now() - start;
      return {
        ok: true,
        message: `SMTP connectivity and authentication verified (${latencyMs}ms)`,
        latencyMs,
      };
    } catch (err) {
      const raw = err instanceof Error ? err.message : String(err);
      return {
        ok: false,
        message: `SMTP connection failed: ${redactSecrets(raw)}`,
      };
    }
  }

  async sendEmail(
    input: SendEmailInput,
    config: Record<string, string>,
  ): Promise<SendEmailResult> {
    const { host, port, secure, user, password } = parseSmtpConfig(config);
    if (!host) {
      return { ok: false, error: "SMTP_HOST is not configured" };
    }

    const from = input.from || config[EMAIL_FROM_KEY] || DEFAULT_EMAIL_FROM;
    try {
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: user && password ? { user, pass: password } : undefined,
        connectionTimeout: EMAIL_TIMEOUT_MS,
        greetingTimeout: EMAIL_TIMEOUT_MS,
        socketTimeout: EMAIL_TIMEOUT_MS,
      });

      const info = await transporter.sendMail({
        from,
        to: input.to,
        subject: input.subject,
        text: input.text,
        html: input.html,
        replyTo: input.replyTo,
      });

      return { ok: true, messageId: info.messageId };
    } catch (err) {
      const raw = err instanceof Error ? err.message : String(err);
      return { ok: false, error: redactSecrets(raw) };
    }
  }
}

export const nodemailerEmailProvider = new NodemailerEmailProvider();
