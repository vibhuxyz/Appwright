import type { IntegrationCatalogEntry, IntegrationProvider } from "@repo/contracts";

const MAX_PROMPT_CHARS = 1500;

const BUILD_HINTS: Record<IntegrationProvider, string> = {
  razorpay: "Add checkout, order creation, and payment verification through the Appwright integration gateway.",
  email: "Add transactional email through the Appwright integration gateway.",
  "google-oauth": "Add Sign in with Google through the Appwright integration gateway.",
  cloudinary: "Add image upload and delivery through the Appwright integration gateway.",
  mongodb: "Use the project database for application data. Read MONGODB_URI only on the server.",
  auth: "Add authentication using the existing Auth.js setup.",
  realtime: "Add live updates through the Appwright integration gateway.",
  custom: "Add this connected service through the Appwright integration gateway.",
};

function flatten(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function capChars(text: string): string {
  if (text.length <= MAX_PROMPT_CHARS) return text;
  return text.slice(0, MAX_PROMPT_CHARS).trimEnd();
}

export function integrationAgentPrompt(entry: IntegrationCatalogEntry): string {
  const capabilities = entry.capabilities.slice(0, 8).join(", ");
  const build = BUILD_HINTS[entry.provider] ?? flatten(entry.description);
  return capChars(
    flatten(
      [
        `Integrate ${entry.name} (${entry.provider}) into this app.`,
        build,
        capabilities ? `Cover these capabilities: ${capabilities}.` : "",
        `Call request_integration for ${entry.provider} first so I can pick the Appwright test key or my own key in the secure card.`,
        "Do not ask me to paste secrets in chat.",
        `Then build the smallest end-to-end product surface this app needs for ${entry.name}.`,
      ].join(" "),
    ),
  );
}
