import { z } from "zod";
import {
  MAX_PROMPT_CHARS,
  MAX_QUESTION_LABEL_CHARS,
  MAX_QUESTION_NEED_CHARS,
  MAX_QUESTION_OPTION_CHARS,
  MAX_QUESTION_OPTIONS,
  MAX_QUESTION_TEXT_CHARS,
  MAX_QUESTIONS,
  MIN_QUESTION_OPTIONS,
} from "./constants";
import { extractJsonObject } from "../shared";
import type { IntakeQuestion } from "./types";

const QUESTIONS_INSTRUCTIONS = `You write intake questions for an app builder.

Read the user request. Find the product decisions it leaves open that would change what gets built, then ask about those — not a generic checklist.

Rules:
- If this is a small edit, a question, or already fully specified, return {"questions":[]}.
- If they want a new app or a substantial feature, return 1 to 3 questions.
- Questions must be about THIS product. A todo app should ask about sharing, due dates, or lists. A shop should ask about catalog, checkout, or inventory. Never use a generic platform checklist.
- Do not ask about languages, frameworks, databases, hosting, or visual style.
- Do not ask anything the request already decided.
- Each question gets 2 to 4 short multiple-choice options that are the real, distinct answers to that question for this product (e.g. "Pickup only", "Delivery only", "Both pickup and delivery"), not "Yes"/"No" unless the decision is truly binary.
- defaultOptionIndex is the index of the best default if they skip.
- need is a unique kebab-case id. label is a 1-3 word preview heading. text is the spoken question.

Return ONLY JSON:
{"questions":[{"need":"ordering","text":"Should customers be able to order items for pickup or delivery?","label":"Ordering","options":["Pickup only","Delivery only","Both pickup and delivery","Neither, just browsing"],"defaultOptionIndex":2}]}

User request:
`;

const GeneratedItemSchema = z.object({
  need: z.string().optional(),
  text: z.string().optional(),
  label: z.string().optional(),
  options: z.array(z.string()).optional(),
  defaultOptionIndex: z.number().optional(),
});

const GeneratedQuestionsSchema = z.object({
  questions: z.array(GeneratedItemSchema),
});

export type ParsedQuestions =
  | { ok: true; questions: IntakeQuestion[] }
  | { ok: false; reason: "invalid_json" | "invalid_shape" };

function clip(value: string, max: number): string {
  const trimmed = value.replace(/\s+/g, " ").trim();
  if (trimmed.length <= max) return trimmed;
  return trimmed.slice(0, max).trimEnd();
}

function toNeedSlug(raw: string, index: number): string {
  const slug = raw
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAX_QUESTION_NEED_CHARS);
  return slug.length > 0 ? slug : `need-${index + 1}`;
}

function labelFromSlug(need: string): string {
  return need
    .split("-")
    .filter((part) => part.length > 0)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

function escapeRequest(text: string): string {
  return text.replaceAll("</user-request>", "<\\/user-request>");
}

function normalizeOptions(raw: readonly string[] | undefined): string[] {
  if (!raw) return [];
  const seen = new Set<string>();
  const options: string[] = [];
  for (const item of raw) {
    const clipped = clip(item, MAX_QUESTION_OPTION_CHARS);
    if (clipped.length === 0 || seen.has(clipped)) continue;
    seen.add(clipped);
    options.push(clipped);
    if (options.length === MAX_QUESTION_OPTIONS) break;
  }
  return options;
}

function normalizeDefaultOptionIndex(raw: number | undefined, optionCount: number): number {
  if (typeof raw !== "number" || !Number.isInteger(raw) || raw < 0 || raw >= optionCount) return 0;
  return raw;
}

function normalizeQuestion(
  item: z.infer<typeof GeneratedItemSchema>,
  index: number,
): IntakeQuestion | undefined {
  const text = clip(item.text ?? "", MAX_QUESTION_TEXT_CHARS);
  if (text.length === 0) return undefined;
  const options = normalizeOptions(item.options);
  if (options.length < MIN_QUESTION_OPTIONS) return undefined;
  const need = toNeedSlug(item.need ?? text, index);
  const label = clip(item.label ?? labelFromSlug(need), MAX_QUESTION_LABEL_CHARS);
  if (label.length === 0) return undefined;
  const defaultOptionIndex = normalizeDefaultOptionIndex(item.defaultOptionIndex, options.length);
  return { need, text, label, options, defaultOptionIndex };
}

export function buildQuestionsPrompt(prompt: string): string {
  const request = clip(escapeRequest(prompt), MAX_PROMPT_CHARS);
  return `${QUESTIONS_INSTRUCTIONS}<user-request>\n${request}\n</user-request>`;
}

export function parseGeneratedQuestions(raw: string): ParsedQuestions {
  const extracted = extractJsonObject(raw);
  if (extracted === undefined) return { ok: false, reason: "invalid_json" };
  const parsed = GeneratedQuestionsSchema.safeParse(extracted);
  if (!parsed.success) return { ok: false, reason: "invalid_shape" };
  const seen = new Set<string>();
  const questions: IntakeQuestion[] = [];
  for (const item of parsed.data.questions) {
    const question = normalizeQuestion(item, questions.length);
    if (!question || seen.has(question.need)) continue;
    seen.add(question.need);
    questions.push(question);
    if (questions.length === MAX_QUESTIONS) break;
  }
  return { ok: true, questions };
}
