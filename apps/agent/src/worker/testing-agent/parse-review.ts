import { z } from "zod";
import { MAX_FIX_CHARS, MAX_MUST_FIX, MAX_NOTES_CHARS } from "./constants";
import { clip } from "./text";
import type { RepairDecision, TestingReview } from "./types";

const JSON_FENCE = /^```(?:json)?[ \t]*\r?\n([\s\S]*?)\r?\n```[ \t]*$/;

const ReviewBody = z.object({
  status: z.enum(["pass", "fail"]),
  notes: z.string().optional(),
  mustFix: z.array(z.string()).optional(),
});

function readJson(source: string): { ok: true; value: unknown } | { ok: false } {
  try {
    return { ok: true, value: JSON.parse(source) };
  } catch (error) {
    if (error instanceof SyntaxError) return { ok: false };
    throw error;
  }
}

function normalize(body: z.infer<typeof ReviewBody>): TestingReview {
  const mustFix = [...new Set((body.mustFix ?? []).map((item) => clip(item, MAX_FIX_CHARS)).filter((item) => item.length > 0))].slice(0, MAX_MUST_FIX);
  return {
    status: mustFix.length > 0 ? "fail" : body.status,
    notes: clip(body.notes ?? "", MAX_NOTES_CHARS),
    mustFix,
  };
}

export function parseTestingReview(text: string): TestingReview | undefined {
  const trimmed = text.trim();
  const fenced = JSON_FENCE.exec(trimmed);
  const source = (fenced?.[1] ?? trimmed).trim();
  const parsed = readJson(source);
  if (!parsed.ok) return undefined;
  const result = ReviewBody.safeParse(parsed.value);
  return result.success ? normalize(result.data) : undefined;
}

export function decideRepair(review: TestingReview | undefined, measured: readonly string[]): RepairDecision {
  const kept = measured.map((item) => clip(item, MAX_FIX_CHARS)).filter((item) => item.length > 0);
  const mustFix = [...new Set([...kept, ...(review?.mustFix ?? [])])].slice(0, MAX_MUST_FIX);
  if (mustFix.length > 0) return { status: "fail", mustFix };
  return { status: review?.status ?? "pass", mustFix: [] };
}
