import { useMemo, useState } from "react";
import { Plus, Sparkles } from "lucide-react";
import type { Session } from "../schemas/agentSchemas";
import { useAgentStore, agentStore } from "../store/agentStore";
import { useCreateSession, useUpdateSessionModel } from "../hooks/useSession";
import { useEnhancePrompt, useSendMessage, useStopConversation } from "../hooks/useSendMessage";
import { deriveActiveStopNotice } from "../utils/deriveStopNotice";
import { evaluatePrompt } from "../utils/evaluatePrompt";
import { getPromptSuggestions } from "../utils/promptSuggestions";
import { Panel } from "@/shared/components/ui/Panel";
import { Badge } from "@/shared/components/ui/Badge";
import { MessageList } from "./MessageList";
import { RunStatusBar } from "./RunStatusBar";
import { StopNoticeCard } from "./StopNoticeCard";
import { PromptSuggestionBar } from "./PromptSuggestionBar";
import { ChatInput } from "./ChatInput";

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

  const sendMessage = useSendMessage(sessionId);
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

  const submit = (prompt: string) => {
    sendMessage.mutate(prompt);
  };

  const send = () => {
    if (!trimmed || running || enhancePrompt.isPending) return;
    submit(trimmed);
    setInput("");
    setPrevInput(null);
    setEnhancedSuccess(false);
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
    createSession.mutate(undefined, {
      onSuccess: () => agentStore.getState().reset([], false, ""),
    });
  };

  return (
    <Panel className="flex-1">
      <header className="shrink-0 border-b border-border-soft px-4 pt-4 pb-3.5">
        <div className="flex items-center gap-2.5">
          <Sparkles className="size-5 text-pink-light" />
          <span className="text-[15px] font-semibold text-foreground">Appwright AI</span>
          <Badge tone="premium">Beta</Badge>
          <button
            type="button"
            onClick={startNewChat}
            disabled={running || createSession.isPending}
            className="ml-auto flex cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-[13px] text-foreground-secondary transition-colors hover:bg-surface-3 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Plus className="size-3.5" /> New Chat
          </button>
        </div>
        <p className="mt-2 truncate text-[13px] text-muted">
          Build, edit, and improve your app with AI.
        </p>
      </header>

      <RunStatusBar
        running={running}
        statusDetail={statusDetail}
        activeStopNotice={activeStopNotice}
        userCredits={userCredits}
        onStop={() => stopConversation.mutate()}
        onResume={() => submit(RESUME_PROMPT)}
        onAddCredits={onAddCredits}
      />

      <MessageList
        messages={messages}
        delta={delta}
        running={running}
        statusDetail={statusDetail}
        onStop={() => stopConversation.mutate()}
      />

      {activeStopNotice && !running && (
        <StopNoticeCard
          notice={activeStopNotice}
          userCredits={userCredits}
          onResume={() => submit(RESUME_PROMPT)}
          onAddCredits={onAddCredits}
        />
      )}

      {trimmed.length > 0 && (
        <PromptSuggestionBar
          tip={tip}
          suggestions={suggestions}
          canUndo={prevInput !== null}
          onUndo={() => {
            if (prevInput !== null) {
              setInput(prevInput);
              setPrevInput(null);
              setEnhancedSuccess(false);
            }
          }}
          onApplySuggestion={handleApplySuggestion}
        />
      )}

      <ChatInput
        input={input}
        running={running}
        isEnhancing={enhancePrompt.isPending}
        enhancedSuccess={enhancedSuccess}
        enhanceError={enhancePrompt.error?.message ?? null}
        quality={quality}
        model={session?.model}
        onModelChange={(model) => {
          if (session) updateModel.mutate({ sessionId: session.id, model });
        }}
        onChange={setInput}
        onSubmit={send}
        onEnhance={handleEnhance}
        onStop={() => stopConversation.mutate()}
      />
    </Panel>
  );
}
