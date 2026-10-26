import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { IntegrationConfigurationRequest, IntegrationConfigurationResponse } from "@repo/contracts";
import { environmentKeys, useCredentialSetup } from "@/features/environment";
import { agentQuestionKeys, agentQuestionsApi } from "../api";
import { questionStepId, type SubmissionPlan } from "../steps";

export type ReadyPlan = Extract<SubmissionPlan, { ok: true }>;
export type Configure = (requests: readonly IntegrationConfigurationRequest[]) => Promise<IntegrationConfigurationResponse[]>;

export interface SubmissionResult {
  errors: Record<string, string>;
  notices: string[];
}

const ACCEPTED_DEVELOPMENT_STATUSES: ReadonlySet<string> = new Set(["connected", "configured"]);

function reasonText(reason: unknown): string {
  return reason instanceof Error ? reason.message : "The request failed";
}

export function configurationErrors(
  plan: ReadyPlan,
  configurationResults: readonly PromiseSettledResult<IntegrationConfigurationResponse[]>[],
): Record<string, string> {
  const errors: Record<string, string> = {};
  configurationResults.forEach((result, index) => {
    const configuration = plan.configurations[index];
    if (!configuration) return;
    if (result.status === "rejected") {
      errors[configuration.choiceStepId] = `${configuration.providerName}: ${reasonText(result.reason)}`;
      return;
    }
    const development = result.value[0];
    if (development && !ACCEPTED_DEVELOPMENT_STATUSES.has(development.status)) {
      errors[configuration.choiceStepId] = `${configuration.providerName} test failed: ${development.message ?? development.status}`;
    }
  });
  return errors;
}

export function configurationNotices(plan: ReadyPlan): string[] {
  return plan.configurations.flatMap((configuration) => (configuration.notice ? [configuration.notice] : []));
}

async function executeSubmission(plan: ReadyPlan, configure: Configure): Promise<SubmissionResult> {
  const [answerResults, configurationResults] = await Promise.all([
    Promise.allSettled(plan.answers.map((answer) => agentQuestionsApi.answer(answer.questionId, answer.request))),
    Promise.allSettled(plan.configurations.map((configuration) => configure(configuration.requests))),
  ]);
  const errors = configurationErrors(plan, configurationResults);
  answerResults.forEach((result, index) => {
    const answer = plan.answers[index];
    if (result.status === "rejected" && answer) errors[questionStepId(answer.questionId, 0)] = reasonText(result.reason);
  });
  return { errors, notices: configurationNotices(plan) };
}

export function useDockSubmission(projectId: string, sessionId: string | undefined) {
  const queryClient = useQueryClient();
  const credentialSetup = useCredentialSetup(projectId);
  const refresh = () => Promise.all([
    queryClient.invalidateQueries({ queryKey: agentQuestionKeys.pending(sessionId ?? "") }),
    queryClient.invalidateQueries({ queryKey: environmentKeys.pending(projectId) }),
  ]);

  return useMutation({
    mutationFn: (plan: ReadyPlan) => executeSubmission(plan, credentialSetup.mutateAsync),
    onSettled: refresh,
  });
}
