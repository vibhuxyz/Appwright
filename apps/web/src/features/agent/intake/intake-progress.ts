import type { IntakeStep, IntakeTool } from "../store/agentStore";

export interface IntakeToolGroup {
  id: string;
  tool: IntakeTool;
  detail: string;
  doneDetails: readonly string[];
  items: readonly string[];
}

export function groupIntakeSteps(steps: readonly IntakeStep[]): IntakeToolGroup[] {
  const groups: IntakeToolGroup[] = [];
  for (const step of steps) {
    const last = groups.at(-1);
    if (last && last.tool === step.tool) {
      groups[groups.length - 1] = {
        ...last,
        detail: step.detail,
        doneDetails: [...last.doneDetails, last.detail],
        items: step.items.length > 0 ? step.items : last.items,
      };
      continue;
    }
    groups.push({ id: `${groups.length}-${step.tool}`, tool: step.tool, detail: step.detail, doneDetails: [], items: step.items });
  }
  return groups;
}
