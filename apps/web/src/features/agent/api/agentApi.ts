import {
  PromptQuestionsResponse,
  type ElementSelection,
  type PromptAnswerValue,
  type PromptQuestion,
} from "@repo/contracts";
import { httpClient } from "@/shared/lib/httpClient";
import {
  availableModelSchema,
  msgSchema,
  sessionPreviewSchema,
  sessionSchema,
  type Approval,
  type DiffFile,
  type MergeResult,
  type PermissionMode,
} from "../schemas/agentSchemas";
import { z } from "zod";

export const agentApi = {
  getAvailableModels: () =>
    httpClient
      .get("/models")
      .then((r) => z.array(availableModelSchema).parse(r)),
  listSessions: (projectId: string) =>
    httpClient
      .get(`/project/${projectId}/sessions`)
      .then((r) => z.array(sessionSchema).parse(r)),
  createSession: (projectId: string, title?: string) =>
    httpClient
      .post(`/project/${projectId}/session`, { title })
      .then(sessionSchema.parse),
  updateSessionModel: (id: string, model: string) =>
    httpClient.put(`/session/${id}`, { model }).then(sessionSchema.parse),
  updateSessionMode: (id: string, mode: PermissionMode) =>
    httpClient.put(`/session/${id}`, { mode }).then(sessionSchema.parse),
  startPreview: (sessionId: string, signal?: AbortSignal) =>
    httpClient
      .post(`/session/${sessionId}/preview`, undefined, signal)
      .then(sessionPreviewSchema.parse),

  getConversation: (sessionId: string, afterSeq = -1) =>
    httpClient
      .get(`/conversations/${sessionId}?afterSeq=${afterSeq}`)
      .then((r) => z.array(msgSchema).parse(r)),
  questionsFor: (prompt: string) =>
    httpClient
      .post("/conversation/questions", { prompt })
      .then((body) => PromptQuestionsResponse.parse(body).questions),
  sendMessage: (
    sessionId: string,
    prompt: string,
    answers?: Readonly<Record<string, PromptAnswerValue>>,
    questions?: readonly PromptQuestion[],
    selection?: ElementSelection,
  ) =>
    httpClient.postMaybeStream("/conversation", {
      sessionId,
      prompt,
      ...(answers ? { answers } : {}),
      ...(questions ? { questions } : {}),
      ...(selection ? { selection } : {}),
    }),
  stopConversation: (sessionId: string) =>
    httpClient.post<{ ok: boolean; stopped: boolean }>(
      `/conversation/${sessionId}/stop`,
    ),
  enhancePrompt: (prompt: string) =>
    httpClient.post<{ enhancedPrompt: string }>("/prompt/enhance", { prompt }),

  getDiff: (sessionId: string) =>
    httpClient.get<DiffFile[]>(`/session/${sessionId}/diff`),
  mergeSession: (sessionId: string) =>
    httpClient.post<MergeResult>(`/session/${sessionId}/merge`, {}),
  revertSession: (sessionId: string) =>
    httpClient.post<{ ok: boolean }>(`/session/${sessionId}/revert`, {}),

  listApprovals: (sessionId: string) =>
    httpClient.get<Approval[]>(`/approvals/${sessionId}`),
  resolveApproval: (
    approvalId: string,
    status: "APPROVED" | "DENIED",
    alwaysAllowTool?: boolean,
  ) =>
    httpClient.post<Approval>(`/approval/${approvalId}`, {
      status,
      alwaysAllowTool,
    }),

  streamUrl: (sessionId: string, afterSeq: number) =>
    httpClient.streamUrl(`/stream/${sessionId}?afterSeq=${afterSeq}`),
};
