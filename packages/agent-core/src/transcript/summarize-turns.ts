import { isPureChat, isVerificationTranscript, looksLikeSnippet } from "./turn-filters";

const MAX_SUMMARY_SENTENCES = 4;
const MAX_SENTENCE_CHARS = 90;
const MIN_ASSISTANT_CHARS = 24;

export interface SummaryTurn {
  readonly user: string;
  readonly assistant?: string;
}

function clip(text: string): string {
  const flat = text.replace(/\s+/g, " ").trim();
  return flat.length <= MAX_SENTENCE_CHARS ? flat : `${flat.slice(0, MAX_SENTENCE_CHARS - 1).trimEnd()}…`;
}

function keepTurn(turn: SummaryTurn): boolean {
  const user = turn.user.trim();
  if (user.length === 0) return false;
  return !isPureChat(user) && !isVerificationTranscript(undefined, user) && !looksLikeSnippet(turn.user);
}

function pick(sentences: readonly string[]): string[] {
  if (sentences.length <= MAX_SUMMARY_SENTENCES) return [...sentences];
  const oldest = sentences[0];
  if (!oldest) return [];
  return [oldest, ...sentences.slice(-(MAX_SUMMARY_SENTENCES - 1))];
}

function assistantSentence(turns: readonly SummaryTurn[]): string | undefined {
  const reported = [...turns].reverse().find((turn) => {
    const assistant = turn.assistant?.trim() ?? "";
    return assistant.length >= MIN_ASSISTANT_CHARS && !isVerificationTranscript(undefined, assistant) && !looksLikeSnippet(assistant);
  });
  return reported?.assistant ? `The assistant last reported: ${clip(reported.assistant)}.` : undefined;
}

export function summarizeTurns(turns: readonly SummaryTurn[]): string {
  const kept = turns.filter(keepTurn);
  if (kept.length === 0) return "";
  const picked = pick(kept.map((turn) => `The user asked: ${clip(turn.user)}.`));
  const outcome = picked.length < MAX_SUMMARY_SENTENCES ? assistantSentence(kept) : undefined;
  return outcome ? [...picked, outcome].join(" ") : picked.join(" ");
}
