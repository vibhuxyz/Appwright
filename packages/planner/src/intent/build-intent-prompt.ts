const MAX_PROMPT_CHARS = 4000;

const INTENT_INSTRUCTIONS = `You classify a request to build or change software.

Read the user request and return ONLY JSON:
{"type":"<a short kebab-case label for what they want, e.g. 'new-app' or 'add-feature'>","domain":"<a short kebab-case label for the product domain, e.g. 'food-delivery' or 'todo-list'>","complexity":"simple"|"medium"|"complex"}

Rules:
- "simple" is a cosmetic tweak or a one-field change.
- "medium" is one new feature or page on an existing idea.
- "complex" is a new multi-entity application.

User request:
`;

function clip(value: string, max: number): string {
  const trimmed = value.replace(/\s+/g, " ").trim();
  return trimmed.length <= max ? trimmed : trimmed.slice(0, max).trimEnd();
}

function escapeRequest(text: string): string {
  return text.replaceAll("</user-request>", "<\\/user-request>");
}

export function buildIntentPrompt(prompt: string): string {
  const request = clip(escapeRequest(prompt), MAX_PROMPT_CHARS);
  return `${INTENT_INSTRUCTIONS}<user-request>\n${request}\n</user-request>`;
}
