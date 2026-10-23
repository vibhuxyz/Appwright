import { describe, expect, it } from "bun:test";
import { assignTaskIds, newTaskId } from "../src/task-ids";

function counterIds(prefix: string): () => string {
  let next = 0;
  return () => `${prefix}${(next += 1)}`;
}

describe("assignTaskIds", () => {
  const tasks = [{ id: "scaffold" }, { id: "theme" }, { id: "page-home" }];
  const dependsOn = new Map([
    ["theme", ["scaffold"]],
    ["page-home", ["scaffold", "theme"]],
  ]);

  it("gives every blueprint its own ids so a second plan cannot collide with the first", () => {
    const first = assignTaskIds(tasks, dependsOn, counterIds("a"));
    const second = assignTaskIds(tasks, dependsOn, counterIds("b"));
    const firstIds = new Set(first.map((entry) => entry.id));
    expect(second.some((entry) => firstIds.has(entry.id))).toBe(false);
  });

  it("rewrites dependencies to the new ids", () => {
    const assigned = assignTaskIds(tasks, dependsOn, counterIds("t"));
    expect(assigned.map(({ task, id, dependsOn: deps }) => [task.id, id, deps])).toEqual([
      ["scaffold", "t1", []],
      ["theme", "t2", ["t1"]],
      ["page-home", "t3", ["t1", "t2"]],
    ]);
  });

  it("drops dependencies on tasks that are not in the plan", () => {
    const assigned = assignTaskIds([{ id: "theme" }], dependsOn, counterIds("t"));
    expect(assigned[0]?.dependsOn).toEqual([]);
  });
});

describe("newTaskId", () => {
  it("fits the 30-character task id column and is unique per call", () => {
    const ids = Array.from({ length: 100 }, () => newTaskId());
    expect(ids.every((id) => id.length <= 30)).toBe(true);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
