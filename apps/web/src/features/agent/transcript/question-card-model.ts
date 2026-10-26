import {
  AGENT_TOOL_RESULT_MARKERS,
  AskUserArgsSchema,
  RequestIntegrationArgsSchema,
  integrationQuestionSet,
  type QuestionSetData,
} from "@repo/contracts";
import type { Msg } from "../schemas/agentSchemas";
import { QUESTION_TOOL_NAMES } from "./constants";
import type { QuestionCardModel, QuestionCardStatus } from "./types";

const markers = AGENT_TOOL_RESULT_MARKERS;

export function isQuestionToolCall(msg: Msg): boolean {
  const toolName = msg.data?.toolName;
  return msg.type === "toolCall" && (toolName === QUESTION_TOOL_NAMES.askUser || toolName === QUESTION_TOOL_NAMES.requestIntegration);
}

function toolResultStatus(toolName: string | undefined, result: string | undefined): QuestionCardStatus {
  if (result === undefined) return "waiting";
  if (result.startsWith(markers.error)) return "failed";
  if (result.startsWith(markers.cancelled)) return "cancelled";
  if (toolName === QUESTION_TOOL_NAMES.askUser) return result.startsWith(markers.answered) ? "answered" : "skipped";
  return result.includes(markers.integrationConnected) ? "answered" : "skipped";
}

export function cardFromSet(set: QuestionSetData, status: QuestionCardStatus): QuestionCardModel {
  return { intro: set.intro, items: set.items, moreCount: set.moreCount, status };
}

export function cardFromToolCall(call: Msg, result: string | undefined): QuestionCardModel | null {
  const toolName = call.data?.toolName;
  const status = toolResultStatus(toolName, result);
  if (toolName === QUESTION_TOOL_NAMES.askUser) {
    const parsed = AskUserArgsSchema.safeParse(call.data?.args);
    if (!parsed.success) return null;
    return { intro: "", items: parsed.data.questions, moreCount: 0, status };
  }
  const parsed = RequestIntegrationArgsSchema.safeParse(call.data?.args);
  if (!parsed.success) return null;
  return cardFromSet(integrationQuestionSet(parsed.data.reason, [parsed.data.provider]), status);
}
