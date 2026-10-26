import { useMutation, useQueryClient } from "@tanstack/react-query";
import { environmentKeys, useCredentialSetup } from "@/features/environment";
import type { LateQuestions } from "../../transcript";
import { lateAnswerMessage } from "../steps";
import { configurationErrors, configurationNotices, type Configure, type ReadyPlan, type SubmissionResult } from "./use-dock-submission";

export interface LateAnswerTarget {
  isBlocked: boolean;
  send: (text: string) => void;
}

async function executeLateSubmission(input: {
  plan: ReadyPlan;
  late: LateQuestions;
  configure: Configure;
  send: (text: string) => void;
}): Promise<SubmissionResult> {
  const results = await Promise.allSettled(input.plan.configurations.map((configuration) => input.configure(configuration.requests)));
  const errors = configurationErrors(input.plan, results);
  if (Object.keys(errors).length === 0) input.send(lateAnswerMessage(input.late, input.plan));
  return { errors, notices: configurationNotices(input.plan) };
}

export function useLateDockSubmission(projectId: string, late: { questions: LateQuestions; target: LateAnswerTarget } | undefined) {
  const queryClient = useQueryClient();
  const credentialSetup = useCredentialSetup(projectId);
  return useMutation({
    mutationFn: (plan: ReadyPlan): Promise<SubmissionResult> => {
      if (!late) return Promise.reject(new Error("There are no skipped questions to answer"));
      if (late.target.isBlocked) return Promise.reject(new Error("Wait for the agent to finish, then send your answers"));
      return executeLateSubmission({ plan, late: late.questions, configure: credentialSetup.mutateAsync, send: late.target.send });
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: environmentKeys.pending(projectId) }),
  });
}
