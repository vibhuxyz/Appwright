import { generateAdminCrud } from "@repo/admin-crud";
import type { Runtime } from "@repo/agent-core";
import type { GeneratedAttempt } from "orchestrator";
import type { TaskDetail } from "./load-task-detail";

export async function generateAdminCrudAttempt(
  task: TaskDetail,
  runtime: Runtime,
): Promise<GeneratedAttempt> {
  if (task.entities.length === 0) {
    return { kind: "failed", costCents: 0, error: "No entities to generate admin CRUD for" };
  }

  const files = task.entities.flatMap((entity) => generateAdminCrud(entity));
  await Promise.all(files.map((file) => runtime.writeFile(file.path, file.content)));

  return { kind: "completed", costCents: 0, writtenPaths: files.map((file) => file.path) };
}
