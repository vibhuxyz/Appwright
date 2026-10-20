import { useMemo, useState } from "react";
import type { Session } from "../schemas/agentSchemas";
import { useAgentStore, agentStore } from "../store/agentStore";
import { useCreateSession, useUpdateSessionModel } from "../hooks/useSession";
import { useEnhancePrompt, useStopConversation } from "../hooks/useSendMessage";
import { IntakeDock, useIntake } from "../intake";
import { deriveActiveStopNotice } from "../utils/deriveStopNotice";
import { evaluatePrompt } from "../utils/evaluatePrompt";
import { getPromptSuggestions } from "../utils/promptSuggestions";
import { Panel } from "@/shared/components/ui/Panel";
import { SelectionChip, selectionStore } from "@/features/preview";
import { ChatPaneHeader, PaneComposer } from "../composer";
import { MessageList } from "./MessageList";
import { StopNoticeCard } from "./StopNoticeCard";

const RESUME_PROMPT = "Continue building the remaining tasks in the plan until complete.";

export function ChatPane({
  projectId,
  session,
  userCredits,
  onAddCredits,
}: {
  projectId: string;
  session: Session | undefined;
  userCredits: number;
  onAddCredits: () => void;
}) {
  const sessionId = session?.id;
  const messages = useAgentStore((s) => s.messages);
  const delta = useAgentStore((s) => s.delta);
  const running = useAgentStore((s) => s.running);
  const statusDetail = useAgentStore((s) => s.statusDetail);
  const liveStopNotice = useAgentStore((s) => s.stopNotice);

  const intake = useIntake(sessionId, messages);
  const stopConversation = useStopConversation(sessionId);
  const enhancePrompt = useEnhancePrompt();
  const createSession = useCreateSession(projectId);
  const updateModel = useUpdateSessionModel(projectId);

  const [input, setInput] = useState("");
  const [prevInput, setPrevInput] = useState<string | null>(null);
  const [enhancedSuccess, setEnhancedSuccess] = useState(false);

  const trimmed = input.trim();
  const { quality, tip } = evaluatePrompt(trimmed, enhancedSuccess);
  const suggestions = useMemo(() => getPromptSuggestions(trimmed), [trimmed]);

  const activeStopNotice = useMemo(
    () => deriveActiveStopNotice(liveStopNotice, messages, userCredits),
    [liveStopNotice, messages, userCredits],
  );

  const send = () => {
    if (!trimmed || running || enhancePrompt.isPending || intake.holdsComposer) return;
    const prompt = trimmed;
    setInput("");
    setPrevInput(null);
    setEnhancedSuccess(false);
    const selection = selectionStore.getState().selection;
    if (selection) {
      selectionStore.getState().clearSelection();
      intake.sendNow(prompt, selection);
      return;
    }
    intake.ask(prompt);
  };

  const handleEnhance = () => {
    if (!trimmed || enhancePrompt.isPending || running) return;
    enhancePrompt.mutate(trimmed, {
      onSuccess: (res) => {
        setPrevInput(trimmed);
        setInput(res.enhancedPrompt);
        setEnhancedSuccess(true);
      },
    });
  };

  const handleApplySuggestion = (appendText: string) => {
    setInput((curr) => {
      const t = curr.trim();
      return t ? `${t}${appendText}` : appendText.trim();
    });
  };

  const startNewChat = () => {
    if (running || createSession.isPending) return;
    intake.dismiss();
    createSession.mutate(undefined, {
      onSuccess: () => agentStore.getState().reset([], false, ""),
    });
  };

  return (
    <Panel className="flex flex-1 flex-col overflow-hidden bg-background">
      <ChatPaneHeader isBusy={running || createSession.isPending} onNewChat={startNewChat} />

      <MessageList
        messages={messages}
        delta={delta}
        running={running}
        statusDetail={statusDetail}
        sessionId={sessionId}
        projectId={projectId}
        onStop={() => stopConversation.mutate()}
        footer={
          intake.gate ? (
            <IntakeDock
              gate={intake.gate}
              messages={messages}
              isSubmitting={intake.isSubmitting}
              onSubmit={intake.submit}
              onRetry={intake.retry}
              onContinue={intake.continueWithoutQuestions}
              onAskAgain={intake.askAgain}
            />
          ) : null
        }
      />

      {activeStopNotice && !running && (
        <StopNoticeCard
          notice={activeStopNotice}
          userCredits={userCredits}
          onResume={() => intake.sendNow(RESUME_PROMPT)}
          onAddCredits={onAddCredits}
        />
      )}

      {!intake.holdsComposer && <SelectionChip />}

      {!intake.holdsComposer && (
        <PaneComposer
          input={input}
          trimmed={trimmed}
          running={running}
          isEnhancing={enhancePrompt.isPending}
          enhancedSuccess={enhancedSuccess}
          enhanceError={enhancePrompt.error?.message ?? null}
          quality={quality}
          tip={tip}
          suggestions={suggestions}
          canUndo={prevInput !== null}
          model={session?.model}
          onUndo={() => {
            if (prevInput !== null) {
              setInput(prevInput);
              setPrevInput(null);
              setEnhancedSuccess(false);
            }
          }}
          onApplySuggestion={handleApplySuggestion}
          onModelChange={(model) => {
            if (session) updateModel.mutate({ sessionId: session.id, model });
          }}
          onChange={(value) => {
            setInput(value);
            setEnhancedSuccess(false);
          }}
          onSubmit={send}
          onEnhance={handleEnhance}
          onStop={() => stopConversation.mutate()}
        />
      )}
    </Panel>
  );
}
