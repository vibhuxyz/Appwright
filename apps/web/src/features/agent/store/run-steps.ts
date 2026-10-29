export const MAX_RUN_STEPS = 40;

const TOOL_STATUS = /^Running \w+…$/;
const TRANSIENT_STATUSES: ReadonlySet<string> = new Set(["Generating response…", "AI is working…", "Continuing…"]);

function isPhaseStatus(detail: string): boolean {
  return detail.length > 0 && !TOOL_STATUS.test(detail) && !TRANSIENT_STATUSES.has(detail);
}

export function nextRunSteps(steps: readonly string[], detail: string): readonly string[] {
  if (!isPhaseStatus(detail) || steps.at(-1) === detail) return steps;
  return [...steps, detail].slice(-MAX_RUN_STEPS);
}
