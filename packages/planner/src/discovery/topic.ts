import type { MaterialTopic } from "./types";

export function topic(
  id: string,
  label: string,
  text: string,
  why: string,
  options: readonly string[],
  defaultOptionIndex: number,
  extra: Partial<Pick<MaterialTopic, "importance" | "inputType" | "prefill">> = {},
): MaterialTopic {
  return {
    id,
    label,
    text,
    why,
    options,
    defaultOptionIndex,
    importance: extra.importance ?? "required",
    inputType: extra.inputType ?? "single",
    ...(extra.prefill ? { prefill: extra.prefill } : {}),
  };
}

export function textTopic(id: string, label: string, text: string, why: string): MaterialTopic {
  return topic(id, label, text, why, [], 0, { inputType: "short-text", importance: "required" });
}
