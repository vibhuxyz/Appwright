import type { EmailProviderType } from "@repo/contracts";

export interface SendEmailInput {
  to: string;
  from?: string;
  subject: string;
  text?: string;
  html?: string;
  replyTo?: string;
}

export interface SendEmailResult {
  ok: boolean;
  messageId?: string;
  error?: string;
}

export interface EmailProviderTestResult {
  ok: boolean;
  message: string;
  latencyMs?: number;
}

export interface EmailProvider {
  readonly provider: EmailProviderType;
  validateConfig(config: Record<string, string>): { ok: boolean; issues: string[] };
  testCredentials(config: Record<string, string>): Promise<EmailProviderTestResult>;
  sendEmail(
    input: SendEmailInput,
    config: Record<string, string>,
  ): Promise<SendEmailResult>;
}
