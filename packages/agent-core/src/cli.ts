import { ALL_TOOLS } from "@repo/tools";
import { consoleSink } from "./engine/sink";
import { formatPlanForAgent, planTasks } from "./planner";
import { buildSystemPrompt } from "./prompt";
import { OpenAiProvider } from "./providers/openai";
import { runAgentLoop } from "./loop";
import { LocalRuntime } from "./runtime";
import type { Message } from "./types";
import { verifyTypeScript } from "./verify";

const args = process.argv.slice(2);
const projectFlagIndex = args.indexOf("--project");
const project =
  projectFlagIndex >= 0 ? args[projectFlagIndex + 1] : "vite-react";
const promptArgs =
  projectFlagIndex >= 0
    ? [...args.slice(0, projectFlagIndex), ...args.slice(projectFlagIndex + 2)]
    : args;
const prompt = promptArgs.join(" ").trim();

if (!prompt) {
  console.error('usage: bun appwright "your prompt here" [--project <name>]');
  process.exit(1);
}

if (!project) {
  console.error(
    "usage: --project requires a value (a folder under templates/)",
  );
  process.exit(1);
}

const runtime = new LocalRuntime(project);
const systemPrompt = await buildSystemPrompt(runtime);
const provider = new OpenAiProvider();

let planSuffix = "";
try {
  const tasks = await planTasks(runtime, provider, prompt);
  console.log("  plan:");
  for (const [i, t] of tasks.entries()) console.log(`    ${i + 1}. ${t}`);
  console.log();
  planSuffix = `\n\n---\n\n${formatPlanForAgent(tasks)}`;
} catch (err) {
  console.error(`  planning failed, continuing without a plan: ${err}`);
}

const messages: Message[] = [
  {
    role: "user",
    type: "text",
    content: `${systemPrompt}\n\n---\n\n${prompt}${planSuffix}`,
  },
];

const controller = new AbortController();
process.on("SIGINT", () => controller.abort());

const emit = consoleSink();
console.log(`\n  prompt: ${prompt}\n`);

const MAX_VERIFY_ATTEMPTS = 2;
let stopReason = "completed";

for (let attempt = 0; attempt <= MAX_VERIFY_ATTEMPTS; attempt++) {
  stopReason = await runAgentLoop({
    messages,
    tools: ALL_TOOLS,
    provider,
    runtime,
    emit,
    budget: {
      maxIterations: 40,
      maxTokens: 150_000,
      maxCostUsd: 5,
      deadline: Date.now() + 8 * 60_000,
    },
    signal: controller.signal,
    sessionId: crypto.randomUUID(),
  });

  if (stopReason !== "completed") break;

  const verifyResult = await verifyTypeScript(runtime);
  if (verifyResult.ok) {
    console.log("  ✓ tsc --noEmit passed\n");
    break;
  }
  if (attempt === MAX_VERIFY_ATTEMPTS) {
    console.log(
      `  ✗ tsc --noEmit still failing after ${MAX_VERIFY_ATTEMPTS} fix attempts\n`,
    );
    break;
  }
  console.log(
    `  ✗ tsc --noEmit failed, asking the agent to fix it (attempt ${attempt + 1})\n`,
  );
  messages.push({
    role: "user",
    type: "text",
    content: `Running \`tsc --noEmit\` on your changes found real errors — fix them, then
stop. Do not describe the fix, make it with edit_file/write_file.\n\n${verifyResult.output}`,
  });
}

if (stopReason !== "completed") {
  process.exit(1);
}
