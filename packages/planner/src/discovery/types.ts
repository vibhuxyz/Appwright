import type { ProjectType } from "@repo/contracts";

export const QUESTION_INPUT_TYPES = [
  "single",
  "multiple",
  "short-text",
  "date",
  "images",
  "contacts",
] as const;
export type QuestionInputType = (typeof QUESTION_INPUT_TYPES)[number];

export const DECISION_IMPORTANCE = ["required", "optional"] as const;
export type DecisionImportance = (typeof DECISION_IMPORTANCE)[number];

export const WORKFLOW_KINDS = [
  "browse-catalog",
  "pickup-order",
  "delivery-order",
  "custom-request",
  "pop-up-locations",
  "inventory",
  "notifications",
  "admin-operations",
] as const;
export type WorkflowKind = (typeof WORKFLOW_KINDS)[number];

export interface DomainSignals {
  readonly bakery: boolean;
  readonly todoApp: boolean;
  readonly commerce: boolean;
  readonly browseOnly: boolean;
  readonly ordering: boolean;
  readonly pickup: boolean;
  readonly delivery: boolean;
  readonly customOrders: boolean;
  readonly popups: boolean;
  readonly storefront: boolean;
  readonly paymentsMentioned: boolean;
  readonly accountsMentioned: boolean;
  readonly adminMentioned: boolean;
  readonly singlePage: boolean;
  readonly existingAdmin: boolean;
  readonly existingImages: boolean;
}

export interface ExtractedFacts {
  readonly prompt: string;
  readonly projectType: ProjectType;
  readonly goals: readonly string[];
  readonly exclusions: readonly string[];
  readonly answered: Readonly<Record<string, string>>;
  readonly signals: DomainSignals;
}

export interface MaterialTopic {
  readonly id: string;
  readonly label: string;
  readonly text: string;
  readonly why: string;
  readonly importance: DecisionImportance;
  readonly inputType: QuestionInputType;
  readonly options: readonly string[];
  readonly defaultOptionIndex: number;
  readonly prefill?: Readonly<Record<string, string>>;
}

export interface DiscoveryQuestion {
  readonly need: string;
  readonly text: string;
  readonly label: string;
  readonly options: readonly string[];
  readonly defaultOptionIndex: number;
  readonly inputType: QuestionInputType;
  readonly importance: DecisionImportance;
  readonly why: string;
  readonly prefill?: Readonly<Record<string, string>>;
}

export interface WorkflowSpec {
  readonly id: string;
  readonly kind: WorkflowKind;
  readonly name: string;
  readonly inScope: boolean;
  readonly reason: string;
  readonly actors: readonly string[];
  readonly steps: readonly string[];
}

export interface DiscoveryAssumption {
  readonly topic: string;
  readonly value: string;
  readonly reason: string;
}

export interface DiscoveryState {
  readonly facts: ExtractedFacts;
  readonly workflows: readonly WorkflowSpec[];
  readonly questions: readonly DiscoveryQuestion[];
  readonly assumptions: readonly DiscoveryAssumption[];
  readonly resolved: Readonly<Record<string, string>>;
}
