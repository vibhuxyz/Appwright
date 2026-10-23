export const STACK_TEMPLATE_ID = "next-mongoose-tailwind";
export const THEME_TOKENS_PATH = "src/theme/tokens.css";
export const BASE_DEPENDENCIES = [
  "mongoose",
  "next",
  "react",
  "react-dom",
  "tailwindcss",
] as const;
export const DEPENDENCIES_BY_FEATURE: Readonly<Record<string, readonly string[]>> = {
  auth: ["next-auth", "bcryptjs"],
  payments: ["stripe"],
  fileUpload: ["uploadthing"],
};
