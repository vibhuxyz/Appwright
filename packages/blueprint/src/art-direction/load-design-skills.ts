import { formatSkills, selectSkills, type SkillsBlock } from "@repo/ui-system";
import { loadSkills } from "@repo/ui-system/server";
import type { TaskDetail } from "../load-task-detail";
import { effectIdsForTask, patternIdsForTask } from "../patterns";
import { skillSignalsFor } from "./skill-signals";

export async function loadDesignSkills(task: TaskDetail, previousError: string | undefined): Promise<SkillsBlock> {
  const ids = selectSkills(skillSignalsFor(task, patternIdsForTask(task), previousError, effectIdsForTask(task)));
  if (ids.length === 0) return { text: "", included: [], cut: [] };
  return formatSkills(await loadSkills(ids));
}
