import type { ElementSelection } from "@repo/contracts";
import { useRef, useState, type Dispatch, type SetStateAction } from "react";
import type { PlanAnswers, PlanQuestion } from "@/features/plan";
import { agentApi } from "../api/agentApi";
import { agentStore } from "../store/agentStore";
import { useSendMessage, type OutgoingMessage } from "../hooks/useSendMessage";
import { intakeLanded, questionsAreInChat } from "./chat-echo";

export interface IntakeGate {
  prompt: string;
  status: "checking" | "asking" | "sent";
  questions: readonly PlanQuestion[];
  error: string | null;
  afterSeq: number;
}

interface TranscriptMessage {
  seq?: number;
  role?: string;
  content: string;
}

type SetGate = Dispatch<SetStateAction<IntakeGate | null>>;

interface IntakeControls {
  gate: IntakeGate | null;
  setGate: SetGate;
  answersRef: { current: PlanAnswers | null };
  deliver: (message: OutgoingMessage) => void;
}

function errorText(error: unknown): string {
  return error instanceof Error ? error.message : "Could not load questions";
}

function deliverMessage(
  mutate: (message: OutgoingMessage, options: { onError: (error: Error) => void }) => void,
  setGate: SetGate,
  message: OutgoingMessage,
) {
  mutate(message, {
    onError: (error: Error) => {
      setGate((current) => {
        if (!current || current.prompt !== message.prompt) return current;
        const status = current.questions.length > 0 ? "asking" : "checking";
        return { ...current, status, error: error.message };
      });
    },
  });
}

function askQuestions(prompt: string, afterSeq: number, controls: IntakeControls) {
  controls.answersRef.current = null;
  controls.setGate({ prompt, status: "checking", questions: [], error: null, afterSeq });
  void agentApi.questionsFor(prompt).then(
    (questions) => {
      let shouldSend = false;
      controls.setGate((current) => {
        if (!current || current.prompt !== prompt || current.status !== "checking") return current;
        if (questions.length === 0) {
          shouldSend = true;
          return { prompt, status: "sent", questions: [], error: null, afterSeq };
        }
        return { prompt, status: "asking", questions, error: null, afterSeq };
      });
      if (shouldSend) controls.deliver({ prompt });
    },
    (error: unknown) => {
      controls.setGate((current) =>
        current?.prompt === prompt && current.status === "checking"
          ? { prompt, status: "checking", questions: [], error: errorText(error), afterSeq }
          : current,
      );
    },
  );
}

function submitAnswers(controls: IntakeControls, answers: PlanAnswers) {
  if (!controls.gate) return;
  controls.answersRef.current = answers;
  controls.setGate({ ...controls.gate, status: "sent", error: null });
  controls.deliver({
    prompt: controls.gate.prompt,
    answers,
    questions: controls.gate.questions,
  });
}

function retryAnswers(controls: IntakeControls) {
  if (!controls.gate || !controls.answersRef.current) return;
  controls.setGate({ ...controls.gate, status: "sent", error: null });
  controls.deliver({
    prompt: controls.gate.prompt,
    answers: controls.answersRef.current,
    questions: controls.gate.questions,
  });
}

function skipQuestions(controls: IntakeControls) {
  if (!controls.gate) return;
  controls.setGate({ ...controls.gate, status: "sent", questions: [], error: null });
  controls.deliver({ prompt: controls.gate.prompt });
}

function isComposerHeld(
  gate: IntakeGate | null,
  messages: readonly TranscriptMessage[],
  isSubmitting: boolean,
): boolean {
  const waitingOnTranscript = Boolean(
    gate &&
      gate.status === "sent" &&
      gate.questions.length > 0 &&
      !questionsAreInChat(messages, gate.questions, gate.afterSeq),
  );
  return gate?.status === "checking" || gate?.status === "asking" || waitingOnTranscript || isSubmitting;
}

export function useIntake(sessionId: string | undefined, messages: readonly TranscriptMessage[]) {
  const sendMessage = useSendMessage(sessionId);
  const [gate, setGate] = useState<IntakeGate | null>(null);
  const [trackedSessionId, setTrackedSessionId] = useState(sessionId);
  const answersRef = useRef<PlanAnswers | null>(null);
  if (trackedSessionId !== sessionId) {
    setTrackedSessionId(sessionId);
    setGate(null);
  } else if (gate && intakeLanded(messages, gate) && (gate.status === "sent" || gate.error !== null)) {
    setGate(null);
  }

  const deliver = (message: OutgoingMessage) => deliverMessage(sendMessage.mutate, setGate, message);
  const controls: IntakeControls = { gate, setGate, answersRef, deliver };
  const afterSeq = () => agentStore.getState().lastSeq;

  return {
    gate,
    ask: (prompt: string) => askQuestions(prompt, afterSeq(), controls),
    askAgain: () => {
      if (gate?.prompt) askQuestions(gate.prompt, gate.afterSeq, controls);
    },
    submit: (answers: PlanAnswers) => submitAnswers(controls, answers),
    retry: () => retryAnswers(controls),
    continueWithoutQuestions: () => skipQuestions(controls),
    sendNow: (prompt: string, selection?: ElementSelection) => {
      setGate(null);
      deliver(selection ? { prompt, selection } : { prompt });
    },
    dismiss: () => setGate(null),
    isSubmitting: sendMessage.isPending,
    holdsComposer: isComposerHeld(gate, messages, sendMessage.isPending),
  };
}
