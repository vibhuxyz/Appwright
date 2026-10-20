import { QuestionFlow, type PlanAnswers } from "@/features/plan";
import { Button } from "@/shared/components/ui/Button";
import { UserMessageItem } from "../components/UserMessageItem";
import type { Msg } from "../schemas/agentSchemas";
import { intakeLanded, profileTitleFromPrompt, promptIsInChat, questionsAreInChat } from "./chat-echo";
import type { IntakeGate } from "./use-intake";

function pendingMessage(prompt: string): Msg {
  return {
    id: "pending-prompt",
    seq: -1,
    role: "user",
    type: "text",
    content: prompt,
    data: null,
    createdAt: "",
  };
}

export function IntakeDock({
  gate,
  messages,
  isSubmitting,
  onSubmit,
  onRetry,
  onContinue,
  onAskAgain,
}: {
  gate: IntakeGate;
  messages: readonly Msg[];
  isSubmitting: boolean;
  onSubmit: (answers: PlanAnswers) => void;
  onRetry: () => void;
  onContinue: () => void;
  onAskAgain: () => void;
}) {
  if (intakeLanded(messages, gate)) return null;
  const showPrompt = !promptIsInChat(messages, gate.prompt, gate.afterSeq);
  const showQuestions =
    gate.questions.length > 0 && !questionsAreInChat(messages, gate.questions, gate.afterSeq);
  const showChecking = gate.status === "checking" && !gate.error;
  if (!showPrompt && !showQuestions && !showChecking && !gate.error) return null;

  return (
    <div className="flex flex-col gap-3">
      {showPrompt && <UserMessageItem msg={pendingMessage(gate.prompt)} />}
      {showChecking && (
        <p className="text-sm text-muted">Choosing questions for this app…</p>
      )}
      {gate.error && !showQuestions && (
        <div className="flex flex-col gap-2 rounded-xl border border-border-soft p-3">
          <p className="text-sm text-danger">{gate.error}</p>
          <div className="flex gap-2">
            <Button type="button" size="sm" onClick={onContinue}>
              Continue in chat
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={onAskAgain}>
              Try again
            </Button>
          </div>
        </div>
      )}
      {showQuestions && (
        <QuestionFlow
          questions={gate.questions}
          profileTitle={profileTitleFromPrompt(gate.prompt)}
          isSubmitting={isSubmitting}
          error={gate.error}
          onSubmit={onSubmit}
          onRetry={onRetry}
        />
      )}
    </div>
  );
}
