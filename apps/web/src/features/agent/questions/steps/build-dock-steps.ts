import type {
  AgentQuestionResponse,
  IntegrationCatalogResponse,
  PendingIntegrationRequirement,
} from "@repo/contracts";
import type { CredentialDraft } from "@/features/environment";
import type { DockStep } from "../types";
import { integrationChoiceStepId, integrationFieldStepId, questionStepId } from "./step-ids";

function questionSteps(questions: readonly AgentQuestionResponse[]): DockStep[] {
  return questions.flatMap((row) => row.questions.map((question, questionIndex): DockStep => ({
    kind: "question",
    id: questionStepId(row.id, questionIndex),
    questionId: row.id,
    questionIndex,
    question,
  })));
}

export function buildDockSteps(input: {
  questions: readonly AgentQuestionResponse[];
  requirements: readonly PendingIntegrationRequirement[];
  catalog: IntegrationCatalogResponse | undefined;
  credentialDrafts: Readonly<Record<string, CredentialDraft>>;
}): DockStep[] {
  const entries = new Map((input.catalog?.catalog ?? []).map((entry) => [entry.provider, entry]));
  const quotaRemaining = new Map((input.catalog?.quotas ?? []).map((quota) => [quota.provider, quota.remaining]));
  const integrationSteps = input.requirements.flatMap((requirement): DockStep[] => {
    const entry = entries.get(requirement.provider);
    if (!entry) return [];
    const choice: DockStep = {
      kind: "integration-choice",
      id: integrationChoiceStepId(requirement.id),
      requirement,
      entry,
      isTestKeyAvailable: entry.canUseManagedCredentials,
      isTestKeyExhausted: quotaRemaining.get(requirement.provider) === 0,
    };
    if (input.credentialDrafts[requirement.id]?.choice !== "YOUR_KEY") return [choice];
    return [choice, ...entry.fields.map((field): DockStep => ({
      kind: "integration-field",
      id: integrationFieldStepId(requirement.id, field.key),
      requirement,
      entry,
      field,
    }))];
  });
  return [...questionSteps(input.questions), ...integrationSteps];
}
