import type { ProjectMemoryRows } from "@repo/contracts";
import { isPureChat, isVerificationTranscript, looksLikeSnippet } from "../transcript";
import { SHORT_SHA_LENGTH } from "./constants";
import { CheckpointDataSchema, QuestionItemsSchema, VerificationSchema, parseOr } from "./schemas";
import { flatten, isoDate } from "./text";

const DECISION_PATTERN =
  /\b(auth|login|sign[- ]?in|sign[- ]?up|payment|razorpay|stripe|database|mongo(?:db)?|postgres|stack|next\.?js|appwrite|pricing|subscription|admin|upload|email|oauth|deploy|theme|gateway)\b/i;

type UserRow = ProjectMemoryRows["userRows"][number];

function isRecord(data: unknown): data is Record<string, unknown> {
  return typeof data === "object" && data !== null;
}

function skipsPrompt(row: UserRow): boolean {
  if (!isRecord(row.data)) return true;
  if ("intake" in row.data || "transcriptOnly" in row.data) return true;
  return isVerificationTranscript(row.data, row.content) || isPureChat(row.content) || looksLikeSnippet(row.content);
}

export function quotedItems(userRows: readonly UserRow[]): string[] {
  return userRows
    .filter((row) => !skipsPrompt(row) && !(isRecord(row.data) && "questionReply" in row.data))
    .map((row) => `"${flatten(row.content)}" (${isoDate(row.createdAt)})`);
}

function decisionLine(row: UserRow): string | undefined {
  if (skipsPrompt(row) && !(isRecord(row.data) && "questionReply" in row.data)) return undefined;
  if (isPureChat(row.content) || isVerificationTranscript(row.data, row.content) || looksLikeSnippet(row.content)) return undefined;
  if (isRecord(row.data) && "blueprintId" in row.data) return `Plan approved (${isoDate(row.createdAt)})`;
  const chose = isRecord(row.data) && "questionReply" in row.data;
  if (!chose && !DECISION_PATTERN.test(row.content)) return undefined;
  return `${flatten(row.content)} (${isoDate(row.createdAt)})`;
}

export function decisionItems(userRows: readonly UserRow[]): string[] {
  return userRows.flatMap((row) => {
    const line = decisionLine(row);
    return line ? [line] : [];
  });
}

export function openItems(rows: Pick<ProjectMemoryRows, "questions" | "pendingIntegrations">): string[] {
  const questions = rows.questions
    .filter((row) => row.status === "PENDING")
    .flatMap((row) => parseOr(QuestionItemsSchema, row.questions, []))
    .map((item) => `${flatten(item.label)}: ${flatten(item.text)}`);
  const integrations = rows.pendingIntegrations.map(
    (row) => `Connect ${flatten(row.provider)}: ${flatten(row.reason)}`,
  );
  return [...questions, ...integrations];
}

function checksFor(row: ProjectMemoryRows["assistantRows"][number]): string[] {
  const parsed = VerificationSchema.safeParse(row.data);
  if (!parsed.success) return [];
  return parsed.data.verification.map((result) => `${flatten(result.check)} ${result.ok ? "passed" : "failed"}`);
}

export function statusItems(assistantRows: ProjectMemoryRows["assistantRows"]): string[] {
  let commit = "";
  let when = "";
  let checks: string[] = [];
  for (const row of assistantRows) {
    if (!commit) {
      const parsed = CheckpointDataSchema.safeParse(row.data);
      if (parsed.success) {
        commit = parsed.data.checkpoint.sha.slice(0, SHORT_SHA_LENGTH);
        when = isoDate(row.createdAt);
      }
    }
    if (checks.length === 0) {
      checks = checksFor(row);
      if (checks.length > 0 && !when) when = isoDate(row.createdAt);
    }
  }
  if (!commit && checks.length === 0) return [];
  const checkText = checks.length > 0 ? checks.join(", ") : "no checks recorded";
  const commitText = commit ? `commit ${commit}` : "no commit";
  return [`Last verified ${commitText}${when ? ` (${when})` : ""}: ${checkText}.`];
}
