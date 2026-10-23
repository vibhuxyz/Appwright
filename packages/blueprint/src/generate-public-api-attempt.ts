import {
  collectionRouteSource,
  itemReadRouteSource,
  toSlug,
  type GeneratedFile,
} from "@repo/admin-crud";
import type { Runtime } from "@repo/agent-core";
import type { Entity } from "@repo/contracts";
import type { GeneratedAttempt } from "orchestrator";
import type { TaskDetail } from "./load-task-detail";

function findEntityForTask(task: TaskDetail): Entity | undefined {
  const ownedPath = task.owns.find((path) => path.startsWith("src/app/api/"));
  const slug = ownedPath?.split("/")[3];
  return task.entities.find((entity) => toSlug(entity.name) === slug);
}

export async function generatePublicApiAttempt(
  task: TaskDetail,
  runtime: Runtime,
): Promise<GeneratedAttempt> {
  const entity = findEntityForTask(task);
  if (!entity) {
    return { kind: "failed", costCents: 0, error: "No matching entity found for this api task" };
  }

  const slug = toSlug(entity.name);
  const files: GeneratedFile[] = [
    { path: `src/app/api/${slug}/route.ts`, content: collectionRouteSource(entity) },
    { path: `src/app/api/${slug}/[id]/route.ts`, content: itemReadRouteSource(entity) },
  ];

  await Promise.all(files.map((file) => runtime.writeFile(file.path, file.content)));
  return { kind: "completed", costCents: 0, writtenPaths: files.map((file) => file.path) };
}
