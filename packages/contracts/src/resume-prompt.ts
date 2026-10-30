export const RESUME_PROMPT = "Continue building the remaining tasks in the plan until complete.";

const STOP_CONTEXT_INTRO = "The last run stopped because: ";

export function resumePrompt(stopDetail?: string): string {
  const detail = stopDetail?.replace(/\s+/g, " ").trim();
  return detail ? `${RESUME_PROMPT}\n\n${STOP_CONTEXT_INTRO}${detail}` : RESUME_PROMPT;
}

export function isResumePrompt(prompt: string): boolean {
  return prompt.trim().startsWith(RESUME_PROMPT);
}
