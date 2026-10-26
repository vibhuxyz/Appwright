import { DECIDE_FOR_ME_OPTION, SKIPPED_ANSWER, type CreativeChoiceNeed } from "./constants";

export function isDecideForMe(
  answers: Readonly<Record<string, string>> | undefined,
  need: CreativeChoiceNeed,
): boolean {
  const answer = answers?.[need];
  return answer === DECIDE_FOR_ME_OPTION || answer === SKIPPED_ANSWER;
}

export function hasCreativeChoice(
  answers: Readonly<Record<string, string>> | undefined,
  need: CreativeChoiceNeed,
): boolean {
  return answers?.[need] !== undefined;
}
