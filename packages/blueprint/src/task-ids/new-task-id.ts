import { randomUUID } from "node:crypto";

const TASK_ID_LENGTH = 25;

export function newTaskId(): string {
  return randomUUID().replaceAll("-", "").slice(0, TASK_ID_LENGTH);
}
