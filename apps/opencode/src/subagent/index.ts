import { runAgentLoop } from "../engine/agentLoop";
import { AuthStorage } from "../core/auth-storage";
import { getAllTools } from "../tools/index";
import { discoverAgents, AgentConfig } from "./agents";
import chalk from "chalk";
import { AgentMessage } from "../engine/type";
import { AgentTool, AgentToolResult } from "../types";

async function runSingleAgent(
  agent: AgentConfig,
  task: string,
  cwd: string,
): Promise<{ output: string; usage: { promptTokens: number; completionTokens: number; totalTokens: number } }> {
  const activeProvider = AuthStorage.getAuthenticatedProviders()[0] ?? "openai";
  const activeKey = AuthStorage.getApiKey(activeProvider);

  if (!activeKey) throw new Error("No API key available for subagent.");

  // DYNAMIC MODEL SELECTION
  let selectedModel = agent.model; // global fallback
  if (activeProvider === "openai" && agent.openai_model) {
    selectedModel = agent.openai_model;
  } else if (activeProvider === "gemini" && agent.gemini_model) {
    selectedModel = agent.gemini_model;
  }

  const allAvailableTools = getAllTools();
  const toolAliases: Record<string, string> = {
    read: "read_file",
  };
  const requestedToolNames = agent.tools?.map(
    (toolName) => toolAliases[toolName] ?? toolName,
  );
  const agentTools =
    requestedToolNames && requestedToolNames.length > 0
      ? allAvailableTools.filter((t) => requestedToolNames.includes(t.name))
      : allAvailableTools;

  const initialMessages: AgentMessage[] = [
    { role: "system", content: agent.systemPrompt },
    { role: "user", content: task },
  ];

  const results = await runAgentLoop(
    initialMessages,
    {
      cwd: cwd,
      messages: [],
      activeToolNames: agentTools.map((t) => t.name),
      tools: agentTools,
    },
    {
      provider: activeProvider,
      apiKey: activeKey,
      model: selectedModel,
      maxTurns: 15,
    },
    (event) => {
      if (event.type === "tool_execution_start") {
        console.log(
          chalk.dim(`  [${agent.name}] running ${event.toolName}...`),
        );
      }
    },
  );

  const usage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
  results.forEach((msg) => {
    if (msg.role === "assistant" && msg.usage) {
      usage.promptTokens += msg.usage.promptTokens;
      usage.completionTokens += msg.usage.completionTokens;
      usage.totalTokens += msg.usage.totalTokens;
    }
  });

  const lastMessage = results[results.length - 1];
  let output = "(no output)";
  if (lastMessage && lastMessage.role === "assistant") {
    output = lastMessage.content
      .filter((p: any) => p.type === "text")
      .map((p: any) => p.text)
      .join("");
  }
  return { output, usage };
}

export const nativeSubagentTool: AgentTool = {
  name: "subagent",
  label: "Subagent",
  description:
    "Delegate tasks to specialized subagents (scout, planner, worker). Supports single {agent, task}, chain [{agent, task...}], or parallel tasks [{agent, task}].",
  schema: {
    type: "function",
    function: {
      name: "subagent",
      description:
        "Delegate to subagents. Provide exactly one mode: agent/task (single), chain (array), or tasks (parallel).",
      parameters: {
        type: "object",
        properties: {
          agent: { type: "string", description: "Agent name (Single mode)" },
          task: { type: "string", description: "Task (Single mode)" },
          chain: {
            type: "array",
            description: "Sequential chain of agents",
            items: {
              type: "object",
              properties: {
                agent: { type: "string" },
                task: {
                  type: "string",
                  description: "Use {previous} to inject previous step output.",
                },
              },
              required: ["agent", "task"],
            },
          },
          tasks: {
            type: "array",
            description: "Parallel tasks",
            items: {
              type: "object",
              properties: {
                agent: { type: "string" },
                task: { type: "string" },
              },
              required: ["agent", "task"],
            },
          },
        },
      },
    },
  },
  execute: async (args: any): Promise<AgentToolResult> => {
    const cwd = process.cwd();
    const { agents } = discoverAgents(cwd);

    // CHAIN MODE
    if (args.chain && args.chain.length > 0) {
      console.log(
        chalk.bold.blue(
          `\n[Sub-Agent] Starting Chain workflow (${args.chain.length} steps)...`,
        ),
      );
      let previousOutput = "";
      let finalReport = "";
      const totalUsage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };

      for (let i = 0; i < args.chain.length; i++) {
        const step = args.chain[i];
        const agent = agents.find((a) => a.name === step.agent);
        if (!agent) throw new Error(`Agent ${step.agent} not found.`);

        const taskWithContext = step.task.replace(
          /\{previous\}/g,
          previousOutput,
        );
        console.log(chalk.blue(`-> Step ${i + 1}: ${step.agent}`));

        const { output, usage } = await runSingleAgent(agent, taskWithContext, cwd);
        previousOutput = output;
        totalUsage.promptTokens += usage.promptTokens;
        totalUsage.completionTokens += usage.completionTokens;
        totalUsage.totalTokens += usage.totalTokens;
        finalReport += `### Step ${i + 1}: ${step.agent}\n${previousOutput}\n\n`;
      }
      return {
        content: [{ type: "text", text: finalReport }],
        terminate: false,
        usage: totalUsage,
      };
    }

    // PARALLEL MODE
    if (args.tasks && args.tasks.length > 0) {
      console.log(
        chalk.bold.blue(
          `\n[Sub-Agent] Starting Parallel workflow (${args.tasks.length} tasks)...`,
        ),
      );
      const totalUsage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
      const promises = args.tasks.map(async (t: any) => {
        const agent = agents.find((a) => a.name === t.agent);
        if (!agent) return `### ${t.agent} (NOT FOUND)`;
        try {
          const { output, usage } = await runSingleAgent(agent, t.task, cwd);
          totalUsage.promptTokens += usage.promptTokens;
          totalUsage.completionTokens += usage.completionTokens;
          totalUsage.totalTokens += usage.totalTokens;
          return `### ${t.agent}\n${output}`;
        } catch (error: any) {
          console.log(chalk.red(`  [${t.agent}] failed: ${error.message}`));
          return `### ${t.agent} (FAILED)\nError: ${error.message}`;
        }
      });

      const results = await Promise.all(promises);
      return {
        content: [{ type: "text", text: results.join("\n\n") }],
        terminate: false,
        usage: totalUsage,
      };
    }

    // SINGLE MODE
    if (args.agent && args.task) {
      console.log(
        chalk.bold.blue(`\n[Sub-Agent] Starting Single task: ${args.agent}...`),
      );
      const agent = agents.find((a) => a.name === args.agent);
      if (!agent)
        return {
          content: [{ type: "text", text: `Agent ${args.agent} not found.` }],
        };

      const { output, usage } = await runSingleAgent(agent, args.task, cwd);
      return { content: [{ type: "text", text: output }], terminate: false, usage };
    }

    return {
      content: [{ type: "text", text: "Invalid subagent parameters." }],
    };
  },
};
