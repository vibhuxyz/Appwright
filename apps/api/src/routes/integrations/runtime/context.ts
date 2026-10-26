import type { NextFunction, Request, Response } from "express";
import { increment } from "@repo/cache";
import { findIntegrationProjectScope } from "@repo/db";
import { runtimeError } from "./runtime-error";
import { log } from "../../../log";

export interface IntegrationRuntimeScope {
  projectId: string;
  environment: "development" | "preview" | "production";
}

const RATE_LIMIT_WINDOW_SECONDS = 60;
const MAX_RUNTIME_REQUESTS_PER_WINDOW = 60;

export async function requireIntegrationToken(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  if (req.headers.origin) {
    runtimeError(res, 403, "BROWSER_CALL_NOT_ALLOWED", "Call the integration gateway from a trusted server runtime");
    return;
  }
  const authorization = req.headers.authorization;
  const token = authorization?.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (!token || token.length > 128) {
    runtimeError(res, 401, "UNAUTHORIZED", "A project integration token is required");
    return;
  }
  const scope = await findIntegrationProjectScope(token);
  if (!scope || !isRuntimeEnvironment(scope.environment)) {
    runtimeError(res, 401, "UNAUTHORIZED", "The project integration token is invalid");
    return;
  }
  try {
    const requestCount = await increment(
      `ratelimit:integration-runtime:${scope.projectId}:${scope.environment}`,
      RATE_LIMIT_WINDOW_SECONDS,
    );
    if (requestCount > MAX_RUNTIME_REQUESTS_PER_WINDOW) {
      runtimeError(res, 429, "RATE_LIMITED", "Project integration request rate limit exceeded");
      return;
    }
  } catch {
    log.warn("integration runtime rate limit unavailable", {
      projectId: scope.projectId,
      environment: scope.environment,
    });
    runtimeError(res, 503, "RATE_LIMIT_UNAVAILABLE", "Integration gateway rate limiting is unavailable");
    return;
  }
  res.locals.integrationScope = {
    projectId: scope.projectId,
    environment: scope.environment,
  } satisfies IntegrationRuntimeScope;
  next();
}

export function integrationRuntimeScope(res: Response): IntegrationRuntimeScope {
  return res.locals.integrationScope as IntegrationRuntimeScope;
}

export function isRuntimeEnvironment(value: string): value is IntegrationRuntimeScope["environment"] {
  return value === "development" || value === "preview" || value === "production";
}
