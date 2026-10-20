import type { TaskDetail } from "./load-task-detail";

export function buildTaskPrompt(task: TaskDetail, previousError: string | undefined): string {
  const lines = [
    `You are completing one task of a larger build. Work only inside the files listed below.`,
    ``,
    `Task: ${task.title}`,
    `Type: ${task.type}`,
    `Files you may create or edit (owns): ${task.owns.join(", ")}`,
    `Files you may read for context (reads): ${task.reads.length > 0 ? task.reads.join(", ") : "none"}`,
    ``,
    `Use list_files/read_file to explore reads before writing. Write only paths that match owns.`,
    `When the task is complete, stop making tool calls.`,
  ];
  if (previousError) {
    lines.push(``, `The previous attempt failed: ${previousError}`, `Fix that and try again.`);
  }
  return lines.join("\n");
}
