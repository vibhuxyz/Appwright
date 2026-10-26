export const AGENT_CORE_VERSION = "0.0.0";

export function hello(): { message: string } {
  return { message: "hello from @repo/agent-core" };
}

export * from "./types";
export type { Runtime } from "./runtime";
export { LocalRuntime } from "./runtime";
export type { Provider, ProviderChunk, ToolSpec } from "./providers/types";
export { FakeProvider, type ScriptedTurn } from "./providers/fake";
export type { Tool, RunAgentLoopParams, ApprovalHook } from "./loop";
export { runAgentLoop } from "./loop";
export { truncate } from "./engine/truncate";
export { consoleSink } from "./engine/sink";
export {
  DEFAULT_MODEL,
  ENDPOINTS,
  MODEL_PROVIDERS,
  providerFor,
  supportsVision,
  OpenAiProvider,
} from "./providers/openai";
export { listAvailableModels } from "./providers/list-models";
export { bestAvailableModel, bestAvailableModels } from "./providers/best-available-model";
export {
  bestModelForPlan,
  plannerModel,
  bestModelsForPlan,
  modelAllowedForPlan,
  resolveModelForPlan,
} from "./providers/model-for-plan";
export { costUsd, priceFor } from "./providers/pricing";
export {
  isProviderCreditsDepleted,
  classifyProviderFailure,
  isRetryableProviderFailure,
  PROVIDER_CREDITS_DEPLETED_NOTICE,
  type ProviderFailureKind,
} from "./providers/provider-errors";
export {
  readProviderText,
  readProviderTextWithProgress,
  isAbortError,
  ProviderOutputTooLargeError,
} from "./providers/read-provider-text";
export { buildSystemPrompt } from "./prompt";
export { formatProjectMemory } from "./project-memory";
export { loadStackStandards } from "./standards";
export { planTasks, formatPlanForAgent } from "./planner";
export { verifyTypeScript, type VerifyResult } from "./verify";
export {
  compactEarlierTurns,
  isTranscriptOnlyRow,
  serializeRow,
  toCoreMessage,
  type MessageRow,
} from "./transcript";
export { resolveStopNotice, type StopNotice } from "./notices";
export {
  createCapabilityRegistry,
  loadCapabilityConfig,
  type CapabilityConfig,
  type CapabilityRegistry,
  type ModelResolution,
} from "./capability";
export {
  buildTaskPrompt,
  generateForTask,
  type GenerateForTaskOptions,
  type GeneratedFile,
  type GenerationErrorCode,
  type GenerationResult,
  type GenerationUsage,
  type PathFence,
  type RejectedFile,
} from "./generation";
export {
  analyzeMultimodalPrompt,
  buildMultimodalAnalysisPrompt,
  extractJsonFromReply,
  escapePromptXml,
  sanitizeUntrustedAttachmentText,
  type MultimodalAnalysisError,
  type MultimodalAnalysisErrorCode,
  type MultimodalAnalysisInput,
  type MultimodalAnalysisResult,
} from "./multimodal";
