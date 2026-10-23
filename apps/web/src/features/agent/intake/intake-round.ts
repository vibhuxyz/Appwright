import type { ThemeOption } from "@repo/contracts";
import { SKIP_ANSWER, type PlanAnswers, type PlanQuestion } from "@/features/plan";
import { agentApi } from "../api/agentApi";
import { questionsAreInChat } from "./chat-echo";
import { beginPlanning } from "./plan-round";
import type { IntakeControls, IntakeGate } from "./types";

export type { IntakeControls, IntakeGate };

function errorText(error: unknown): string {
  return error instanceof Error ? error.message : "Could not load questions";
}

function uniqueQuestions(questions: readonly PlanQuestion[]): PlanQuestion[] {
  const seen = new Set<string>();
  const unique: PlanQuestion[] = [];
  for (const question of questions) {
    if (seen.has(question.need)) continue;
    seen.add(question.need);
    unique.push(question);
  }
  return unique;
}

export function withDefaults(questions: readonly PlanQuestion[], answers: PlanAnswers): PlanAnswers {
  const next: PlanAnswers = { ...answers };
  for (const question of questions) {
    const value = next[question.need];
    if (value !== undefined && value !== SKIP_ANSWER) continue;
    if (question.importance === "required" && question.inputType !== "single" && question.inputType !== "multiple") {
      continue;
    }
    const fallback = question.options[question.defaultOptionIndex];
    if (fallback) next[question.need] = fallback;
  }
  return next;
}

export function fetchRound(
  prompt: string,
  afterSeq: number,
  answers: PlanAnswers,
  asked: readonly PlanQuestion[],
  controls: IntakeControls,
) {
  const isCurrent = (current: IntakeGate | null) =>
    Boolean(current && current.prompt === prompt && current.afterSeq === afterSeq);
  controls.setGate({
    prompt,
    status: "checking",
    questions: [],
    asked,
    answers,
    error: null,
    afterSeq,
  });
  const catalogAnswers = Object.keys(answers).length > 0 ? answers : undefined;
  void agentApi.questionsFor(prompt, controls.sessionId, catalogAnswers).then(
    (round) => {
      if (round.questions.length > 0) {
        controls.setGate((current) => {
          if (!isCurrent(current)) return current;
          return {
            prompt,
            status: "asking",
            questions: round.questions,
            asked,
            answers,
            error: null,
            afterSeq,
          };
        });
        return;
      }
      if (round.action === "plan") {
        beginPlanning({ prompt, afterSeq, answers, asked }, controls);
        return;
      }
      if (!isCurrent(controls.gate)) return;
      controls.activePromptRef.current = null;
      controls.setGate(null);
      controls.deliver({
        prompt,
        ...(asked.length > 0 ? { answers, questions: asked } : {}),
      });
    },
    (error: unknown) => {
      controls.setGate((current) => {
        if (!isCurrent(current)) return current;
        return {
          prompt,
          status: "checking",
          questions: [],
          asked,
          answers,
          error: errorText(error),
          afterSeq,
        };
      });
    },
  );
}

export function askQuestions(prompt: string, afterSeq: number, controls: IntakeControls) {
  controls.answersRef.current = null;
  controls.activePromptRef.current = prompt;
  fetchRound(prompt, afterSeq, {}, [], controls);
}

export function submitAnswers(controls: IntakeControls, batch: PlanAnswers) {
  if (!controls.gate) return;
  const asked = uniqueQuestions([...controls.gate.asked, ...controls.gate.questions]);
  const answers = withDefaults(asked, { ...controls.gate.answers, ...batch });
  controls.answersRef.current = answers;
  fetchRound(controls.gate.prompt, controls.gate.afterSeq, answers, asked, controls);
}

export function chooseTheme(controls: IntakeControls, theme: ThemeOption) {
  if (!controls.gate) return;
  const { prompt, answers, asked, plan } = controls.gate;
  controls.setGate({ ...controls.gate, status: "sent", theme, error: null });
  controls.deliver({
    prompt,
    theme,
    ...(asked.length > 0 ? { answers, questions: asked } : {}),
    ...(plan ? { blueprintId: plan.blueprintId } : {}),
  });
}

export function retryAnswers(controls: IntakeControls) {
  if (!controls.gate || !controls.answersRef.current) return;
  const asked = uniqueQuestions([...controls.gate.asked, ...controls.gate.questions]);
  controls.setGate({ ...controls.gate, status: "sent", asked, error: null });
  controls.deliver({
    prompt: controls.gate.prompt,
    answers: controls.answersRef.current,
    questions: asked,
    ...(controls.gate.theme ? { theme: controls.gate.theme } : {}),
  });
}

export function skipQuestions(controls: IntakeControls) {
  if (!controls.gate) return;
  controls.setGate({
    ...controls.gate,
    status: "sent",
    questions: [],
    error: null,
  });
  controls.deliver({ prompt: controls.gate.prompt });
}

export function isComposerHeld(
  gate: IntakeGate | null,
  messages: readonly { seq?: number; role?: string; content: string }[],
  isSubmitting: boolean,
): boolean {
  const waitingOnTranscript = Boolean(
    gate &&
      gate.status === "sent" &&
      gate.questions.length > 0 &&
      !questionsAreInChat(messages, gate.questions, gate.afterSeq),
  );
  return (
    gate?.status === "checking" ||
    gate?.status === "asking" ||
    gate?.status === "planning" ||
    gate?.status === "reviewing-plan" ||
    gate?.status === "choosing-theme" ||
    waitingOnTranscript ||
    isSubmitting
  );
}
