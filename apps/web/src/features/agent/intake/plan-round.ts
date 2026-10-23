import type { PlanAnswers, PlanQuestion } from "@/features/plan";
import { agentApi } from "../api/agentApi";
import type { IntakeControls, IntakeGate } from "./types";

interface PlanningInput {
  prompt: string;
  afterSeq: number;
  answers: PlanAnswers;
  asked: readonly PlanQuestion[];
  feedback?: string;
}

function errorText(error: unknown): string {
  return error instanceof Error ? error.message : "Could not plan the app";
}

export function beginPlanning(input: PlanningInput, controls: IntakeControls) {
  const { prompt, afterSeq, answers, asked, feedback } = input;
  const isCurrent = (current: IntakeGate | null): current is IntakeGate =>
    Boolean(current && current.prompt === prompt && current.afterSeq === afterSeq);
  const planning: IntakeGate = {
    prompt,
    status: "planning",
    questions: asked,
    asked,
    answers,
    error: null,
    afterSeq,
  };
  if (!controls.sessionId) {
    controls.setGate({ ...planning, error: "No active session" });
    return;
  }
  controls.setGate(planning);
  void agentApi
    .planPreview(controls.sessionId, {
      prompt,
      ...(asked.length > 0 ? { answers, questions: [...asked] } : {}),
      ...(feedback ? { feedback } : {}),
    })
    .then(
      (plan) => {
        controls.setGate((current) =>
          isCurrent(current) ? { ...current, status: "reviewing-plan", plan, error: null } : current,
        );
      },
      (error: unknown) => {
        controls.setGate((current) => (isCurrent(current) ? { ...current, error: errorText(error) } : current));
      },
    );
}

export function retryPlanning(controls: IntakeControls) {
  if (!controls.gate) return;
  const { prompt, afterSeq, answers, asked } = controls.gate;
  beginPlanning({ prompt, afterSeq, answers, asked }, controls);
}

export function revisePlan(controls: IntakeControls, feedback: string) {
  if (!controls.gate) return;
  const { prompt, afterSeq, answers, asked } = controls.gate;
  beginPlanning({ prompt, afterSeq, answers, asked, feedback }, controls);
}

export function approvePlan(controls: IntakeControls) {
  if (!controls.gate?.plan) return;
  controls.setGate({ ...controls.gate, status: "choosing-theme", error: null });
}
