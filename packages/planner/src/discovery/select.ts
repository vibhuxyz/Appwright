import { MAX_QUESTIONS_PER_BATCH } from "./constants";
import { extractFacts } from "./extract";
import { materialTopics } from "./catalog";
import { workflowsFrom } from "./workflows";
import type {
  DiscoveryAssumption,
  DiscoveryQuestion,
  DiscoveryState,
  ExtractedFacts,
  MaterialTopic,
} from "./types";

function toQuestion(topic: MaterialTopic): DiscoveryQuestion {
  return {
    need: topic.id,
    text: topic.text,
    label: topic.label,
    options: topic.options,
    defaultOptionIndex: topic.defaultOptionIndex,
    inputType: topic.inputType,
    importance: topic.importance,
    why: topic.why,
    ...(topic.prefill ? { prefill: topic.prefill } : {}),
  };
}

function defaultValue(topic: MaterialTopic): string {
  return topic.options[topic.defaultOptionIndex] ?? topic.options[0] ?? "";
}

function remainingTopics(facts: ExtractedFacts): MaterialTopic[] {
  const required: MaterialTopic[] = [];
  const optional: MaterialTopic[] = [];
  for (const topic of materialTopics(facts)) {
    if (topic.importance === "required") required.push(topic);
    else optional.push(topic);
  }
  return [...required, ...optional];
}

function assumptionsFrom(facts: ExtractedFacts, leftover: readonly MaterialTopic[]): DiscoveryAssumption[] {
  return leftover
    .filter((topic) => topic.importance === "optional")
    .map((topic) => ({
      topic: topic.id,
      value: defaultValue(topic),
      reason: `Not asked this round; using the safe default (${defaultValue(topic)}).`,
    }));
}

export function advanceDiscovery(
  prompt: string,
  answers: Readonly<Record<string, string>> = {},
): DiscoveryState {
  const facts = extractFacts(prompt, answers);
  const remaining = remainingTopics(facts);
  const requiredCore = remaining.filter((topic) => topic.importance === "required");
  const optional = remaining.filter((topic) => topic.importance === "optional");

  if (requiredCore.length > 0) {
    const batch = requiredCore.slice(0, MAX_QUESTIONS_PER_BATCH);
    return {
      facts,
      workflows: workflowsFrom(facts),
      questions: batch.map(toQuestion),
      assumptions: assumptionsFrom(facts, optional),
      resolved: facts.answered,
    };
  }

  return {
    facts,
    workflows: workflowsFrom(facts),
    questions: [],
    assumptions: assumptionsFrom(facts, optional),
    resolved: facts.answered,
  };
}

export function selectDiscoveryQuestions(
  prompt: string,
  answers: Readonly<Record<string, string>> = {},
): readonly DiscoveryQuestion[] {
  return advanceDiscovery(prompt, answers).questions;
}
