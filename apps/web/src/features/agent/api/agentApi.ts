import { httpClient } from "@/shared/lib/httpClient";
import { msgSchema, sessionSchema } from "../schemas/agentSchemas";
import { z } from "zod";

export const agentApi = {
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

  getConversation: (sessionId: string, afterSeq = -1) =>
    httpClient
      .get(`/conversations/${sessionId}?afterSeq=${afterSeq}`)
      .then((r) => z.array(msgSchema).parse(r)),
  sendMessage: (sessionId: string, prompt: string) =>
    httpClient.post("/conversation", { sessionId, prompt }),
  stopConversation: (sessionId: string) =>
    httpClient.post<{ ok: boolean; stopped: boolean }>(
      `/conversation/${sessionId}/stop`,
    ),
  enhancePrompt: (prompt: string) =>
    httpClient.post<{ enhancedPrompt: string }>("/prompt/enhance", { prompt }),

  streamUrl: (sessionId: string, afterSeq: number) =>
    httpClient.streamUrl(`/stream/${sessionId}?afterSeq=${afterSeq}`),
};
