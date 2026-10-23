import type { ThemeOption } from "@repo/contracts";
import { QuestionFlow, type PlanAnswers } from "@/features/plan";
import { flattenThemeAnswers, flattenThemeQuestions, ThemePicker } from "@/features/theme";
import { Button } from "@/shared/components/ui/Button";
import { UserMessageItem } from "../components/UserMessageItem";
import type { Msg } from "../schemas/agentSchemas";
import { intakeLanded, profileTitleFromPrompt, promptIsInChat, questionsAreInChat } from "./chat-echo";
import { PlanReview } from "./PlanReview";
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

function dockFlags(gate: IntakeGate, messages: readonly Msg[]) {
  return {
    showPrompt: !promptIsInChat(messages, gate.prompt, gate.afterSeq),
    showQuestions:
      gate.status === "asking" &&
      gate.questions.length > 0 &&
      !questionsAreInChat(messages, gate.questions, gate.afterSeq),
    showChecking: gate.status === "checking" && !gate.error,
    showPlanning: gate.status === "planning" && !gate.error,
    showPlan: gate.status === "reviewing-plan" && Boolean(gate.plan),
    showThemes: gate.status === "choosing-theme",
    showError: Boolean(gate.error),
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
  onChooseTheme,
  onApprovePlan,
  onRevisePlan,
}: {
  gate: IntakeGate;
  messages: readonly Msg[];
  isSubmitting: boolean;
  onSubmit: (answers: PlanAnswers) => void;
  onRetry: () => void;
  onContinue: () => void;
  onAskAgain: () => void;
  onChooseTheme: (theme: ThemeOption) => void;
  onApprovePlan: () => void;
  onRevisePlan: (feedback: string) => void;
}) {
  if (intakeLanded(messages, gate)) return null;
  const flags = dockFlags(gate, messages);
  const { showPrompt, showQuestions, showChecking, showPlanning, showPlan, showThemes, showError } = flags;
  if (!Object.values(flags).some(Boolean)) return null;

  return (
    <div className="flex flex-col gap-3">
      {showPrompt && <UserMessageItem msg={pendingMessage(gate.prompt)} />}
      {showChecking && (
        <p className="text-sm text-muted">
          {gate.asked.length > 0
            ? "Checking your answers for anything still open…"
            : "Choosing questions for this app…"}
        </p>
      )}
      {showError && !showQuestions && (
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
      {showPlanning && (
        <p className="text-sm text-muted">
          Planning every page, section and image from your answers…
        </p>
      )}
      {showPlan && gate.plan && (
        <PlanReview plan={gate.plan} onApprove={onApprovePlan} onRevise={onRevisePlan} />
      )}
      {showThemes && (
        <ThemePicker
          request={{
            prompt: gate.prompt,
            answers: flattenThemeAnswers(gate.answers),
            questions: flattenThemeQuestions(gate.asked),
            ...(gate.plan ? { plan: { pages: gate.plan.pages, features: gate.plan.features } } : {}),
          }}
          isSubmitting={isSubmitting}
          onChoose={onChooseTheme}
        />
      )}
      {showQuestions && (
        <QuestionFlow
          key={gate.questions.map((question) => question.need).join("|")}
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
