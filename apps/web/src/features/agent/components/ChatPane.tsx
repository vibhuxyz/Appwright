import { useMemo, useState } from "react";
import { resumePrompt } from "@repo/contracts";
import type { Session } from "../schemas/agentSchemas";
import { useAgentStore } from "../store/agentStore";
import { useUpdateSessionEffort, useUpdateSessionModel } from "../hooks/useSession";
import { useStopConversation } from "../hooks/useSendMessage";
import { useAttachmentUpload } from "../hooks/useAttachmentUpload";
import { IntakeDock, useIntake } from "../intake";
import { ChatDock } from "../questions";
import { deriveActiveStopNotice } from "../utils/deriveStopNotice";
import { isVerificationFailure, stopNoticeDescription } from "../utils/stopNoticePresentation";
import { Panel } from "@/shared/components/ui/Panel";
import { SelectionChip, selectionStore } from "@/features/preview";
import { PaneComposer, useComposerDraft } from "../composer";
import { usePendingAgentPrompt } from "../pending-prompt";
import { MessageList } from "./MessageList";
import { StopNoticeCard } from "./StopNoticeCard";

const ATTACHMENT_ONLY_PROMPT = "Build the application according to the attached reference designs and documents.";

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
  const [dockReopenRequest, setDockReopenRequest] = useState(0);
  const stopConversation = useStopConversation(sessionId);
  const updateModel = useUpdateSessionModel(projectId);
  const updateEffort = useUpdateSessionEffort(projectId);
  const draft = useComposerDraft(running);
  const uploads = useAttachmentUpload(projectId, sessionId);
  usePendingAgentPrompt({
    sessionId,
    isBlocked: running || intake.holdsComposer || intake.isWorking || intake.isSubmitting,
    send: (prompt) => intake.sendNow(prompt),
    fillDraft: draft.change,
  });

  const activeStopNotice = useMemo(
    () => deriveActiveStopNotice(liveStopNotice, messages, userCredits),
    [liveStopNotice, messages, userCredits],
  );

  const stop = () => {
    if (!intake.isWorking) {
      stopConversation.mutate();
      return;
    }
    const prompt = intake.cancel();
    if (prompt && draft.trimmed.length === 0) draft.change(prompt);
  };

  const send = () => {
    if (intake.isWaitingOnUser) {
      setDockReopenRequest((request) => request + 1);
      return;
    }
    const isBlocked = running || draft.enhancePrompt.isPending || intake.holdsComposer;
    if (!sessionId || (!draft.trimmed && uploads.attachments.length === 0) || isBlocked) return;
    const prompt = draft.trimmed || ATTACHMENT_ONLY_PROMPT;
    const activeAttachments = uploads.attachments;
    draft.clear();
    uploads.clearAttachments();
    const selection = selectionStore.getState().selection;
    if (selection) {
      selectionStore.getState().clearSelection();
      intake.sendNow(prompt, selection, activeAttachments);
      return;
    }
    intake.ask(prompt, activeAttachments);
  };

  return (
    <Panel className="flex flex-1 flex-col overflow-hidden bg-background">
      <MessageList
        messages={messages}
        delta={delta}
        running={running}
        statusDetail={statusDetail}
        sessionId={sessionId}
        projectId={projectId}
        onStop={stop}
        footer={
          intake.gate ? (
            <IntakeDock
              gate={intake.gate}
              messages={messages}
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
          onResume={() => intake.sendNow(resumePrompt(isVerificationFailure(activeStopNotice) ? stopNoticeDescription(activeStopNotice, userCredits) : undefined))}
          onAddCredits={onAddCredits}
        />
      )}

      <ChatDock
        projectId={projectId}
        sessionId={sessionId}
        intake={intake.dockControls}
        messages={messages}
        running={running}
        reopenRequest={dockReopenRequest}
        onSendLate={(text) => intake.sendNow(text)}
      >
        <SelectionChip />
        <PaneComposer
          input={draft.input}
          trimmed={draft.trimmed}
          running={running || intake.isWorking}
          isPaused={intake.holdsComposer && !intake.isWaitingOnUser && !intake.isWorking}
          isEnhancing={draft.enhancePrompt.isPending}
          enhancedSuccess={draft.enhancedSuccess}
          enhanceError={draft.enhancePrompt.error?.message ?? null}
          quality={draft.quality}
          tip={draft.tip}
          suggestions={draft.suggestions}
          canUndo={draft.canUndo}
          model={session?.model}
          effort={session?.effort}
          attachments={uploads.attachments}
          isUploading={uploads.isUploading}
          uploadError={uploads.uploadError}
          onUndo={draft.undo}
          onApplySuggestion={draft.applySuggestion}
          onModelChange={(model) => {
            if (session) updateModel.mutate({ sessionId: session.id, model });
          }}
          onEffortChange={(effort) => {
            if (session) updateEffort.mutate({ sessionId: session.id, effort });
          }}
          onChange={draft.change}
          onSubmit={send}
          onEnhance={draft.enhance}
          onStopEnhance={draft.enhancePrompt.cancel}
          onStop={stop}
          onAddFiles={uploads.uploadFiles}
          onRemoveAttachment={uploads.removeAttachment}
          onPaste={uploads.handlePaste}
        />
      </ChatDock>
    </Panel>
  );
}
