import type { ElementSelection } from "@repo/contracts";
import { useRef, useState } from "react";
import type { PlanAnswers } from "@/features/plan";
import { agentStore } from "../store/agentStore";
import { useSendMessage, type OutgoingMessage } from "../hooks/useSendMessage";
import { intakeLanded } from "./chat-echo";
import type { ThemeOption } from "@repo/contracts";
import {
  askQuestions,
  chooseTheme,
  fetchRound,
  isComposerHeld,
  retryAnswers,
  skipQuestions,
  submitAnswers,
  type IntakeControls,
  type IntakeGate,
} from "./intake-round";
import { approvePlan, retryPlanning, revisePlan } from "./plan-round";

export type { IntakeGate };

interface TranscriptMessage {
  seq?: number;
  role?: string;
  content: string;
}

export function useIntake(sessionId: string | undefined, messages: readonly TranscriptMessage[]) {
  const sendMessage = useSendMessage(sessionId);
  const [gate, setGate] = useState<IntakeGate | null>(null);
  const [trackedSessionId, setTrackedSessionId] = useState(sessionId);
  const answersRef = useRef<PlanAnswers | null>(null);
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
    answersRef,
    sessionId,
    activePromptRef,
    deliver,
  };
  const afterSeq = () => agentStore.getState().lastSeq;

  return {
    gate,
    ask: (prompt: string) => askQuestions(prompt, afterSeq(), controls),
    approvePlan: () => approvePlan(controls),
    revisePlan: (feedback: string) => revisePlan(controls, feedback),
    askAgain: () => {
      if (!gate?.prompt) return;
      if (gate.status === "planning") {
        retryPlanning(controls);
        return;
      }
      if (Object.keys(gate.answers).length > 0 || gate.asked.length > 0) {
        fetchRound(gate.prompt, gate.afterSeq, gate.answers, gate.asked, controls);
        return;
      }
      askQuestions(gate.prompt, gate.afterSeq, controls);
    },
    submit: (answers: PlanAnswers) => submitAnswers(controls, answers),
    chooseTheme: (theme: ThemeOption) => chooseTheme(controls, theme),
    retry: () => retryAnswers(controls),
    continueWithoutQuestions: () => skipQuestions(controls),
    sendNow: (prompt: string, selection?: ElementSelection) => {
      activePromptRef.current = null;
      setGate(null);
      deliver(selection ? { prompt, selection } : { prompt });
    },
    dismiss: () => {
      activePromptRef.current = null;
      setGate(null);
    },
    isSubmitting: sendMessage.isPending,
    holdsComposer: isComposerHeld(gate, messages, sendMessage.isPending),
  };
}
