import type { Runtime } from "@repo/agent-core";
import { planPatternDelivery } from "@repo/ui-system";
import { readPatternFiles } from "@repo/ui-system/server";
import { effectIdsForTask, isNextProject, patternIdsForTask } from "./pattern-ids-for-task";
import type { TaskDetail } from "../load-task-detail";

export interface PatternDeliveryResult {
  readonly patternIds: readonly string[];
  readonly written: readonly string[];
  readonly unchanged: readonly string[];
  readonly skipped: readonly { readonly id: string; readonly reason: string }[];
}

export interface PatternSelection {
  readonly patternIds: readonly string[];
  readonly effectIds: readonly string[];
}

export class PatternDeliveryError extends Error {
  constructor(readonly failures: readonly { readonly path: string; readonly reason: string }[]) {
    super(`Cannot write pattern files: ${failures.map((failure) => `${failure.path} (${failure.reason})`).join("; ")}`);
    this.name = "PatternDeliveryError";
  }
}

async function currentContent(runtime: Runtime, path: string): Promise<string | null> {
  try {
    return await runtime.readFile(path);
  } catch (error) {
    if (error instanceof Error && /ENOENT|not found|no such file|does not exist/i.test(error.message)) return null;
    throw error;
  }
}

type FileOutcome = { path: string; isWritten: boolean; failure?: string };

async function deliverFile(runtime: Runtime, file: { path: string; content: string }): Promise<FileOutcome> {
  try {
    if ((await currentContent(runtime, file.path)) === file.content) return { path: file.path, isWritten: false };
    await runtime.writeFile(file.path, file.content);
    return { path: file.path, isWritten: true };
  } catch (error) {
    return { path: file.path, isWritten: false, failure: error instanceof Error ? error.message : String(error) };
  }
}

export async function deliverSelection(
  selection: PatternSelection,
  runtime: Runtime,
  projectTree: readonly string[],
): Promise<PatternDeliveryResult> {
  const plan = planPatternDelivery(selection.patternIds, selection.effectIds);
  if (plan.files.length === 0) return { patternIds: [], written: [], unchanged: [], skipped: plan.skipped };
  const files = await readPatternFiles(plan.files, { useClientDirective: isNextProject(projectTree) });
  const outcomes = await Promise.all(files.map((file) => deliverFile(runtime, file)));
  const failures = outcomes.flatMap((outcome) => (outcome.failure ? [{ path: outcome.path, reason: outcome.failure }] : []));
  if (failures.length > 0) throw new PatternDeliveryError(failures);
  return {
    patternIds: plan.patterns.map((pattern) => pattern.id),
    written: outcomes.filter((outcome) => outcome.isWritten).map((outcome) => outcome.path),
    unchanged: outcomes.filter((outcome) => !outcome.isWritten).map((outcome) => outcome.path),
    skipped: plan.skipped,
  };
}

export function deliverPatterns(
  task: TaskDetail,
  runtime: Runtime,
  projectTree: readonly string[],
): Promise<PatternDeliveryResult> {
  return deliverSelection({ patternIds: patternIdsForTask(task), effectIds: effectIdsForTask(task) }, runtime, projectTree);
}
