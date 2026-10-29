import type { Provider } from "@repo/agent-core";
import {
  ALLOWED_PACKAGES,
  BlueprintSchema,
  DEFAULT_DESIGN_BLOCK,
  DEFAULT_LAYOUT_BLOCK,
  DEFAULT_RESPONSIVE_BLOCK,
  type ProjectSpecification,
  type ThemeOption,
} from "@repo/contracts";
import {
  classifyIntent,
  decideArchitecture,
  detectNeeds,
  generateDesignDirections,
  planBlueprint,
  resolveRequirements,
  validateArchitectureDecisions,
  type PartialPage,
  type Plan,
} from "@repo/planner";
import { designWithTheme } from "./approved-plan";
import { createIntentClassifier } from "./classify-intent-llm";
import { generateBlueprintContent } from "./generate-content-llm";

export const BUILD_BLUEPRINT_TIMEOUT_MS = 180_000;

export class BuildBlueprintError extends Error {
  readonly code: "INTENT_FAILED" | "CONTENT_FAILED" | "PLAN_INVALID" | "TIMEOUT";

  constructor(code: BuildBlueprintError["code"], message: string) {
    super(message);
    this.name = "BuildBlueprintError";
    this.code = code;
  }
}

export type BlueprintProgress =
  | { stage: "intent" | "checking"; detail: string }
  | { stage: "pages"; detail: string; pages: readonly PartialPage[] };

export interface BuildBlueprintOptions {
  provider?: Provider;
  signal?: AbortSignal;
  directionId?: string;
  theme?: ThemeOption;
  specification?: ProjectSpecification;
  answers?: Readonly<Record<string, string>>;
  onProgress?: (progress: BlueprintProgress) => void;
}

function describeIntent(intent: { type: string; domain: string; complexity: string }): string {
  const words = (text: string) => text.replace(/[-_]+/g, " ").trim();
  return `Understood: a ${intent.complexity} ${words(intent.type)} for ${words(intent.domain)}`;
}

function reportPages(onProgress: BuildBlueprintOptions["onProgress"]) {
  return (pages: readonly PartialPage[]) => {
    const latest = pages.at(-1);
    if (latest) onProgress?.({ stage: "pages", detail: `Planning ${latest.route}`, pages });
  };
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && (error.name === "AbortError" || error.name === "TimeoutError");
}

function resolveDesignDirection(directionId: string | undefined) {
  const directions = generateDesignDirections("");
  const chosen = directionId ? directions.find((d) => d.id === directionId) : undefined;
  return chosen ?? directions.find((d) => d.isDefault) ?? directions[0];
}

async function planIntentAndContent(
  prompt: string,
  options: BuildBlueprintOptions & { signal: AbortSignal },
) {
  const { provider, specification, onProgress, signal } = options;
  const contentAbort = new AbortController();
  const [intentSettled, contentSettled] = await Promise.allSettled([
    classifyIntent(createIntentClassifier(provider), prompt, signal).then((result) => {
      if (result.ok) onProgress?.({ stage: "intent", detail: describeIntent(result.value) });
      else contentAbort.abort();
      return result;
    }),
    generateBlueprintContent({
      prompt,
      provider,
      specification,
      signal: AbortSignal.any([signal, contentAbort.signal]),
      onPages: reportPages(onProgress),
    }),
  ]);
  if (intentSettled.status === "rejected") throw intentSettled.reason;
  if (!intentSettled.value.ok) {
    throw new BuildBlueprintError("INTENT_FAILED", intentSettled.value.issues.map((issue) => issue.message).join("; "));
  }
  if (contentSettled.status === "rejected") throw contentSettled.reason;
  return { intent: intentSettled.value.value, content: contentSettled.value };
}

export async function buildBlueprint(
  prompt: string,
  options: BuildBlueprintOptions = {},
): Promise<Plan> {
  const { provider, directionId, theme, specification, answers, onProgress } = options;
  const signal = options.signal ?? AbortSignal.timeout(BUILD_BLUEPRINT_TIMEOUT_MS);
  try {
    const needs = detectNeeds(prompt);
    const architecture = decideArchitecture(needs);
    const packageIssues = validateArchitectureDecisions(architecture.decisions, ALLOWED_PACKAGES);
    if (packageIssues.length > 0) {
      throw new BuildBlueprintError(
        "PLAN_INVALID",
        packageIssues.map((issue) => issue.message).join("; "),
      );
    }

    onProgress?.({ stage: "intent", detail: "Understanding what you want to build" });
    const { intent, content } = await planIntentAndContent(prompt, { ...options, signal });
    onProgress?.({ stage: "checking", detail: `Checking ${content.pages.length} pages and splitting the build into tasks` });
    const direction = resolveDesignDirection(directionId);

    const draft = BlueprintSchema.safeParse({
      blueprintVersion: 1,
      intent,
      stack: architecture.stack,
      entities: content.entities,
      pages: content.pages,
      features: content.features,
      theme: theme ? { ...content.theme, primary: theme.palette.primary } : content.theme,
      design: designWithTheme(direction?.design ?? DEFAULT_DESIGN_BLOCK, theme),
      layout: direction?.layout ?? DEFAULT_LAYOUT_BLOCK,
      responsive: DEFAULT_RESPONSIVE_BLOCK,
    });
    if (!draft.success) {
      throw new BuildBlueprintError(
        "PLAN_INVALID",
        draft.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; "),
      );
    }

    const resolved = resolveRequirements({ blueprint: draft.data, prompt, needs, answers });
    const plan = planBlueprint(resolved.blueprint);
    if (!plan.ok) {
      throw new BuildBlueprintError(
        "PLAN_INVALID",
        plan.issues.map((issue) => issue.message).join("; "),
      );
    }
    return plan.value;
  } catch (error) {
    if (error instanceof BuildBlueprintError) throw error;
    if (isAbortError(error) || signal.aborted) {
      throw new BuildBlueprintError("TIMEOUT", "Timed out while planning the app");
    }
    throw new BuildBlueprintError(
      "CONTENT_FAILED",
      error instanceof Error ? error.message : "Could not plan the app",
    );
  }
}
