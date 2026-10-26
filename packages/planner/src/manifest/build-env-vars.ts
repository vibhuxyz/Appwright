import type { EmailProviderType, EnvVarDefinition } from "@repo/contracts";
import {
  AUTH_SECRET_KEY,
  GOOGLE_CLIENT_ID_KEY,
  GOOGLE_CLIENT_SECRET_KEY,
  BREVO_API_KEY_KEY,
  CLOUDINARY_API_KEY_KEY,
  CLOUDINARY_API_SECRET_KEY,
  CLOUDINARY_CLOUD_NAME_KEY,
  DEFAULT_SITE_URL,
  EMAIL_FROM_KEY,
  MONGO_URI_KEY,
  RESEND_API_KEY_KEY,
  SITE_URL_KEY,
  SMTP_HOST_KEY,
  SMTP_PASSWORD_KEY,
  SMTP_PORT_KEY,
  SMTP_SECURE_KEY,
  SMTP_USER_KEY,
  RAZORPAY_KEY_ID_KEY,
  RAZORPAY_KEY_SECRET_KEY,
  RAZORPAY_WEBHOOK_SECRET_KEY,
} from "./constants";

export function buildEnvVars(options: {
  dbRequired: boolean;
  authRequired: boolean;
  googleOAuthRequired?: boolean;
  storageRequired: boolean;
  emailRequired: boolean;
  emailProvider?: EmailProviderType;
  paymentsRequired: boolean;
}): EnvVarDefinition[] {
  const vars: EnvVarDefinition[] = [
    {
      key: SITE_URL_KEY,
      description: "Canonical public URL of the application",
      required: false,
      isSecret: false,
      scopes: ["development", "preview", "production"],
      exampleValue: DEFAULT_SITE_URL,
    },
  ];

  if (options.dbRequired) {
    vars.push({
      key: MONGO_URI_KEY,
      description: "MongoDB connection URI",
      required: true,
      isSecret: true,
      scopes: ["development", "preview", "production"],
      exampleValue: "mongodb://localhost:27017/app",
    });
  }

  if (options.authRequired) {
    vars.push({
      key: AUTH_SECRET_KEY,
      description: "Secret key for session encryption",
      required: true,
      isSecret: true,
      scopes: ["development", "preview", "production"],
      exampleValue: "generate-with-openssl-rand-hex-32",
    });
  }

  if (options.googleOAuthRequired) {
    vars.push(
      {
        key: GOOGLE_CLIENT_ID_KEY,
        description: "Google OAuth web application client ID",
        required: true,
        isSecret: false,
        scopes: ["development", "preview", "production"],
        exampleValue: "client-id.apps.googleusercontent.com",
      },
      {
        key: GOOGLE_CLIENT_SECRET_KEY,
        description: "Google OAuth web application client secret",
        required: true,
        isSecret: true,
        scopes: ["development", "preview", "production"],
        exampleValue: "google-oauth-client-secret",
      },
    );
  }

  if (options.storageRequired) {
    vars.push(
      {
        key: CLOUDINARY_CLOUD_NAME_KEY,
        description: "Cloudinary cloud name",
        required: true,
        isSecret: false,
        scopes: ["development", "preview", "production"],
        exampleValue: "demo",
      },
      {
        key: CLOUDINARY_API_KEY_KEY,
        description: "Cloudinary API key",
        required: true,
        isSecret: false,
        scopes: ["development", "preview", "production"],
        exampleValue: "123456789012345",
      },
      {
        key: CLOUDINARY_API_SECRET_KEY,
        description: "Cloudinary API secret",
        required: true,
        isSecret: true,
        scopes: ["development", "preview", "production"],
        exampleValue: "abcdefghijklmnopqrstuvwxyz12",
      },
    );
  }

  if (options.emailRequired) {
    vars.push({
      key: EMAIL_FROM_KEY,
      description: "Sender email address for outbound emails",
      required: false,
      isSecret: false,
      scopes: ["development", "preview", "production"],
      exampleValue: "noreply@example.com",
    });

    const emailProvider = options.emailProvider || "brevo";
    if (emailProvider === "brevo") {
      vars.push({
        key: BREVO_API_KEY_KEY,
        description: "Brevo API key for transactional emails",
        required: true,
        isSecret: true,
        scopes: ["development", "preview", "production"],
        exampleValue: "xkeysib-...",
      });
    } else if (emailProvider === "nodemailer") {
      vars.push(
        {
          key: SMTP_HOST_KEY,
          description: "SMTP server hostname",
          required: true,
          isSecret: false,
          scopes: ["development", "preview", "production"],
          exampleValue: "smtp.example.com",
        },
        {
          key: SMTP_PORT_KEY,
          description: "SMTP server port",
          required: true,
          isSecret: false,
          scopes: ["development", "preview", "production"],
          exampleValue: "587",
        },
        {
          key: SMTP_USER_KEY,
          description: "SMTP authentication username",
          required: false,
          isSecret: false,
          scopes: ["development", "preview", "production"],
          exampleValue: "user@example.com",
        },
        {
          key: SMTP_PASSWORD_KEY,
          description: "SMTP authentication password",
          required: false,
          isSecret: true,
          scopes: ["development", "preview", "production"],
          exampleValue: "smtp-password",
        },
        {
          key: SMTP_SECURE_KEY,
          description: "SMTP TLS encryption enabled",
          required: false,
          isSecret: false,
          scopes: ["development", "preview", "production"],
          exampleValue: "false",
        },
      );
    } else {
      vars.push({
        key: RESEND_API_KEY_KEY,
        description: "Resend API key for transactional emails",
        required: true,
        isSecret: true,
        scopes: ["development", "preview", "production"],
        exampleValue: "re_123456789",
      });
    }
  }

  if (options.paymentsRequired) {
    vars.push(
      {
        key: RAZORPAY_KEY_ID_KEY,
        description: "Razorpay Key ID",
        required: true,
        isSecret: false,
        scopes: ["development", "preview", "production"],
        exampleValue: "rzp_test_123456789",
      },
      {
        key: RAZORPAY_KEY_SECRET_KEY,
        description: "Razorpay Key Secret",
        required: true,
        isSecret: true,
        scopes: ["development", "preview", "production"],
        exampleValue: "test-key-secret",
      },
      {
        key: RAZORPAY_WEBHOOK_SECRET_KEY,
        description: "Razorpay webhook signing secret",
        required: true,
        isSecret: true,
        scopes: ["development", "preview", "production"],
        exampleValue: "webhook-secret",
      },
    );
  }

  return vars;
}
