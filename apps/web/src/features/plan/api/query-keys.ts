export const planKeys = {
  run: (runId: string) => ["plan", "run", runId] as const,
  plan: (runId: string) => ["plan", "contract", runId] as const,
  blueprint: (blueprintId: string) => ["plan", "blueprint", blueprintId] as const,
  attempts: (runId: string, taskId: string) =>
    ["plan", "attempts", runId, taskId] as const,
  latestRun: (sessionId: string) => ["plan", "latest-run", sessionId] as const,
};
