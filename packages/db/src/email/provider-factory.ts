import type { EmailProviderType } from "@repo/contracts";
import { brevoEmailProvider } from "./brevo-provider";
import { nodemailerEmailProvider } from "./nodemailer-provider";
import { resendEmailProvider } from "./resend-provider";
import type { EmailProvider } from "./types";

const PROVIDERS: Record<EmailProviderType, EmailProvider> = {
  resend: resendEmailProvider,
  brevo: brevoEmailProvider,
  nodemailer: nodemailerEmailProvider,
};

export class EmailProviderFactory {
  static getProvider(type: string): EmailProvider {
    const provider = PROVIDERS[type as EmailProviderType];
    if (!provider) {
      return resendEmailProvider;
    }
    return provider;
  }

  static listSupportedProviders(): readonly EmailProviderType[] {
    return Object.keys(PROVIDERS) as EmailProviderType[];
  }
}

export function getEmailProvider(type: string): EmailProvider {
  return EmailProviderFactory.getProvider(type);
}
