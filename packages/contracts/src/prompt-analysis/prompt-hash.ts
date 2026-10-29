const NUL_CHARACTER = "\u0000";

export function storedPromptText(prompt: string): string {
  return prompt.replaceAll(NUL_CHARACTER, "");
}

export async function hashPrompt(prompt: string): Promise<string> {
  const bytes = new TextEncoder().encode(storedPromptText(prompt));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}
