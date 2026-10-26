import { useState, type ReactElement, type ReactNode } from "react";
import type { AssetRequestResponse } from "@repo/contracts";
import type { Msg } from "../../schemas/agentSchemas";
import type { LateQuestions } from "../../transcript";
import { AgentQuestionsDock, CollapsedDockBar } from "../components";
import { ImageRequestsDock } from "../image-dock";
import { IntakeQuestionsDock, type IntakeDockControls } from "../intake-dock";
import type { LiveDockGroup } from "./pick-live-group";
import { useChatDock } from "./use-chat-dock";

interface ChatDockProps {
  projectId: string;
  sessionId: string | undefined;
  intake: IntakeDockControls | null;
  messages: readonly Msg[];
  running: boolean;
  reopenRequest: number;
  onSendLate: (text: string) => void;
  children: ReactNode;
}

interface LiveDockInput {
  live: LiveDockGroup;
  projectId: string;
  sessionId: string | undefined;
  intake: IntakeDockControls | null;
  assetRequests: readonly AssetRequestResponse[];
  onCollapse: () => void;
}

function liveDockElement({ live, projectId, sessionId, intake, assetRequests, onCollapse }: LiveDockInput): ReactElement | null {
  if (live.kind === "intake") return intake ? <IntakeQuestionsDock key={live.key} controls={intake} onCollapse={onCollapse} /> : null;
  if (!sessionId) return null;
  if (live.kind === "agent") return <AgentQuestionsDock key={live.key} projectId={projectId} sessionId={sessionId} onCollapse={onCollapse} />;
  return <ImageRequestsDock key={live.key} sessionId={sessionId} projectId={projectId} requests={assetRequests} onCollapse={onCollapse} />;
}

interface LateDockInput {
  late: LateQuestions;
  projectId: string;
  sessionId: string;
  running: boolean;
  onSendLate: (text: string) => void;
  onCollapse: () => void;
}

function lateDockElement({ late, projectId, sessionId, running, onSendLate, onCollapse }: LateDockInput): ReactElement {
  return (
    <AgentQuestionsDock
      key={late.id}
      projectId={projectId}
      sessionId={sessionId}
      late={{ questions: late, target: { isBlocked: running, send: onSendLate } }}
      onCollapse={onCollapse}
    />
  );
}

function useCollapsedKey(reopenRequest: number) {
  const [collapsedKey, setCollapsedKey] = useState<string | null>(null);
  const [seenReopenRequest, setSeenReopenRequest] = useState(reopenRequest);
  if (seenReopenRequest !== reopenRequest) {
    setSeenReopenRequest(reopenRequest);
    setCollapsedKey(null);
  }
  return [collapsedKey, setCollapsedKey] as const;
}

function expandHandler(input: {
  live: LiveDockGroup | null;
  late: LateQuestions | null;
  expandLive: () => void;
  openLate: (lateId: string) => void;
}): (() => void) | null {
  const { live, late } = input;
  if (live) return input.expandLive;
  return late ? () => input.openLate(late.id) : null;
}

export function ChatDock({ projectId, sessionId, intake, messages, running, reopenRequest, onSendLate, children }: ChatDockProps) {
  const { live, late, pendingAssetRequests } = useChatDock({ projectId, sessionId, gate: intake?.gate ?? null, messages, running });
  const [collapsedKey, setCollapsedKey] = useCollapsedKey(reopenRequest);
  const [openLateId, setOpenLateId] = useState<string | null>(null);
  const liveDock = live
    ? liveDockElement({ live, projectId, sessionId, intake, assetRequests: pendingAssetRequests, onCollapse: () => setCollapsedKey(live.key) })
    : null;
  const isLiveOpen = liveDock !== null && live?.key !== collapsedKey;
  if (!live && late && sessionId && openLateId === late.id) {
    return lateDockElement({ late, projectId, sessionId, running, onSendLate, onCollapse: () => setOpenLateId(null) });
  }
  const expand = expandHandler({ live, late, expandLive: () => setCollapsedKey(null), openLate: setOpenLateId });
  return (
    <>
      {liveDock && <div hidden={!isLiveOpen} className={isLiveOpen ? "contents" : undefined}>{liveDock}</div>}
      {!isLiveOpen && (expand ? <CollapsedDockBar onExpand={expand}>{children}</CollapsedDockBar> : children)}
    </>
  );
}
