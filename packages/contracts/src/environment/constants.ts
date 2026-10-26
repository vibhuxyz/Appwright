export const INTEGRATION_PROVIDERS = [
  "mongodb",
  "auth",
  "cloudinary",
  "email",
  "razorpay",
  "google-oauth",
  "realtime",
  "custom",
] as const;

export const INTEGRATION_STATUSES = [
  "not_required",
  "missing",
  "configured",
  "verified",
  "invalid",
  "testing",
  "connected",
  "test_failed",
  "quota_exhausted",
  "production_configuration_required",
] as const;

export const CREDENTIAL_MODES = ["APPWRITE_MANAGED", "BYOK"] as const;

export const INTEGRATION_ENVIRONMENTS = [
  "development",
  "preview",
  "production",
] as const;

export const INTEGRATION_CATEGORIES = [
  "payments",
  "login",
  "communications",
  "storage",
  "database",
] as const;

export const CREDENTIAL_SOURCES = [
  "APPWRIGHT_TEST_KEY",
  "YOUR_KEY",
  "NOT_SET",
  "NOT_APPLICABLE",
] as const;

export const DATABASE_SOURCES = [
  "APPWRIGHT",
  "BYOK",
  "NOT_PROVISIONED",
  "NOT_REQUIRED",
] as const;

export const CHECK_STATUSES = [
  "passed",
  "failed",
  "warning",
  "skipped",
] as const;

export const VARIABLE_SCOPES = [
  "development",
  "preview",
  "production",
  "all",
] as const;

export const EMAIL_PROVIDER_TYPES = [
  "resend",
  "brevo",
  "nodemailer",
] as const;
