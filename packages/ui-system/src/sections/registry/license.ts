import { sourceById } from "./sources";
import type { SourceDecision } from "./types";

export function sourceAllowsIngestion(source: SourceDecision): boolean {
  return source.decision === "adopt" && source.commercialUse && source.modification && source.redistribution;
}

export function ingestionAllowed(sourceId: string): boolean {
  const source = sourceById(sourceId);
  return source ? sourceAllowsIngestion(source) : false;
}
