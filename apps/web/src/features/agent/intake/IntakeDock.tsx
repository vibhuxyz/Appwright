import { Map as MapIcon } from "lucide-react";
import { Button } from "@/shared/components/ui/Button";
import { UserMessageItem } from "../components/UserMessageItem";
import type { Msg } from "../schemas/agentSchemas";
import type { IntakeStep } from "../store/agentStore";
import { AgentBlock, PlanDecisionBubble, QuestionCard, QuestionReplyBubble, ThemeChoiceCard } from "../transcript";
import { intakeLanded, promptIsInChat } from "./chat-echo";
import { IntakeProgressRows } from "./IntakeProgressRows";
import { intakeQuestionCard, intakeReply } from "./intake-transcript";
import { ThemeStatus } from "./ThemeStatus";
import { WaitingCard } from "./WaitingCard";
import type { IntakeGate } from "./use-intake";

const DOCK_STATUSES: ReadonlySet<IntakeGate["status"]> = new Set(["asking", "reviewing-plan", "choosing-theme"]);

function pendingMessage(prompt: string, attachments: IntakeGate["attachments"]): Msg {
  const data = attachments && attachments.length > 0 ? { attachments: [...attachments] } : null;
  return { id: "pending-prompt", seq: -1, role: "user", type: "text", content: prompt, data, createdAt: "" };
}

interface IntakeProgressStart {
  first: IntakeStep;
  narration: string;
}

function progressStart(gate: IntakeGate): IntakeProgressStart | null {
  if (gate.error) return null;
  const hasAnswers = gate.asked.length > 0;
  if (gate.status === "checking") {
    return {
      first: { tool: "request", detail: hasAnswers ? "Reading your answers" : "Reading your request", items: [] },
      narration: hasAnswers ? "Thanks — I'm checking whether anything is still open." : "I'm reading your request to work out what to ask before I build.",
    };
  }
  if (gate.status === "planning") {
    return {
      first: { tool: "planner", detail: hasAnswers ? "Sending your answers to the planner" : "Starting the plan", items: [] },
      narration: "I'm planning every page, section and image for this app.",
    };
  }
  return null;
}

function isPlanApproved(gate: IntakeGate): boolean {
  return Boolean(gate.plan) && (gate.status === "choosing-theme" || gate.status === "sent");
}

function planDecisionShown(gate: IntakeGate): boolean {
  return isPlanApproved(gate) || (gate.planFeedback ?? []).length > 0;
}

function ErrorRow({ error, onContinue, onAskAgain }: { error: string; onContinue: () => void; onAskAgain: () => void }) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border-soft p-3">
      <p role="alert" className="text-sm text-danger">{error}</p>
      <div className="flex gap-2">
        <Button type="button" size="sm" onClick={onContinue}>Continue in chat</Button>
        <Button type="button" variant="outline" size="sm" onClick={onAskAgain}>Try again</Button>
      </div>
    </div>
  );
}

export function IntakeDock({
  gate,
  messages,
  onContinue,
  onAskAgain,
}: {
  gate: IntakeGate;
  messages: readonly Msg[];
  onContinue: () => void;
  onAskAgain: () => void;
}) {
  if (intakeLanded(messages, gate)) return null;
  const progress = progressStart(gate);
  const isAsking = gate.status === "asking" && gate.questions.length > 0;
  const showError = Boolean(gate.error) && !DOCK_STATUSES.has(gate.status);

  return (
    <div className="flex flex-col gap-5">
      {!promptIsInChat(messages, gate.prompt, gate.afterSeq) && <UserMessageItem msg={pendingMessage(gate.prompt, gate.attachments)} />}
      {gate.asked.length > 0 && (
        <>
          <AgentBlock text={null}><QuestionCard card={intakeQuestionCard(gate.asked, "answered")} /></AgentBlock>
          <QuestionReplyBubble reply={intakeReply(gate.asked, gate.answers)} />
        </>
      )}
      {isAsking && (
        <AgentBlock text="I'm ready to build this; first I'll confirm the essentials so it feels accurate.">
          <QuestionCard key={gate.questions.map((question) => question.need).join("|")} card={intakeQuestionCard(gate.questions, "waiting")} />
        </AgentBlock>
      )}
      {(planDecisionShown(gate)) && <PlanDecisionBubble feedback={gate.planFeedback ?? []} isApproved={isPlanApproved(gate)} />}
      {gate.status === "reviewing-plan" && gate.plan && !gate.error && (
        <WaitingCard icon={MapIcon} narration="The plan is ready. Take a look before I build anything." title="Plan ready — waiting for your approval" />
      )}
      {gate.status === "choosing-theme" && !gate.error && <ThemeStatus gate={gate} />}
      {gate.status === "sent" && gate.theme && <ThemeChoiceCard theme={gate.theme} />}
      {progress && <IntakeProgressRows first={progress.first} narration={progress.narration} />}
      {showError && gate.error && <ErrorRow error={gate.error} onContinue={onContinue} onAskAgain={onAskAgain} />}
    </div>
  );
}
