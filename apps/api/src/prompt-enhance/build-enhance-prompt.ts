import { ENHANCE_INSTRUCTIONS } from "./instructions";

const USER_PROMPT_CLOSE_TAG = "</user-prompt>";
const ESCAPED_USER_PROMPT_CLOSE_TAG = "<\\/user-prompt>";

export function buildEnhancePrompt(userPrompt: string): string {
  const escaped = userPrompt.replaceAll(
    USER_PROMPT_CLOSE_TAG,
    ESCAPED_USER_PROMPT_CLOSE_TAG,
  );
  return `${ENHANCE_INSTRUCTIONS}\n\n<user-prompt>\n${escaped}\n${USER_PROMPT_CLOSE_TAG}`;
}
