export type CredentialChoice = "APPWRIGHT_TEST_KEY" | "YOUR_KEY";

export type CredentialScope = "primary" | "production";

export interface CredentialDraft {
  choice: CredentialChoice | null;
  primaryValues: Readonly<Record<string, string>>;
  hasSeparateProductionKey: boolean;
  productionValues: Readonly<Record<string, string>>;
}

export const EMPTY_CREDENTIAL_DRAFT: CredentialDraft = {
  choice: null,
  primaryValues: {},
  hasSeparateProductionKey: false,
  productionValues: {},
};

export function credentialFieldErrorKey(scope: CredentialScope, fieldKey: string): string {
  return `${scope}:${fieldKey}`;
}
