import type { Provider } from "@repo/agent-core";
import type { PromptQuestionsRequest } from "@repo/contracts";
import type { z } from "zod";
import { log } from "../log";
import { QUESTIONS_TIMEOUT_MS, generateIntakeQuestions } from "./generate-questions";
import { projectHasBuiltApp } from "./has-built-app";
import { INTAKE_PROGRESS, type IntakeProgress } from "./progress-steps";
import { kindWithoutModel, promptKind, type PromptKind } from "./prompt-kind";
import { intakeAction, isRepairPrompt, type IntakeAction } from "./repair-prompt";
import { replyToChat } from "./reply-to-chat";
import { withCreativeChoiceQuestions } from "./with-creative-choice-questions";

type IntakeRequest = z.infer<typeof PromptQuestionsRequest>;
type IntakeQuestions = Awaited<ReturnType<typeof generateIntakeQuestions>>;

export interface IntakeRoundResult {
  questions: IntakeQuestions;
  action: IntakeAction;
  reply?: string;
}

function canReplyInChat(request: IntakeRequest, projectId: string | null): boolean {
  return projectId !== null && !request.attachments?.length;
}

async function readKind(prompt: string, isChange: boolean, provider: Provider): Promise<PromptKind> {
  return isChange ? kindWithoutModel(prompt) : promptKind(prompt, provider);
}

async function chatResult(prompt: string, provider: Provider): Promise<IntakeRoundResult> {
  const reply = await replyToChat(prompt, provider);
  if (reply.kind === "replied") return { questions: [], action: "reply", reply: reply.text };
  log.error("intake chat reply failed", { model: provider.model, message: reply.message });
  return { questions: [], action: "send" };
}

export async function runIntakeRound(input: {
  request: IntakeRequest;
  projectId: string | null;
  provider: Provider;
  onProgress: (progress: IntakeProgress) => void;
}): Promise<IntakeRoundResult> {
  const { request, projectId, provider, onProgress } = input;
  onProgress(INTAKE_PROGRESS.checkingProject);
  const isFollowUp = projectId !== null && (await projectHasBuiltApp(projectId));
  const isRepair = isRepairPrompt(request.prompt);
  const isChange = isFollowUp || isRepair;
  if (!isChange) onProgress(INTAKE_PROGRESS.decidingPlan);
  const kind = isRepair ? "other" : await readKind(request.prompt, isChange, provider);
  const action = intakeAction({
    prompt: request.prompt,
    isFollowUp,
    isNewApp: kind === "new-app",
    isChat: kind === "chat" && canReplyInChat(request, projectId),
  });
  if (action === "reply") {
    onProgress(INTAKE_PROGRESS.writingReply);
    return chatResult(request.prompt, provider);
  }
  if (action !== "plan") {
    onProgress(INTAKE_PROGRESS.skippingQuestions);
    return { questions: [], action };
  }
  onProgress(INTAKE_PROGRESS.writingQuestions);
  const generated = await generateIntakeQuestions(request.prompt, provider, AbortSignal.timeout(QUESTIONS_TIMEOUT_MS), request.answers ?? {});
  const questions = withCreativeChoiceQuestions(generated, request.answers);
  if (questions.length > 0) {
    onProgress({ tool: "questions", detail: `Wrote ${questions.length} questions`, items: questions.map((question) => `${question.label} — ${question.text}`) });
  }
  return { questions, action };
}
