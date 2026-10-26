const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior)\s+instructions/gi,
  /disclose\s+(system\s+)?(keys|secrets|passwords|env)/gi,
  /reveal\s+(the\s+)?system\s+prompt/gi,
  /bypass\s+(all\s+)?(security|guardrails|safety)/gi,
  /execute\s+command\s*:/gi,
];

export function sanitizeUntrustedAttachmentText(raw: string): string {
  let sanitized = raw
    .replaceAll("</attachment-content>", "<\\/attachment-content>")
    .replaceAll("</user-request>", "<\\/user-request>")
    .replaceAll("</project-specification>", "<\\/project-specification>");

  for (const pattern of INJECTION_PATTERNS) {
    sanitized = sanitized.replace(pattern, "[redacted disallowed instruction]");
  }

  return sanitized;
}

export function escapePromptXml(text: string): string {
  return text
    .replaceAll("</user-prompt>", "<\\/user-prompt>")
    .replaceAll("</instructions>", "<\\/instructions>");
}
