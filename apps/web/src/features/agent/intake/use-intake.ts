import type { Attachment, ElementSelection, ThemeOption } from "@repo/contracts";
import { useRef, useState } from "react";
import type { PlanAnswers } from "@/features/plan";
import { agentStore } from "../store/agentStore";
import { useSendMessage, type OutgoingMessage } from "../hooks/useSendMessage";
import { intakeLanded } from "./chat-echo";
import {
  askQuestions,
  chooseTheme,
  fetchRound,
  isComposerHeld,
  skipQuestions,
  submitAnswers,
  type IntakeControls,
  type IntakeGate,
} from "./intake-round";
import { approvePlan, retryPlanning, revisePlan } from "./plan-round";

export type { IntakeGate };

const USER_STEPS: ReadonlySet<IntakeGate["status"]> = new Set(["asking", "reviewing-plan", "choosing-theme"]);

const WORKING_STEPS: ReadonlySet<IntakeGate["status"]> = new Set(["checking", "planning"]);

function isWorking(gate: IntakeGate | null): boolean {
  return gate !== null && gate.error === null && WORKING_STEPS.has(gate.status);
}

function isWaitingOnUser(gate: IntakeGate | null): boolean {
  return gate !== null && gate.error === null && USER_STEPS.has(gate.status);
}

interface TranscriptMessage {
  seq?: number;
  role?: string;
  content: string;
  data?: { questionReply?: { kind: string } } | null;
}

export function useIntake(sessionId: string | undefined, messages: readonly TranscriptMessage[]) {
  const sendMessage = useSendMessage(sessionId);
  const [gate, setGate] = useState<IntakeGate | null>(null);
  const [trackedSessionId, setTrackedSessionId] = useState(sessionId);
  const activePromptRef = useRef<string | null>(null);

  if (trackedSessionId !== sessionId) {
    setTrackedSessionId(sessionId);
    setGate(null);
  } else if (gate && intakeLanded(messages, gate) && (gate.status === "sent" || gate.error !== null)) {
    setGate(null);
  }

  const deliver = (message: OutgoingMessage) => {
    sendMessage.mutate(message, {
      onError: (error: Error) => {
        setGate((current) => {
          if (!current || current.prompt !== message.prompt) return current;
          const status = current.plan ? "choosing-theme" : current.questions.length > 0 ? "asking" : "checking";
          return { ...current, status, error: error.message };
        });
      },
    });
  };
  const controls: IntakeControls = {
    gate,
    setGate,
    sessionId,
    activePromptRef,
    deliver,
  };
  const afterSeq = () => agentStore.getState().lastSeq;

  const submit = (answers: PlanAnswers) => submitAnswers(controls, answers);
  const choose = (theme: ThemeOption) => chooseTheme(controls, theme);
  const approve = () => approvePlan(controls);
  const revise = (feedback: string) => revisePlan(controls, feedback);

  return {
    gate,
    dockControls: gate
      ? { gate, isSubmitting: sendMessage.isPending, submit, approvePlan: approve, revisePlan: revise, chooseTheme: choose }
      : null,
    ask: (prompt: string, attachments?: readonly Attachment[]) =>
      askQuestions(prompt, afterSeq(), controls, attachments),
    askAgain: () => {
      if (!gate?.prompt) return;
      if (gate.status === "planning") {
        retryPlanning(controls);
        return;
      }
      if (Object.keys(gate.answers).length > 0 || gate.asked.length > 0) {
        fetchRound(gate.prompt, gate.afterSeq, gate.answers, gate.asked, controls, gate.attachments);
        return;
      }
      askQuestions(gate.prompt, gate.afterSeq, controls, gate.attachments);
    },
    continueWithoutQuestions: () => skipQuestions(controls),
    cancel: (): string | null => {
      const prompt = gate?.prompt ?? null;
      activePromptRef.current = null;
      agentStore.getState().clearIntakeSteps();
      setGate(null);
      return prompt;
    },
    sendNow: (prompt: string, selection?: ElementSelection, attachments?: readonly Attachment[]) => {
      activePromptRef.current = null;
      setGate(null);
      deliver({
        prompt,
        ...(selection ? { selection } : {}),
        ...(attachments && attachments.length > 0 ? { attachments } : {}),
      });
    },
    isSubmitting: sendMessage.isPending,
    isWaitingOnUser: isWaitingOnUser(gate),
    isWorking: isWorking(gate),
    holdsComposer: isComposerHeld(gate, messages, sendMessage.isPending),
  };
}
