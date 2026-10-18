export { planBlueprint, type Plan } from "./plan";
export { validateBlueprint } from "./blueprint";
export { compileTasks, type TaskSpec } from "./compile";
export { validateTaskGraph, type ValidatedGraph } from "./validate";
export {
  buildTaskGraph,
  topologicalLevels,
  CycleDetectedError,
} from "./task-graph";
export {
  canonicalizeDeclaration,
  resourcesOverlap,
  anyResourceOverlaps,
  InvalidOwnershipDeclarationError,
} from "./ownership";
export { capabilityFor, riskTierFor, verificationFor } from "./task-policy";
export type { PlanIssue, PlanResult } from "./shared";
export {
  detectNeeds,
  selectQuestions,
  applyAnswers,
  NEED_NAMES,
  type DetectedNeed,
  type NeedName,
  type Needs,
  type Question,
} from "./requirements";
export { createWriteFence, type FenceDecision, type WriteFence } from "./write-fence";
export {
  assembleContext,
  DEFAULT_MAX_CONTEXT_BYTES,
  type AssembleOptions,
  type AssembledContext,
  type ContextSection,
  type ContextSectionKind,
  type DroppedSection,
} from "./context";
export {
  decideArchitecture,
  type ArchitectureDecision,
  type FrozenArchitecture,
} from "./architecture";
