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
  MODEL_PROVIDERS,
  providerFor,
  OpenAiProvider,
} from "./providers/openai";
export { costUsd, priceFor } from "./providers/pricing";
export { buildSystemPrompt } from "./prompt";
export { planTasks, formatPlanForAgent } from "./planner";
export { verifyTypeScript, type VerifyResult } from "./verify";
export { serializeRow, toCoreMessage, type MessageRow } from "./transcript";
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
