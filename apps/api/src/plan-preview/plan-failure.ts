import { isProviderCreditsDepleted, PROVIDER_CREDITS_DEPLETED_NOTICE } from "@repo/agent-core";
import { BuildBlueprintError } from "@repo/blueprint";

export interface PlanFailure {
  status: number;
  code: string;
  message: string;
  isProviderCreditsDepleted: boolean;
}

const STATUS_BY_CODE: Record<BuildBlueprintError["code"], number> = {
  INTENT_FAILED: 422,
  CONTENT_FAILED: 503,
  PLAN_INVALID: 422,
  TIMEOUT: 503,
};

const PROVIDER_UNAVAILABLE_STATUS = 503;
const GENERIC_PLAN_FAILURE = "Could not plan the app. Try again.";

export function planFailure(error: unknown): PlanFailure {
  const rawMessage = error instanceof Error ? error.message : String(error);
  if (isProviderCreditsDepleted(rawMessage)) {
    return {
      status: PROVIDER_UNAVAILABLE_STATUS,
      code: "PROVIDER_UNAVAILABLE",
      message: PROVIDER_CREDITS_DEPLETED_NOTICE,
      isProviderCreditsDepleted: true,
    };
  }
  if (!(error instanceof BuildBlueprintError)) {
    return { status: STATUS_BY_CODE.CONTENT_FAILED, code: "CONTENT_FAILED", message: GENERIC_PLAN_FAILURE, isProviderCreditsDepleted: false };
  }
  const message = error.code === "CONTENT_FAILED" ? GENERIC_PLAN_FAILURE : error.message;
  return { status: STATUS_BY_CODE[error.code], code: error.code, message, isProviderCreditsDepleted: false };
}
