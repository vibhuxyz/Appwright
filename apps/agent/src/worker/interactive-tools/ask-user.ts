import type { Tool } from "@repo/agent-core";
import {
  AGENT_TOOL_RESULT_MARKERS,
  AGENT_WAIT_LIMITS,
  AGENT_WAIT_STATUS,
  AskUserArgsSchema,
  agentQuestionReply,
  type AgentQuestionItem,
} from "@repo/contracts";
import { createAgentQuestion, expireAgentQuestion, getAgentQuestionOutcome, pollUntil } from "@repo/db";
import { formatAnswers, formatDefaults } from "./format-answers";
import { saveQuestionReply } from "./save-reply";
import type { InteractiveToolContext } from "./types";
import { computeWaitBudgetMs } from "./wait-budget";

const SECRET_REQUEST_PATTERN = /\b(api[\s_-]?keys?|secrets?|passwords?|tokens?|credentials?|private keys?)\b/i;
const DEFAULTS_HEADING = "Proceed with these default choices and tell the user which defaults you used:";

const DESCRIPTION =
  "Ask the user 1-4 short multiple-choice questions and wait for the answers. Use it before building something " +
  "whose behaviour depends on a choice only the user can make, such as what a payment is for or what happens after " +
  "checkout. Give 2-4 concrete options per question and set defaultOptionIndex to the option you recommend. " +
  "Never use it to ask for API keys, secrets or passwords; call request_integration for credentials.";

function asksForSecret(questions: readonly AgentQuestionItem[]): boolean {
  return questions.some((question) =>
    [question.label, question.text, ...question.options].some((text) => SECRET_REQUEST_PATTERN.test(text)),
  );
}

async function waitForAnswers(ctx: InteractiveToolContext, questions: AgentQuestionItem[], waitMs: number): Promise<string> {
  const createdAt = new Date();
  const { id } = await createAgentQuestion({
    sessionId: ctx.sessionId,
    toolCallId: null,
    questions,
    expiresAt: new Date(createdAt.getTime() + waitMs),
  });
  await ctx.publishFrame({
    kind: "agent_question",
    question: { id, sessionId: ctx.sessionId, status: "PENDING", createdAt: createdAt.toISOString() },
  });
  ctx.publishStatus(AGENT_WAIT_STATUS.answers);
  const outcome = await pollUntil({
    check: () => getAgentQuestionOutcome(id),
    signal: ctx.signal,
    timeoutMs: waitMs,
    pollMs: AGENT_WAIT_LIMITS.pollMs,
  });
  if (outcome.status === "aborted") {
    await expireAgentQuestion({ id, now: new Date() });
    return `${AGENT_TOOL_RESULT_MARKERS.cancelled} the run was stopped while waiting for answers.`;
  }
  ctx.publishStatus("Continuing…");
  if (outcome.status === "timeout") {
    await expireAgentQuestion({ id, now: new Date() });
    await saveQuestionReply(ctx, agentQuestionReply(questions, null));
    return formatDefaults(`The user did not answer in time. ${DEFAULTS_HEADING}`, questions);
  }
  const answers = outcome.value.status === "ANSWERED" ? outcome.value.answers ?? null : null;
  await saveQuestionReply(ctx, agentQuestionReply(questions, answers));
  if (answers) return formatAnswers(questions, answers);
  return formatDefaults(`The user closed the questions without answering. ${DEFAULTS_HEADING}`, questions);
}

export async function askUser(
  ctx: InteractiveToolContext,
  rawArgs: unknown,
  limitMs: number = AGENT_WAIT_LIMITS.askUserMs,
): Promise<string> {
  const parsed = AskUserArgsSchema.safeParse(rawArgs);
  if (!parsed.success) return `Error: invalid ask_user arguments: ${parsed.error.issues.map((issue) => issue.message).join("; ")}`;
  if (asksForSecret(parsed.data.questions)) {
    return "Error: never ask for keys, secrets or passwords with ask_user. Call request_integration for provider credentials instead.";
  }
  const waitMs = computeWaitBudgetMs({
    limitMs,
    deadlineAt: ctx.deadlineAt,
    now: Date.now(),
    safetyMarginMs: AGENT_WAIT_LIMITS.safetyMarginMs,
    minimumWaitMs: AGENT_WAIT_LIMITS.minimumWaitMs,
  });
  if (waitMs === 0) return formatDefaults(`There is not enough run time left to wait. ${DEFAULTS_HEADING}`, parsed.data.questions);
  return waitForAnswers(ctx, parsed.data.questions, waitMs);
}

export function createAskUserTool(ctx: InteractiveToolContext): Tool {
  return {
    name: "ask_user",
    description: DESCRIPTION,
    capabilityHint: "Ask the user multiple-choice clarifying questions and wait for the answers.",
    args: AskUserArgsSchema,
    executionMode: "sequential",
    execute: (args) => askUser(ctx, args),
  };
}
