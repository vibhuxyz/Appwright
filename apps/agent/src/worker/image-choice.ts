import { IMAGE_CHOICE_AUTO, IMAGE_CHOICE_KEY } from "@repo/contracts";

function choiceOf(data: unknown): unknown {
  return typeof data === "object" && data !== null && IMAGE_CHOICE_KEY in data
    ? (data as Record<string, unknown>)[IMAGE_CHOICE_KEY]
    : undefined;
}

export function isAutoImageChoice(rows: readonly { data: unknown }[]): boolean {
  return rows.some((row) => choiceOf(row.data) === IMAGE_CHOICE_AUTO);
}
