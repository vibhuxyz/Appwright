import {
  PlanPreviewSchema,
  PromptQuestionsResponse,
  type PlanPreviewRequest,
  type ElementSelection,
  type PromptAnswerValue,
  type PromptQuestion,
  type ThemeOption,
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

export interface SendMessagePayload {
  prompt: string;
  answers?: Readonly<Record<string, PromptAnswerValue>>;
  questions?: readonly PromptQuestion[];
  selection?: ElementSelection;
  theme?: ThemeOption;
  blueprintId?: string;
}

export const agentApi = {
  getAvailableModels: (signal?: AbortSignal) =>
    httpClient
      .get("/models", signal)
      .then((r) => z.array(availableModelSchema).parse(r)),
  listSessions: (projectId: string) =>
    httpClient
      .get(`/project/${projectId}/sessions`)
      .then((r) => z.array(sessionSchema).parse(r)),
  createSession: (projectId: string) =>
    httpClient
      .post(`/project/${projectId}/session`, {})
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
  questionsFor: (
    prompt: string,
    sessionId?: string,
    answers?: Readonly<Record<string, PromptAnswerValue>>,
  ) =>
    httpClient
      .post("/conversation/questions", {
        prompt,
        sessionId,
        ...(answers && Object.keys(answers).length > 0 ? { answers } : {}),
      })
      .then((body) => {
        const parsed = PromptQuestionsResponse.safeParse(body);
        if (!parsed.success) {
          throw new Error("Could not load questions for this prompt");
        }
        return parsed.data;
      }),
  planPreview: (sessionId: string, request: PlanPreviewRequest) =>
    httpClient
      .post(`/v1/sessions/${sessionId}/plan-previews`, request)
      .then((body) => PlanPreviewSchema.parse(body)),
  sendMessage: (sessionId: string, message: SendMessagePayload) =>
    httpClient.postMaybeStream("/conversation", { sessionId, ...message }),
  stopConversation: (sessionId: string) =>
    httpClient.post<{ ok: boolean; stopped: boolean }>(
      `/conversation/${sessionId}/stop`,
    ),
  enhancePrompt: (prompt: string, signal?: AbortSignal) =>
    httpClient.post<{ enhancedPrompt: string }>(
      "/prompt/enhance",
      { prompt },
      signal,
    ),

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
