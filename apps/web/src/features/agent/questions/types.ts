import type {
  AgentQuestionItem,
  IntegrationCatalogEntry,
  IntegrationField,
  PendingIntegrationRequirement,
} from "@repo/contracts";
import type { CredentialDraft } from "@/features/environment";

export type DockStep =
  | { kind: "question"; id: string; questionId: string; questionIndex: number; question: AgentQuestionItem }
  | {
      kind: "integration-choice";
      id: string;
      requirement: PendingIntegrationRequirement;
      entry: IntegrationCatalogEntry;
      isTestKeyAvailable: boolean;
      isTestKeyExhausted: boolean;
    }
  | {
      kind: "integration-field";
      id: string;
      requirement: PendingIntegrationRequirement;
      entry: IntegrationCatalogEntry;
      field: IntegrationField;
    };

export interface ChoiceDraft {
  selectedOptionIndexes: readonly number[];
  isOtherSelected: boolean;
  otherText: string;
}

export interface DockState {
  stepIndex: number;
  choiceDrafts: Readonly<Record<string, ChoiceDraft>>;
  credentialDrafts: Readonly<Record<string, CredentialDraft>>;
  errors: Readonly<Record<string, string>>;
}
