import {
  isConfigurableIntegrationProvider,
  type AgentQuestionResponse,
  type AnswerAgentQuestionRequest,
  type IntegrationConfigurationRequest,
} from "@repo/contracts";
import { EMPTY_CREDENTIAL_DRAFT, buildConfigureRequests } from "@/features/environment";
import type { DockState, DockStep } from "../types";
import { toAnswer } from "./choice-draft";
import { questionStepId } from "./step-ids";
import { prefixCredentialErrors, validateStep } from "./step-validation";

export interface PlannedConfiguration {
  choiceStepId: string;
  provider: string;
  providerName: string;
  requests: IntegrationConfigurationRequest[];
  notice: string | null;
}

export type SubmissionPlan =
  | { ok: false; errors: Record<string, string> }
  | {
      ok: true;
      answers: { questionId: string; request: AnswerAgentQuestionRequest }[];
      configurations: PlannedConfiguration[];
    };

function planConfigurations(steps: readonly DockStep[], state: DockState): {
  configurations: PlannedConfiguration[];
  errors: Record<string, string>;
} {
  const configurations: PlannedConfiguration[] = [];
  const errors: Record<string, string> = {};
  for (const step of steps) {
    if (step.kind !== "integration-choice" || !isConfigurableIntegrationProvider(step.requirement.provider)) continue;
    const result = buildConfigureRequests({
      provider: step.requirement.provider,
      fields: step.entry.fields,
      draft: state.credentialDrafts[step.requirement.id] ?? EMPTY_CREDENTIAL_DRAFT,
    });
    if (!result.ok) {
      Object.assign(errors, { [step.id]: result.message }, prefixCredentialErrors(step.requirement.id, result.fieldErrors));
      continue;
    }
    configurations.push({
      choiceStepId: step.id,
      provider: step.requirement.provider,
      providerName: step.entry.name,
      requests: result.requests,
      notice: result.notice,
    });
  }
  return { configurations, errors };
}

export function planDockSubmission(input: {
  steps: readonly DockStep[];
  state: DockState;
  questions: readonly AgentQuestionResponse[];
}): SubmissionPlan {
  const stepErrors: Record<string, string> = Object.assign({}, ...input.steps.map((step) => validateStep(step, input.state)));
  if (Object.keys(stepErrors).length > 0) return { ok: false, errors: stepErrors };
  const { configurations, errors } = planConfigurations(input.steps, input.state);
  if (Object.keys(errors).length > 0) return { ok: false, errors };
  const answers = input.questions.map((row) => ({
    questionId: row.id,
    request: {
      answers: row.questions.map((_, index) => toAnswer(input.state.choiceDrafts[questionStepId(row.id, index)])),
    },
  }));
  return { ok: true, answers, configurations };
}
