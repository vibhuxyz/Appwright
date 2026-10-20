export const STACK_TEMPLATE_ID = "next-prisma-postgres-tailwind";
export const THEME_TOKENS_PATH = "src/theme/tokens.css";
export const BASE_DEPENDENCIES = [
  "@prisma/client",
  "next",
  "react",
  "react-dom",
  "tailwindcss",
] as const;
export const DEPENDENCIES_BY_FEATURE: Readonly<Record<string, readonly string[]>> = {
  auth: ["next-auth"],
  payments: ["stripe"],
  fileUpload: ["uploadthing"],
};
