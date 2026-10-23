// Every wire format a configured model host actually uses for "this API key
// is out of money", gathered in one place so apps/api's two call sites (the
// intake questions endpoint and the agent run loop) can't drift out of sync
// with each other, as they did before this file existed.
const CREDITS_DEPLETED_PATTERNS: readonly RegExp[] = [
  /RESOURCE_EXHAUSTED/, // Gemini
  /credits are depleted/i,
  /insufficient_quota/i, // OpenAI, Groq, xAI — 429, not 402
  /exceeded your current quota/i, // OpenAI's actual wording for insufficient_quota
  /insufficient balance/i, // DeepSeek — 402
  /credit balance is too low/i, // Anthropic — 400
  /\b402\b/,
  /out of credits/i,
  /add billing/i,
];

export const PROVIDER_CREDITS_DEPLETED_NOTICE =
  "⚠️ Our AI provider is temporarily out of capacity on our end — this is not your account balance, which is unaffected. Please try again shortly.";

export function isProviderCreditsDepleted(message: string): boolean {
  return CREDITS_DEPLETED_PATTERNS.some((pattern) => pattern.test(message));
}

export type ProviderFailureKind = "transient" | "credits" | "auth" | "invalid" | "unknown";

const TRANSIENT_PATTERNS: readonly RegExp[] = [
  /\b429\b/,
  /\b503\b/,
  /\b502\b/,
  /\b500\b/,
  /rate limit/i,
  /temporar(?:y|ily)/i,
  /timeout/i,
  /ETIMEDOUT/,
  /ECONNRESET/,
  /ENOTFOUND/,
  /network/i,
  /unavailable/i,
];

const AUTH_PATTERNS: readonly RegExp[] = [
  /\b401\b/,
  /unauthorized/i,
  /invalid api key/i,
  /incorrect api key/i,
];

const INVALID_PATTERNS: readonly RegExp[] = [
  /\b400\b/,
  /invalid_request/i,
  /INVALID_ARGUMENT/,
  /output_unparseable/,
];

export function classifyProviderFailure(message: string): ProviderFailureKind {
  if (isProviderCreditsDepleted(message)) return "credits";
  if (AUTH_PATTERNS.some((pattern) => pattern.test(message))) return "auth";
  if (TRANSIENT_PATTERNS.some((pattern) => pattern.test(message))) return "transient";
  if (INVALID_PATTERNS.some((pattern) => pattern.test(message))) return "invalid";
  return "unknown";
}

export function isRetryableProviderFailure(kind: ProviderFailureKind): boolean {
  return kind === "transient";
}
