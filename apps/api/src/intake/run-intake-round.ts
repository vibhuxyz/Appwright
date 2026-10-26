import type { Provider } from "@repo/agent-core";
import type { PromptQuestionsRequest } from "@repo/contracts";
import type { z } from "zod";
import { QUESTIONS_TIMEOUT_MS, generateIntakeQuestions } from "./generate-questions";
import { projectHasBuiltApp } from "./has-built-app";
import { INTAKE_PROGRESS, type IntakeProgress } from "./progress-steps";
import { intakeAction, isRepairPrompt, type IntakeAction } from "./repair-prompt";
import { isNewAppRequest } from "./is-new-app-request";

type IntakeRequest = z.infer<typeof PromptQuestionsRequest>;

export async function runIntakeRound(input: {
  request: IntakeRequest;
  projectId: string | null;
  provider: Provider;
  onProgress: (progress: IntakeProgress) => void;
}): Promise<{ questions: Awaited<ReturnType<typeof generateIntakeQuestions>>; action: IntakeAction }> {
  const { request, projectId, provider, onProgress } = input;
  onProgress(INTAKE_PROGRESS.checkingProject);
  const isFollowUp = projectId !== null && (await projectHasBuiltApp(projectId));
  const isChange = isFollowUp || isRepairPrompt(request.prompt);
  if (!isChange) onProgress(INTAKE_PROGRESS.decidingPlan);
  const action = intakeAction({
    prompt: request.prompt,
    isFollowUp,
    isNewApp: isChange ? false : await isNewAppRequest(request.prompt, provider),
  });
  if (action !== "plan") {
    onProgress(INTAKE_PROGRESS.skippingQuestions);
    return { questions: [], action };
  }
  onProgress(INTAKE_PROGRESS.writingQuestions);
  const questions = await generateIntakeQuestions(request.prompt, provider, AbortSignal.timeout(QUESTIONS_TIMEOUT_MS), request.answers ?? {});
  if (questions.length > 0) {
    onProgress({ tool: "questions", detail: `Wrote ${questions.length} questions`, items: questions.map((question) => `${question.label} — ${question.text}`) });
  }
  return { questions, action };
}
