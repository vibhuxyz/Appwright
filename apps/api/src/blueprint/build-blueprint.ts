import type { Provider } from "@repo/agent-core";
import {
  ALLOWED_PACKAGES,
  DEFAULT_DESIGN_BLOCK,
  DEFAULT_LAYOUT_BLOCK,
  DEFAULT_RESPONSIVE_BLOCK,
} from "@repo/contracts";
import {
  classifyIntent,
  decideArchitecture,
  detectNeeds,
  generateDesignDirections,
  planBlueprint,
  validateArchitectureDecisions,
  type Plan,
} from "@repo/planner";
import { createIntentClassifier } from "./classify-intent-llm";
import { generateBlueprintContent } from "./generate-content-llm";

export const BUILD_BLUEPRINT_TIMEOUT_MS = 30_000;

export class BuildBlueprintError extends Error {
  readonly code: "INTENT_FAILED" | "CONTENT_FAILED" | "PLAN_INVALID" | "TIMEOUT";

  constructor(code: BuildBlueprintError["code"], message: string) {
    super(message);
    this.name = "BuildBlueprintError";
    this.code = code;
  }
}

export interface BuildBlueprintOptions {
  provider?: Provider;
  signal?: AbortSignal;
  // Slice 3b — the id of a design direction the user picked in the design
  // review step (see @repo/planner's generateDesignDirections). Falls back
  // to the default direction when absent or unrecognised.
  directionId?: string;
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && (error.name === "AbortError" || error.name === "TimeoutError");
}

function resolveDesignDirection(directionId: string | undefined) {
  const directions = generateDesignDirections("");
  const chosen = directionId ? directions.find((d) => d.id === directionId) : undefined;
  return chosen ?? directions.find((d) => d.isDefault) ?? directions[0];
}

export async function buildBlueprint(
  prompt: string,
  options: BuildBlueprintOptions = {},
): Promise<Plan> {
  const { provider, directionId } = options;
  const signal = options.signal ?? AbortSignal.timeout(BUILD_BLUEPRINT_TIMEOUT_MS);
  try {
    const intentResult = await classifyIntent(createIntentClassifier(provider), prompt, signal);
    if (!intentResult.ok) {
      throw new BuildBlueprintError(
        "INTENT_FAILED",
        intentResult.issues.map((issue) => issue.message).join("; "),
      );
    }

    const needs = detectNeeds(prompt);
    const architecture = decideArchitecture(needs);
    const packageIssues = validateArchitectureDecisions(architecture.decisions, ALLOWED_PACKAGES);
    if (packageIssues.length > 0) {
      throw new BuildBlueprintError(
        "PLAN_INVALID",
        packageIssues.map((issue) => issue.message).join("; "),
      );
    }

    const content = await generateBlueprintContent(prompt, signal, provider);
    const direction = resolveDesignDirection(directionId);

    const plan = planBlueprint({
      blueprintVersion: 1,
      intent: intentResult.value,
      stack: architecture.stack,
      entities: content.entities,
      pages: content.pages,
      features: content.features,
      theme: content.theme,
      design: direction?.design ?? DEFAULT_DESIGN_BLOCK,
      layout: direction?.layout ?? DEFAULT_LAYOUT_BLOCK,
      responsive: DEFAULT_RESPONSIVE_BLOCK,
    });
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
