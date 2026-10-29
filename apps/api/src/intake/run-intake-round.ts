import { isProviderCreditsDepleted, providerFor, type Provider } from "@repo/agent-core";
import { isConversationalMessage, type PromptAnalysis, type PromptQuestionsRequest } from "@repo/contracts";
import { analyzePrompt } from "@repo/decision-engine";
import type { z } from "zod";
import { log } from "../log";
import { QUESTIONS_TIMEOUT_MS, generateIntakeQuestions } from "./generate-questions";
import { projectHasBuiltApp } from "./has-built-app";
import { intakeAction, type IntakeAction } from "./intake-action";
import { INTAKE_PROGRESS, type IntakeProgress } from "./progress-steps";
import { recentMessageTexts } from "./recent-messages";
import { replyToChat } from "./reply-to-chat";
import { withCreativeChoiceQuestions } from "./with-creative-choice-questions";

type IntakeRequest = z.infer<typeof PromptQuestionsRequest>;
type IntakeQuestions = Awaited<ReturnType<typeof generateIntakeQuestions>>;

export interface IntakeRoundResult {
  questions: IntakeQuestions;
  action: IntakeAction;
  reply?: string;
  analysis?: PromptAnalysis;
}

interface IntakeRoundInput {
  request: IntakeRequest;
  projectId: string | null;
  provider: Provider;
  onProgress: (progress: IntakeProgress) => void;
}

function canReplyInChat(request: IntakeRequest, projectId: string | null): boolean {
  return projectId !== null && !request.attachments?.length;
}

async function chatResult(prompt: string, provider: Provider): Promise<IntakeRoundResult> {
  const reply = await replyToChat(prompt, provider);
  if (reply.kind === "replied") return { questions: [], action: "reply", reply: reply.text };
  log.error("intake chat reply failed", { model: provider.model, message: reply.message });
  return { questions: [], action: "send" };
}

async function analyzeRequest(input: IntakeRoundInput): Promise<PromptAnalysis> {
  const { request, projectId, provider } = input;
  const ownedSessionId = projectId === null ? undefined : request.sessionId;
  const [hasBuiltApp, recentMessages] = await Promise.all([
    projectId === null ? false : projectHasBuiltApp(projectId),
    recentMessageTexts(ownedSessionId),
  ]);
  input.onProgress(INTAKE_PROGRESS.decidingPlan);
  const { analysis, result } = await analyzePrompt(
    { prompt: request.prompt, hasBuiltApp, hasAttachments: Boolean(request.attachments?.length), recentMessages },
    provider,
  );
  if (result.status === "provider_error") {
    log.error("intake analyze call failed", {
      model: provider.model,
      provider: providerFor(provider.model),
      providerCreditsDepleted: isProviderCreditsDepleted(result.errorMessage ?? ""),
      message: result.errorMessage,
    });
  }
  log.info("intake analysis", { intent: analysis.intent, path: analysis.suggestedPath, source: analysis.source, promptVersion: analysis.promptVersion });
  return analysis;
}

async function questionsResult(input: IntakeRoundInput, analysis: PromptAnalysis): Promise<IntakeRoundResult> {
  const { request, provider, onProgress } = input;
  onProgress(INTAKE_PROGRESS.writingQuestions);
  const generated = await generateIntakeQuestions(request.prompt, provider, AbortSignal.timeout(QUESTIONS_TIMEOUT_MS), request.answers ?? {});
  const questions = withCreativeChoiceQuestions(generated, request.answers);
  if (questions.length > 0) {
    onProgress({ tool: "questions", detail: `Wrote ${questions.length} questions`, items: questions.map((question) => `${question.label} — ${question.text}`) });
  }
  return { questions, action: "plan", analysis };
}

export async function runIntakeRound(input: IntakeRoundInput): Promise<IntakeRoundResult> {
  const { request, projectId, provider, onProgress } = input;
  const isChatAllowed = canReplyInChat(request, projectId);
  if (isChatAllowed && isConversationalMessage(request.prompt)) {
    onProgress(INTAKE_PROGRESS.writingReply);
    return chatResult(request.prompt, provider);
  }
  onProgress(INTAKE_PROGRESS.checkingProject);
  const analysis = await analyzeRequest(input);
  const action = intakeAction(analysis.suggestedPath, { canReplyInChat: isChatAllowed });
  if (action === "reply") {
    onProgress(INTAKE_PROGRESS.writingReply);
    return chatResult(request.prompt, provider);
  }
  if (action === "plan") return questionsResult(input, analysis);
  onProgress(INTAKE_PROGRESS.skippingQuestions);
  return { questions: [], action, analysis };
}
