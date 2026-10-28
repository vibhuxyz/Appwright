import type { GroupConfig, SiteGroup } from "./types";

export const GROUP_CONFIGS: Readonly<Record<SiteGroup, GroupConfig>> = {
  A: { group: "A", pipeline: "task", shellPatterns: "not-applicable" },
  B: { group: "B", pipeline: "single-pass", shellPatterns: "omitted" },
  C: { group: "C", pipeline: "single-pass", shellPatterns: "included" },
};

export const PILOT_LIMITATIONS: readonly string[] = [
  "Database stubbed: tasks come from the real planner and run through the real executor with an in-memory run store; nothing is persisted.",
  "Per-task verification is tsc only (no bun install, build or lint step); the final check is tsc plus next build, then the browser check.",
  "One attempt per task or run: no task retries, no verify-and-repair loop, no browser repair turn.",
  "No asset slots or images were resolved: image areas are placeholders in every group.",
  "No chosen theme was applied: design comes from the planner's default direction in every group.",
  "No project-memory section in the system prompt.",
  "The task path includes typography, layout, responsive and visual-verification tasks that single-pass does not have, so A vs C compares end-to-end paths, not shell delivery alone.",
  "Transport retries only: a provider call that fails before any data arrives (dropped connection, 300s stall) is retried up to 2 times; no retry of generation steps, tasks or repairs.",
  "Model fallbacks are disabled: every call uses the single recorded model.",
  "One generation per combination: differences are indicative, not statistically meaningful.",
];
