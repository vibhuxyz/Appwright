import { Command } from "commander";

import { input, password, select, editor } from "@inquirer/prompts";
import chalk from "chalk";
import { getOrchestratorTools } from "../src/tools";
import { AuthStorage, ProviderName } from "../src/core/auth-storage";
import { runAgentLoop } from "../src/engine/agentLoop";
import {
  AgentMessage,
  AssistantMessage,
  UserMessage,
  ToolResultMessage,
} from "../src/engine/type";
import { buildSystemPrompt } from "../src/engine/systemPrompt";

function getPersonalizedTip(
  currentPrompt: string,
  history: AgentMessage[],
): string | null {
  if (currentPrompt.length > 500) {
    return "Your prompt is quite long. Being concise can help save input tokens.";
  }

  if (currentPrompt.length < 15 && currentPrompt.length > 0) {
    return "Providing more clear and specific instructions can avoid multiple turns for clarification, saving tokens.";
  }

  if (history.length > 20) {
    return "Your chat history is getting long. Clearing it if previous context is no longer needed can significantly reduce input tokens.";
  }

  const userPrompts = history
    .filter((m): m is UserMessage => m.role === "user")
    .map((m) => m.content.trim().toLowerCase());

  if (userPrompts.length > 1) {
    const lastPrompt = userPrompts[userPrompts.length - 1];
    const previousPrompts = userPrompts.slice(0, -1);
    if (previousPrompts.some((p) => p === lastPrompt)) {
      return "I noticed you asked something very similar before. Try to be more specific or ask for a summary to avoid redundant information.";
    }
  }

  const lastTurnToolMessages = history
    .slice(-15)
    .filter((m): m is ToolResultMessage => m.role === "tool");

  const readActions = lastTurnToolMessages.filter(
    (m) => m.name === "read_file" || m.name === "list_directory",
  );
  const scoutActions = lastTurnToolMessages.filter(
    (m) => m.name === "subagent" || m.name === "find_files",
  );

  if (readActions.length > 3 && scoutActions.length === 0) {
    return "I noticed several file reads. Using the 'scout' tool first can help focus research and avoid reading large files unnecessarily.";
  }

  const lastAssistantMessage = history.findLast(
    (m): m is AssistantMessage => m.role === "assistant",
  );
  if (lastAssistantMessage) {
    const textContent = lastAssistantMessage.content
      .filter((p) => p.type === "text")
      .map((p: any) => p.text)
      .join("");
    if (textContent.length > 2000) {
      return "The last response was quite long. You could ask for a summary if you only need the key points, saving tokens in future turns.";
    }
  }

  return null;
}

function getContextWindow(provider: ProviderName): number {
  if (provider === "openai") {
    return 128000;
  }
  if (provider === "gemini") {
    return 1048576;
  }
  return 0;
}

export const chatCommand = new Command("chat")
  .description("start chat session..")
  .action(async () => {
    console.log(chalk.bold.blue("Welcome to tui \n"));

    let activeAbortController: AbortController | null = null;

    let activeProvider = AuthStorage.getAuthenticatedProviders()[0] ?? "openai";
    const chatHistory: AgentMessage[] = [
      { role: "system", content: buildSystemPrompt() },
    ];

    let totalTokensUsed = 0;

    if (!AuthStorage.getApiKey(activeProvider)) {
      if (!AuthStorage.isTrialActive()) {
        console.log(
          chalk.yellow(" You are not logged in. Type '/login' to login or try our free Gemini trial!\n"),
        );
      } else if (activeProvider === "gemini") {
         console.log(
          chalk.cyan(" Using Gemini Free Trial (5000 tokens/day). Type '/login' to use your own key.\n"),
        );
      }
    }

    const activeTools = getOrchestratorTools();

    while (true) {
      let promptStr: string;
      try {
        promptStr = await input({ message: chalk.bold.green("You:") });
      } catch (error) {
        // Inquirer throws when Ctrl+C is pressed
        process.exit(0);
      }

      if (promptStr.trim() === "/") {
        try {
          promptStr = await select({
            message: "Choose a command:",
            choices: [
              { name: "login - Login to a provider", value: "/login" },
              { name: "logout - Logout from a provider", value: "/logout" },
              { name: "model - Switch AI provider", value: "/model" },
              { name: "whoami - Show current session info", value: "/whoami" },
              { name: "help - Show all commands", value: "/help" },
              { name: "paste - Paste long text/code", value: "/paste" },
              { name: "exit - Exit the chat", value: "/exit" },
            ],
          });
        } catch (error) {
          process.exit(0);
        }
      }

      if (promptStr.trim() === "/paste") {
        try {
          promptStr = await editor({
            message:
              "Paste your code/text here (save and close the editor to submit):",
          });
          if (!promptStr.trim()) continue;
        } catch (error) {
          process.exit(0);
        }
      }

      const promptLower = promptStr.trim().toLowerCase();

      if (!promptLower) continue;

      if (promptLower === "/exit" || promptLower === "/quit") {
        console.log(chalk.gray("Exiting..."));
        break;
      }

      if (promptLower === "/login") {
        try {
          const choices = [
            { name: "OpenAI / gpt", value: "openai" },
            { name: "Gemini", value: "gemini" },
          ];

          if (!AuthStorage.isTrialActive() && !AuthStorage.hasStoredApiKey("gemini")) {
            choices.push({ name: chalk.cyan("Try Gemini Free (5000 tokens/day)"), value: "trial" as any });
          }

          const chosenProvider = (await select({
            message: "Which ai provider do you want to login ? ",
            choices: choices,
          })) as ProviderName | "trial";

          if (chosenProvider === "trial") {
            AuthStorage.setTrialActive(true);
            activeProvider = "gemini";
            console.log(chalk.green("Free trial activated for Gemini! Enjoy 5000 tokens per day.\n"));
            continue;
          }

          console.log(chalk.dim(`Logging into ${chosenProvider}....`));
          const promptLabel = chosenProvider === "gemini" 
            ? `Enter the ${chosenProvider} API Key or OAuth Token:` 
            : `Enter the ${chosenProvider} API Key:`;

          const newKey = await password({
            message: promptLabel,
          });

          if (newKey.trim()) {
            AuthStorage.setApiKey(chosenProvider, newKey.trim());
            activeProvider = chosenProvider;
            console.log(
              chalk.green(`Successfully logged in! ${chosenProvider}\n`),
            );
          } else {
            console.log(chalk.red(" Login cancelled: Key cannot be empty.\n"));
          }
        } catch (error) {
          process.exit(0);
        }
        continue;
      }

      if (promptLower === "/logout") {
        try {
          const providers = AuthStorage.getAuthenticatedProviders();
          if (providers.length === 0) {
            console.log(chalk.yellow("No providers are currently logged in.\n"));
          } else {
            const chosenProvider = (await select({
              message: "Which provider do you want to logout from?",
              choices: providers.map((p) => ({ name: p, value: p })),
            })) as ProviderName;

            AuthStorage.deleteApiKey(chosenProvider);
            console.log(chalk.green(`Successfully logged out from ${chosenProvider}.\n`));
            
            // Update activeProvider if it was the one we just logged out from
            if (activeProvider === chosenProvider) {
              activeProvider = AuthStorage.getAuthenticatedProviders()[0] ?? "openai";
            }
          }
        } catch (error) {
          process.exit(0);
        }
        continue;
      }

      if (promptLower === "/model") {
        try {
          const providers = AuthStorage.getAuthenticatedProviders();
          if (providers.length === 0) {
            console.log(chalk.yellow("No authenticated providers available. Please /login first.\n"));
          } else {
            activeProvider = (await select({
              message: "Select active provider:",
              choices: providers.map((p) => ({ 
                name: p + (p === activeProvider ? " (active)" : ""), 
                value: p 
              })),
            })) as ProviderName;
            console.log(chalk.green(`Switched to ${activeProvider}.\n`));
          }
        } catch (error) {
          process.exit(0);
        }
        continue;
      }

      if (promptLower === "/whoami") {
        const providers = AuthStorage.getAuthenticatedProviders();
        console.log(chalk.bold("\n--- Session Info ---"));
        console.log(`Active Provider: ${chalk.cyan(activeProvider)}`);
        
        const isTrial = activeProvider === "gemini" && AuthStorage.isTrialActive() && !AuthStorage.hasStoredApiKey("gemini");
        if (isTrial) {
          const remaining = AuthStorage.getTrialRemainingTokens();
          console.log(`Trial Status: ${chalk.green("Active")} (Gemini)`);
          console.log(`Daily Trial Remaining: ${chalk.yellow(remaining)} / 5000 tokens`);
        }

        console.log(`Authenticated Providers: ${providers.length > 0 ? chalk.green(providers.join(", ")) : chalk.red("None")}`);
        console.log(`Total Session Tokens: ${chalk.yellow(totalTokensUsed)}`);
        console.log("--------------------\n");
        continue;
      }

      if (promptLower === "/help") {
        console.log(chalk.bold("\n--- Available Commands ---"));
        console.log(`${chalk.cyan("/login")}   - Login to an AI provider`);
        console.log(`${chalk.cyan("/logout")}  - Logout from an AI provider`);
        console.log(`${chalk.cyan("/model")}   - Switch active AI provider`);
        console.log(`${chalk.cyan("/whoami")}  - Show current session and auth info`);
        console.log(`${chalk.cyan("/paste")}   - Paste multi-line text or code`);
        console.log(`${chalk.cyan("/help")}    - Show this help message`);
        console.log(`${chalk.cyan("/exit")}    - Exit the chat session`);
        console.log(`${chalk.cyan("/quit")}    - Exit the chat session`);
        console.log("--------------------------\n");
        continue;
      }

      const activeKey = AuthStorage.getApiKey(activeProvider);
      if (!activeKey) {
        console.log(chalk.red("You cannot chat Please type '/login' first \n"));
        continue;
      }

      if (activeProvider === "gemini" && AuthStorage.isTrialActive() && !AuthStorage.hasStoredApiKey("gemini")) {
        const remaining = AuthStorage.getTrialRemainingTokens();
        if (remaining <= 0) {
          console.log(chalk.red("You have reached your daily free trial limit of 5000 tokens."));
          console.log(chalk.yellow("Please login with your own Gemini API key to continue using Gemini today, or wait until tomorrow.\n"));
          continue;
        }
      }

      try {
        console.log(chalk.dim("Thinking..."));

        let isAgentFinished = false;
        let currentPrompts: AgentMessage[] = [
          { role: "user", content: promptStr },
        ];
        while (!isAgentFinished) {
          activeAbortController = new AbortController();
          const results = await runAgentLoop(
            currentPrompts,
            {
              cwd: process.cwd(),
              messages: chatHistory,
              activeToolNames: activeTools.map((t) => t.name),
              tools: activeTools,
            },
            {
              provider: activeProvider,
              apiKey: activeKey,
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
                  logMsg = `runing 'read' for ${chalk.cyan(args.path)}`;
                } else if (toolName === "grep_search") {
                  logMsg = `runing 'grep' for pattern ${chalk.yellow(args.pattern)} in ${chalk.cyan(args.dir_path || ".")}`;
                } else if (toolName === "list_directory") {
                  logMsg = `runing 'ls' for ${chalk.cyan(args.dir_path)}`;
                } else if (toolName === "find_files") {
                  logMsg = `runing 'find' for pattern ${chalk.yellow(args.pattern)} in ${chalk.cyan(args.dir_path || ".")}`;
                } else if (toolName === "read") {
                  // Handle alias
                  logMsg = `runing 'read' for ${chalk.cyan(args.path)}`;
                } else {
                  logMsg = `runing '${toolName}'...`;
                }
                console.log(chalk.dim(`  [agent] system ${logMsg}`));
              }
              if (
                event.type === "message_update" &&
                event.message.role === "assistant"
              ) {
                const textPart = event.message.content.find(
                  (p) => p.type === "text" && "text" in p,
                );
                if (textPart && "text" in textPart) {
                }
              }
            },
            activeAbortController.signal,
          ).finally(() => {
            activeAbortController = null;
          });

          chatHistory.push(...results);

          let turnPromptTokens = 0;
          let turnCompletionTokens = 0;
          let turnTotalTokens = 0;
          let toolUsageTokens = 0;

          results.forEach((msg) => {
            if (msg.role === "assistant" && msg.usage) {
              turnPromptTokens = msg.usage.promptTokens;
              turnCompletionTokens += msg.usage.completionTokens;
            }
            if (msg.role === "tool" && msg.usage) {
              toolUsageTokens += msg.usage.totalTokens;
            }
          });
          turnTotalTokens =
            turnPromptTokens + turnCompletionTokens + toolUsageTokens;

          let sessionIncrement = 0;
          results.forEach((msg) => {
            if (msg.role === "assistant" && msg.usage) {
              sessionIncrement += msg.usage.totalTokens;
            }
            if (msg.role === "tool" && msg.usage) {
              sessionIncrement += msg.usage.totalTokens;
            }
          });
          totalTokensUsed += sessionIncrement;

          if (activeProvider === "gemini" && AuthStorage.isTrialActive() && !AuthStorage.hasStoredApiKey("gemini")) {
            AuthStorage.updateTrialUsage(sessionIncrement);
          }

          const lastMessage = results[results.length - 1];

          if (
            lastMessage &&
            lastMessage.role === "assistant" &&
            lastMessage.stopReason === "aborted"
          ) {
            console.log(chalk.yellow("LLM stopped."));
            isAgentFinished = true;
            continue;
          }

          if (
            lastMessage &&
            lastMessage.role === "tool" &&
            lastMessage.name === "propose_plan"
          ) {
            const planData = JSON.parse(lastMessage.content);
            console.log(`\n${chalk.bold.magenta("Agent Proposed a Plan:")}`);
            planData.steps.forEach((step: string, index: number) => {
              console.log(chalk.magenta(`${index + 1}. ${step}`));
            });

            let feedback: string;
            try {
              feedback = await input({
                message: chalk.bold.yellow(
                  "Do you approve this plan? (Type 'yes' to approve, or type your feedback to change it): ",
                ),
              });
            } catch (error) {
              process.exit(0);
            }

            if (
              feedback.toLowerCase() === "yes" ||
              feedback.toLowerCase() === "y"
            ) {
              console.log(chalk.green("Plan approved. Executing..."));
              currentPrompts = [
                {
                  role: "user",
                  content:
                    "Plan approved. Please execute the plan exactly as proposed.",
                },
              ];
            } else {
              console.log(
                chalk.yellow("Sending feedback and squashing history..."),
              );

              // Robust Squashing: Remove the last assistant message and all subsequent tool results
              let lastAssistantIndex = -1;
              for (let i = chatHistory.length - 1; i >= 0; i--) {
                if (chatHistory[i].role === "assistant") {
                  lastAssistantIndex = i;
                  break;
                }
              }
              if (lastAssistantIndex !== -1) {
                chatHistory.splice(lastAssistantIndex);
              }

              currentPrompts = [
                {
                  role: "user",
                  content: `Your previous plan was rejected. The user provided this feedback: "${feedback}". Please propose a new plan.`,
                },
              ];
            }
          } else {
            if (lastMessage && lastMessage.role === "assistant") {
              const text = lastMessage.content
                .filter((p: any) => p.type === "text")
                .map((p: any) => p.text)
                .join("");
              if (text) {
                console.log(
                  `\n${chalk.bold.cyan("Agent:")} ${chalk.cyan(text)}\n`,
                );
              }
            }
            isAgentFinished = true;
          }

          if (turnTotalTokens > 0) {
            const contextWindow = getContextWindow(activeProvider);
            const tokensRemaining = Math.max(
              0,
              contextWindow - totalTokensUsed,
            );
            const modelName =
              activeProvider === "openai"
                ? "gpt-4o-mini"
                : "gemini-3-flash-preview";

            let statusLine = `${chalk.bold("Provider:")} ${activeProvider} | ` +
                `${chalk.bold("Model:")} ${modelName} | ` +
                `${chalk.bold("Tokens:")} ${chalk.cyan(turnTotalTokens)} (P:${turnPromptTokens} C:${turnCompletionTokens}) | ` +
                `${chalk.bold("Total Session:")} ${totalTokensUsed}`;
            
            if (activeProvider === "gemini" && AuthStorage.isTrialActive() && !AuthStorage.hasStoredApiKey("gemini")) {
              const trialRemaining = AuthStorage.getTrialRemainingTokens();
              statusLine += ` | ${chalk.bold("Trial Day Rem:")} ${chalk.yellow(trialRemaining)}`;
            } else {
              statusLine += ` | ${chalk.bold("Est. Remaining:")} ${tokensRemaining}`;
            }

            console.log(chalk.dim("─".repeat(process.stdout.columns || 40)));
            console.log(statusLine);
            const personalizedTip = getPersonalizedTip(promptStr, chatHistory);
            if (personalizedTip) {
              console.log(chalk.cyan(`💡 Tip: ${personalizedTip}`));
            }
            console.log(
              chalk.dim("─".repeat(process.stdout.columns || 40)) + "\n",
            );
          }
        }
      } catch (error) {
        console.error(chalk.red("Agent Error:"), error);
      }
    }
  });
