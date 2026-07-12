import { Command } from "commander";
import chalk from "chalk";

import { getOrchestratorTools } from "../src/tools";
import { AuthStorage } from "../src/core/auth-storage";
import { runAgentLoop } from "../src/engine/agentLoop";
import { buildSystemPrompt } from "../src/engine/systemPrompt";

export const agentCommand = new Command("agent")
  .description("Runs the agent")
  .option("-p, --prompt <prompt>", "prompt", "")
  .action(async (options) => {
    const prompt = options.prompt;
    if (!prompt) {
      console.error("Error: Please provide a prompt using the -p flag.");
      process.exit(1);
    }

    const providers = AuthStorage.getAuthenticatedProviders();
    if (providers.length === 0) {
      console.error(
        "Error: No authenticated providers found. Run 'opencode providers login' or use '/login' in chat.",
      );
      process.exit(1);
    }

    const activeProvider = providers[0];
    const apiKey = AuthStorage.getApiKey(activeProvider);

    if (!apiKey) {
      console.error(`Error: API key for ${activeProvider} not found.`);
      process.exit(1);
    }

    const activeTools = getOrchestratorTools();

    console.log(`Asking ${activeProvider} (and checking tools)...`);

    try {
      const results = await runAgentLoop(
        [
          { role: "system", content: buildSystemPrompt() },
          { role: "user", content: prompt },
        ],
        {
          cwd: process.cwd(),
          messages: [],
          activeToolNames: activeTools.map((t) => t.name),
          tools: activeTools,
        },
        {
          provider: activeProvider,
          apiKey: apiKey,
        },
        (event) => {
          if (event.type === "tool_execution_start") {
            const { toolName, args } = event;
            let logMsg = "";
            if (toolName === "edit_file") {
              logMsg = `runing 'edit' on ${chalk.cyan(args.file_path)}`;
            } else if (toolName === "write_file") {
              logMsg = `runing 'write' to ${chalk.cyan(args.file_path)}`;
            } else if (toolName === "bash") {
              logMsg = `runing 'bash' command: ${chalk.yellow(args.command)}`;
            } else if (toolName === "read_file") {
              logMsg = `runing 'read' for ${chalk.cyan(args.file_path)}`;
            } else if (toolName === "grep_search") {
              logMsg = `runing 'grep' for pattern ${chalk.yellow(args.pattern)} in ${chalk.cyan(args.dir_path || ".")}`;
            } else if (toolName === "list_directory") {
              logMsg = `runing 'ls' for ${chalk.cyan(args.dir_path)}`;
            } else if (toolName === "find_files") {
              logMsg = `runing 'find' for pattern ${chalk.yellow(args.pattern)} in ${chalk.cyan(args.dir_path || ".")}`;
            } else {
              logMsg = `runing '${toolName}'...`;
            }
            console.log(chalk.dim(`  [agent] system ${logMsg}`));
          }
          if (event.type === "message_end" && event.message.role === "assistant") {
            const textContent = event.message.content
              .filter((p) => p.type === "text")
              .map((p: any) => p.text)
              .join("");
            if (textContent) {
              process.stdout.write(textContent);
            }
          }
        },
      );

      const lastMessage = results[results.length - 1];
      if (lastMessage && lastMessage.role === "assistant") {
        const text = lastMessage.content
          .filter((p) => p.type === "text")
          .map((p: any) => p.text)
          .join("");
        console.log(`\n\nAgent: ${text}`);
      }
    } catch (error) {
      console.error("Agent Loop Failed:", error);
      process.exit(1);
    }
  });
