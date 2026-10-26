import type { IntegrationProvider } from "@repo/contracts";

export interface CredentialCopy {
  question: string;
  testKeyLabel: string;
  testKeyHint: string;
  ownKeyLabel: string;
  ownKeyHint: string;
  primaryScopeLabel: string;
  productionToggleLabel: string;
  productionScopeLabel: string;
}

const DEFAULT_TEST_KEY_HINT = "Appwright's shared test account. Works in development and preview with a small usage allowance.";

export function credentialCopy(provider: IntegrationProvider, name: string): CredentialCopy {
  if (provider === "mongodb") {
    return {
      question: "Which database should your app use?",
      testKeyLabel: "Use Appwright database",
      testKeyHint: "Appwright creates an isolated database for each environment. Nothing to set up.",
      ownKeyLabel: "Use my own MongoDB URI",
      ownKeyHint: "Connect your own MongoDB cluster with a connection string.",
      primaryScopeLabel: "Connection string for development & preview",
      productionToggleLabel: "Use a different database for production (optional)",
      productionScopeLabel: "Production connection string",
    };
  }
  const isRazorpay = provider === "razorpay";
  return {
    question: `How should ${name} connect?`,
    testKeyLabel: "Use Appwright test key",
    testKeyHint: DEFAULT_TEST_KEY_HINT,
    ownKeyLabel: "Use my own key",
    ownKeyHint: `Connect your own ${name} account. You control the credentials and usage.`,
    primaryScopeLabel: isRazorpay ? "Test key (rzp_test_…) for development & preview" : "Key for development & preview",
    productionToggleLabel: isRazorpay
      ? "Add my live key for production (optional)"
      : "Use a different key for production (optional)",
    productionScopeLabel: isRazorpay ? "Live key (rzp_live_…) for production" : "Production key",
  };
}
