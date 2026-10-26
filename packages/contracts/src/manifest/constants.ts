export const DEPENDENCY_MANIFEST_VERSION = 1;

export const FRAMEWORK_TYPES = ["nextjs", "vite"] as const;

export const RUNTIME_TYPES = ["nodejs", "bun"] as const;

export const DATABASE_PROVIDERS = ["mongodb", "none"] as const;

export const ORM_TYPES = ["mongoose", "none"] as const;

export const AUTH_PROVIDERS = ["authjs", "none"] as const;

export const STORAGE_PROVIDERS = ["cloudinary", "local", "none"] as const;

export const EMAIL_PROVIDERS = [
  "resend",
  "brevo",
  "nodemailer",
  "none",
] as const;

export const REALTIME_PROVIDERS = ["websockets", "sse", "none"] as const;

export const ENVIRONMENT_NAMES = [
  "development",
  "preview",
  "production",
] as const;
