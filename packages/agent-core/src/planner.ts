import type { Provider } from "./providers/types";
import type { Runtime } from "./runtime";

const plannerPromptPath = new URL("../prompts/planner.md", import.meta.url);

// A stopgap ahead of V4's real planner (blueprint schema, task DAG,
// architecture decision engine — docs/versions/V4_APP_BUILDER.md). This is
// deliberately much smaller: one extra LLM call that turns a prompt into an
// explicit checklist, so the main agent loop has something concrete to
// verify itself against instead of declaring victory after one edit.
//
// No new Message/AgentEvent types, no DB schema, no DAG execution — the plan
// is just text embedded into what the loop sees, same shape as the system
// prompt. If this stops being enough (parallel tasks, per-task verification,
// re-planning), that's the signal to build V4 for real, not extend this.
export async function planTasks(
  runtime: Runtime,
  provider: Provider,
  userPrompt: string,
): Promise<string[]> {
  const template = await Bun.file(plannerPromptPath).text();

  let fileTree: string[] = [];
  try {
    fileTree = await runtime.listDir(".");
  } catch {
    fileTree = [];
  }

  const plannerInput = `${template}\n\nProject file tree (top 50):\n${fileTree
    .slice(0, 50)
    .join("\n")}\n\nUser request:\n${userPrompt}`;

  let text = "";
  const controller = new AbortController();
  for await (const chunk of provider.stream(
    [{ role: "user", type: "text", content: plannerInput }],
    [],
    { signal: controller.signal },
  )) {
    if (chunk.type === "text_delta") text += chunk.delta;
  }

  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error(`planner returned no JSON array: ${text.slice(0, 200)}`);
  }

  const tasks = JSON.parse(jsonMatch[0]);
  if (!Array.isArray(tasks) || tasks.some((t) => typeof t !== "string")) {
    throw new Error("planner returned a JSON array that isn't string[]");
  }

  return tasks;
}

export function formatPlanForAgent(tasks: string[]): string {
  const checklist = tasks.map((t, i) => `${i + 1}. [ ] ${t}`).join("\n");
  return `Complete every item in this checklist before finishing. Do not stop after doing only
one item — work through all of them. After each one, verify it by reading the file back. When
you believe all items are done, do one final pass re-reading the changed files to confirm nothing
was missed, then summarize what you did.

${checklist}`;
}
