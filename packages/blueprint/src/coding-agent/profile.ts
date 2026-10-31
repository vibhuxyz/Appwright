import { resolveRunModel, type AutoProfile } from "@repo/agent-core";
import type { EffortLevel, PlanId } from "@repo/contracts";

export interface CodingProfile {
  readonly id: "ui" | "auth" | "integration" | "data" | "general";
  readonly label: string;
  readonly envKey: string;
  readonly brief: string;
}

const UI_TYPES: ReadonlySet<string> = new Set([
  "page",
  "component",
  "app-shell",
  "layout",
  "design-system",
  "typography",
  "responsive",
  "visual-verification",
]);

const INTEGRATION_TYPES: ReadonlySet<string> = new Set(["payment", "api", "media", "security", "admin"]);
const DATA_TYPES: ReadonlySet<string> = new Set(["schema", "migration", "seed"]);

const UI_PROFILE: CodingProfile = {
  id: "ui",
  label: "UI Agent",
  envKey: "UI_AGENT_MODEL",
  brief: "You are the UI agent. Implement only the listed sections with the existing primitives. Do not add auth, payments, a database, or a new design system.",
};

const AUTH_PROFILE: CodingProfile = {
  id: "auth",
  label: "Auth Agent",
  envKey: "AUTH_AGENT_MODEL",
  brief: "You are the auth agent. Keep sessions and route protection on the server. Use the Appwrite auth gateway. Do not invent a second login system or put tokens in client code.",
};

const INTEGRATION_PROFILE: CodingProfile = {
  id: "integration",
  label: "Integration Agent",
  envKey: "INTEGRATION_AGENT_MODEL",
  brief: "You are the integration agent. Call the Appwrite gateway for payments, email, and uploads. Do not install a provider SDK or place secrets in client code.",
};

const DATA_PROFILE: CodingProfile = {
  id: "data",
  label: "Data Agent",
  envKey: "DATA_AGENT_MODEL",
  brief: "You are the data agent. Change only the schema, migration, or seed this task owns. Do not redesign pages.",
};

const GENERAL_PROFILE: CodingProfile = {
  id: "general",
  label: "Coding Agent",
  envKey: "CODING_AGENT_MODEL",
  brief: "",
};

export function codingProfileFor(type: string): CodingProfile {
  const key = type.toLowerCase().replaceAll("_", "-");
  if (UI_TYPES.has(key)) return UI_PROFILE;
  if (key === "auth") return AUTH_PROFILE;
  if (INTEGRATION_TYPES.has(key)) return INTEGRATION_PROFILE;
  if (DATA_TYPES.has(key)) return DATA_PROFILE;
  return GENERAL_PROFILE;
}

export interface CodingModelOptions {
  readonly plan: PlanId;
  readonly complexity?: number;
  readonly confidence?: number;
  readonly intent?: string;
  readonly effort?: EffortLevel;
}

function autoProfileOf(id: CodingProfile["id"]): AutoProfile {
  return id === "general" ? "coding" : id;
}

export function codingModelFor(
  profile: CodingProfile,
  sessionModel: string,
  env: NodeJS.Dict<string> = process.env,
  options?: CodingModelOptions,
): string {
  const configured = env[profile.envKey]?.trim();
  if (configured && configured.length > 0) return configured;
  if (!options) return sessionModel;
  return resolveRunModel({
    sessionModel,
    plan: options.plan,
    profile: autoProfileOf(profile.id),
    env,
    ...(options.complexity !== undefined ? { complexity: options.complexity } : {}),
    ...(options.confidence !== undefined ? { confidence: options.confidence } : {}),
    ...(options.intent !== undefined ? { intent: options.intent } : {}),
    ...(options.effort !== undefined ? { effort: options.effort } : {}),
  });
}

export function withCodingBrief(brief: string, prompt: string): string {
  if (brief.length === 0) return prompt;
  return `${brief}\n\n${prompt}`;
}

export function delegatedStatus(entries: readonly { title: string; label: string }[]): string {
  if (entries.length === 0) return "Building…";
  const labels = [...new Set(entries.map((entry) => entry.label))].sort();
  const titles = entries.map((entry) => entry.title).sort();
  return `Delegated to ${labels.join(", ")}: ${titles.join(", ")}`;
}
