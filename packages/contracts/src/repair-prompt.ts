const ERROR_REPORT =
  /\b(bad_gateway|unreachable|not starting|won't start|will not start|does not start|isn't starting|is not starting|stack trace|typeerror|syntaxerror|preview server|failed to start|hydration|hydrated|console error|call stack|didn't match the client|did not match the client)\b/i;
const FIX_REQUEST = /\bfix(?:ing|ed)?\b|\bdebug(?:ging)?\b|\brepair\b|\bthis bug\b|\bbug\b/i;
const NEW_APP = /\b(build|create|make me|design)\b/i;

export function isRepairPrompt(prompt: string): boolean {
  if (ERROR_REPORT.test(prompt)) return true;
  return FIX_REQUEST.test(prompt) && !NEW_APP.test(prompt);
}
