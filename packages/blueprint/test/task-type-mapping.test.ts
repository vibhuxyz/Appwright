import { describe, expect, it } from "bun:test";
import { TaskType } from "@repo/contracts";
import { TaskType as DatabaseTaskType } from "@repo/db";
import { taskTypeFromPrisma, taskTypeToPrisma } from "../src/map-task-row";

describe("task type mapping", () => {
  it("round-trips every task type through its database enum name", () => {
    for (const type of TaskType.options) {
      expect(taskTypeFromPrisma(taskTypeToPrisma(type))).toBe(type);
    }
  });

  it("maps every contract task type to a value the database enum accepts", () => {
    const databaseValues = new Set<string>(Object.values(DatabaseTaskType));
    for (const type of TaskType.options) {
      expect(databaseValues.has(taskTypeToPrisma(type))).toBe(true);
    }
  });
});
