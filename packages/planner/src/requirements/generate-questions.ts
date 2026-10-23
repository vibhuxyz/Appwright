import { z } from "zod";
import {
  MAX_GAP_QUESTIONS,
  MAX_PROMPT_CHARS,
  MAX_QUESTION_LABEL_CHARS,
  MAX_QUESTION_NEED_CHARS,
  MAX_QUESTION_OPTION_CHARS,
  MAX_QUESTION_OPTIONS,
  MAX_QUESTION_TEXT_CHARS,
  MAX_QUESTIONS,
  MIN_QUESTION_OPTIONS,
} from "./constants";
import { extractFacts } from "../discovery/extract";
import { extractJsonObject } from "../shared";
import type { IntakeQuestion } from "./types";

const QUESTIONS_INSTRUCTIONS = `You write intake questions for an app builder.

Read the user request. Find the product decisions it leaves open that would change what gets built, then ask about those — not a generic checklist.

Rules:
- If this is a small edit, a question, or already fully specified, return {"questions":[]}.
- If they want a new app or a substantial feature, return only the material product decisions that are still open, grouped in one concise batch of at most 8.
- Questions must be about THIS product. A todo app should ask about sharing, due dates, or lists. A shop should ask about catalog, checkout, or inventory. Never use a generic platform checklist.
- Do not ask about languages, frameworks, databases, hosting, or visual style.
- Never ask whether to include standard engineering work. The builder adds responsive layout, navigation, loading and error states, accessibility, SEO, security, tests, an admin panel for managing business content, image handling, and deployment readiness by itself.
- Do not add photo-upload or brand-asset questions. Images are collected after the plan and design system exist.
- Only ask decisions that change the product or business: ordering versus browsing only, accounts versus guest access, which payment provider or outside system must be connected, or a business rule that cannot be safely inferred.
- Do not ask anything the request already decided. If they named the business, gave an address, email, phone, or social profile, do not ask for that fact again.
- Do not rephrase contact or social collection as a single paste-links question. Those details are collected as one input per profile and contact method.
- Each question gets 2 to 4 short multiple-choice options that are the real, distinct answers to that question for this product (e.g. "Pickup only", "Delivery only", "Both pickup and delivery"), not "Yes"/"No" unless the decision is truly binary.
- defaultOptionIndex is the index of the best default if they skip.
- need is a unique kebab-case id. label is a 1-3 word preview heading. text is the spoken question.

Return ONLY JSON:
{"questions":[{"need":"ordering","text":"Should customers be able to order items for pickup or delivery?","label":"Ordering","options":["Pickup only","Delivery only","Both pickup and delivery","Neither, just browsing"],"defaultOptionIndex":2}]}
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
  return { need, text, label, options, defaultOptionIndex, inputType: "single", importance: "required" };
}

function withCatalogPhrasing(question: IntakeQuestion, match: IntakeQuestion | undefined): IntakeQuestion {
  if (!match || question.inputType === "contacts") return question;
  const keepCatalogOptions =
    question.inputType === "short-text" ||
    question.inputType === "images" ||
    match.options.length < MIN_QUESTION_OPTIONS;
  return {
    ...question,
    text: match.text,
    label: match.label,
    options: keepCatalogOptions ? question.options : match.options,
    defaultOptionIndex: keepCatalogOptions ? question.defaultOptionIndex : match.defaultOptionIndex,
  };
}

export function mergeQuestionPhrasing(
  catalog: readonly IntakeQuestion[],
  phrased: readonly IntakeQuestion[],
  answeredNeeds: ReadonlySet<string>,
): IntakeQuestion[] {
  const byNeed = new Map(phrased.map((question) => [question.need, question]));
  const catalogNeeds = new Set(catalog.map((question) => question.need));
  const gaps = phrased
    .filter((question) => !catalogNeeds.has(question.need) && !answeredNeeds.has(question.need))
    .slice(0, MAX_GAP_QUESTIONS);
  return [
    ...catalog.map((question) => withCatalogPhrasing(question, byNeed.get(question.need))),
    ...gaps,
  ].slice(0, MAX_QUESTIONS);
}

function knownFactsBlock(prompt: string, answers: Readonly<Record<string, string>>): string {
  const known = Object.entries(extractFacts(prompt, answers).answered)
    .filter(([, value]) => value.length > 0)
    .slice(0, 20)
    .map(([id, value]) => `- ${id}: ${clip(value, 120)}`);
  if (known.length === 0) return "";
  return `Already known from the request (do not ask these again):\n${known.join("\n")}\n\n`;
}

function plannedQuestionsBlock(planned: readonly Pick<IntakeQuestion, "need" | "text">[]): string {
  if (planned.length === 0) return "";
  const lines = planned.map((question) => `- ${question.need}: ${clip(question.text, MAX_QUESTION_TEXT_CHARS)}`);
  return `Already being asked this round (reuse these exact need ids to rephrase them; do not ask them again under another id):\n${lines.join("\n")}\nYou may add at most ${MAX_GAP_QUESTIONS} more questions for open decisions this list does not cover.\n\n`;
}

export function buildQuestionsPrompt(
  prompt: string,
  answers: Readonly<Record<string, string>> = {},
  planned: readonly Pick<IntakeQuestion, "need" | "text">[] = [],
): string {
  const request = clip(escapeRequest(prompt), MAX_PROMPT_CHARS);
  return `${QUESTIONS_INSTRUCTIONS}${knownFactsBlock(prompt, answers)}${plannedQuestionsBlock(planned)}<user-request>\n${request}\n</user-request>`;
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
