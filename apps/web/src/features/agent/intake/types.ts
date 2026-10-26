import type { Attachment, PlanPreview, ThemeOption } from "@repo/contracts";
import type { PlanAnswers, PlanQuestion } from "@/features/plan";
import type { OutgoingMessage } from "../hooks/useSendMessage";

export type IntakeStatus = "checking" | "asking" | "planning" | "reviewing-plan" | "choosing-theme" | "sent";

export interface IntakeGate {
  prompt: string;
  status: IntakeStatus;
  questions: readonly PlanQuestion[];
  asked: readonly PlanQuestion[];
  answers: PlanAnswers;
  error: string | null;
  afterSeq: number;
  theme?: ThemeOption;
  plan?: PlanPreview;
  planFeedback?: readonly string[];
  attachments?: readonly Attachment[];
}

export interface IntakeControls {
  gate: IntakeGate | null;
  setGate: (value: IntakeGate | null | ((current: IntakeGate | null) => IntakeGate | null)) => void;
  sessionId: string | undefined;
  activePromptRef: { current: string | null };
  deliver: (message: OutgoingMessage) => void;
}
