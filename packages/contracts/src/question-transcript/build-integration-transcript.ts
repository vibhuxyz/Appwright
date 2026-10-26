import { INTEGRATION_CATALOG } from "../environment";
import { QUESTION_TRANSCRIPT_LIMITS } from "./constants";
import type { QuestionReplyData, QuestionSetData } from "./question-transcript.schema";
import { flattenTranscriptText } from "./transcript-text";

const limits = QUESTION_TRANSCRIPT_LIMITS;
const MANAGED_MODE = "APPWRITE_MANAGED";
const CONNECTED_STATUS = "CONNECTED";
export const INTEGRATION_QUESTION_TEXT = "How should I connect it?";
const OPTIONS = {
  default: { managed: "Appwright test key", own: "My own key" },
  mongodb: { managed: "Appwright database", own: "My own MongoDB URI" },
} as const;

export interface IntegrationConnectionOutcome {
  provider: string;
  status: string;
  credentialMode?: string;
}

export function integrationDisplayName(provider: string): string {
  return INTEGRATION_CATALOG.find((entry) => entry.provider === provider)?.name ?? provider;
}

function optionsFor(provider: string) {
  return provider === "mongodb" ? OPTIONS.mongodb : OPTIONS.default;
}

export function integrationQuestionSet(intro: string, providers: readonly string[]): QuestionSetData {
  return {
    kind: "integration",
    intro: flattenTranscriptText(intro, limits.maxIntroChars),
    items: providers.slice(0, limits.maxItems).map((provider) => {
      const options = optionsFor(provider);
      return {
        key: provider,
        label: flattenTranscriptText(integrationDisplayName(provider), limits.maxLabelChars),
        text: INTEGRATION_QUESTION_TEXT,
        options: [options.managed, options.own],
      };
    }),
    moreCount: Math.max(0, providers.length - limits.maxItems),
  };
}

function connectionAnswer(outcome: IntegrationConnectionOutcome): string {
  if (outcome.status !== CONNECTED_STATUS) return "Not connected";
  const options = optionsFor(outcome.provider);
  return outcome.credentialMode === MANAGED_MODE ? options.managed : options.own;
}

export function integrationReply(outcomes: readonly IntegrationConnectionOutcome[]): QuestionReplyData {
  const isAnyConnected = outcomes.some((outcome) => outcome.status === CONNECTED_STATUS);
  if (!isAnyConnected) return { kind: "integration", outcome: "skipped", items: [], moreCount: 0 };
  return {
    kind: "integration",
    outcome: "answered",
    items: outcomes.slice(0, limits.maxItems).map((outcome) => ({
      label: flattenTranscriptText(integrationDisplayName(outcome.provider), limits.maxLabelChars),
      text: INTEGRATION_QUESTION_TEXT,
      answer: connectionAnswer(outcome),
    })),
    moreCount: Math.max(0, outcomes.length - limits.maxItems),
  };
}
