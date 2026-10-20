import {
  BuildBlueprintResponse,
  DesignDirectionsResponse,
  LatestBlueprintRunResponse,
} from "@repo/contracts";
import { httpClient } from "@/shared/lib/httpClient";
import { planContractSchema } from "../schemas/plan-contract";
import {
  blueprintSchema,
  runSchema,
  taskAttemptsSchema,
} from "../schemas/plan-schemas";

export const planApi = {
  getRun: (runId: string, signal?: AbortSignal) =>
    httpClient.get(`/v1/runs/${runId}`, signal).then(runSchema.parse),
  getPlan: (runId: string, signal?: AbortSignal) =>
    httpClient.get(`/v1/runs/${runId}/plan`, signal).then(planContractSchema.parse),
  getBlueprint: (blueprintId: string, signal?: AbortSignal) =>
    httpClient.get(`/v1/blueprints/${blueprintId}`, signal).then(blueprintSchema.parse),
  getTaskAttempts: (runId: string, taskId: string, signal?: AbortSignal) =>
    httpClient
      .get(`/v1/runs/${runId}/tasks/${taskId}/attempts`, signal)
      .then(taskAttemptsSchema.parse)
      .then((body) => body.attempts),
  getLatestBlueprintRun: (sessionId: string, signal?: AbortSignal) =>
    httpClient
      .get(`/v1/sessions/${sessionId}/blueprint-run`, signal)
      .then((body) => (body === null ? null : LatestBlueprintRunResponse.parse(body))),
  buildBlueprint: (sessionId: string, prompt: string, directionId?: string) =>
    httpClient
      .post(`/sessions/${sessionId}/blueprint`, { prompt, ...(directionId ? { directionId } : {}) })
      .then(BuildBlueprintResponse.parse),
  stopRun: (runId: string) =>
    httpClient.post<{ ok: boolean; stopped: boolean }>(`/v1/runs/${runId}/stop`),
  getDesignDirections: (prompt: string, signal?: AbortSignal) =>
    httpClient
      .get(`/v1/design-directions?prompt=${encodeURIComponent(prompt)}`, signal)
      .then((body) => DesignDirectionsResponse.parse(body).directions),
};
