import type { Attachment } from "@repo/contracts";
import { extractJsonFromReply } from "../multimodal/parse-json";
import { costUsd } from "../providers/pricing";
import { OpenAiProvider } from "../providers/openai";
import type { Provider } from "../providers/types";
import type { Message } from "../types";
import { VISUAL_REVIEW_PROMPT_VERSION, buildRepairPrompt, buildReviewPrompt } from "./build-review-prompt";
import { VisualReviewSchema, type VisualReview } from "./schema";
import type { ReviewOptions, ReviewResult, ReviewShot, ShotRef } from "./types";

export const VISUAL_REVIEW_MODEL = "gemini-3.7-flash";
const REVIEW_TIMEOUT_MS = 90_000;
const MAX_SHOTS = 4;
export const MAX_SHOT_BYTES = 4_000_000;
const MAX_REPLY_BYTES = 60_000;

interface Loaded {
  readonly attachments: Attachment[];
  readonly reviewed: ShotRef[];
  readonly skipped: { shot: ShotRef; reason: string }[];
}

function refOf(shot: ReviewShot): ShotRef {
  return { route: shot.route, viewport: shot.viewport };
}

function loadShots(shots: readonly ReviewShot[]): Loaded {
  const loaded: Loaded = { attachments: [], reviewed: [], skipped: [] };
  for (const shot of shots.slice(MAX_SHOTS)) loaded.skipped.push({ shot: refOf(shot), reason: `only ${MAX_SHOTS} screenshots are reviewed` });
  for (const shot of shots.slice(0, MAX_SHOTS)) {
    const bytes = shot.png.byteLength;
    if (bytes > MAX_SHOT_BYTES) {
      loaded.skipped.push({ shot: refOf(shot), reason: `${bytes} bytes is over the ${MAX_SHOT_BYTES}-byte limit` });
      continue;
    }
    const base64 = Buffer.from(shot.png).toString("base64");
    loaded.attachments.push({
      name: `${shot.viewport}${shot.route.replaceAll("/", "-")}.png`,
      mimeType: "image/png",
      type: "image",
      sizeBytes: bytes,
      dataUrl: `data:image/png;base64,${base64}`,
      status: "COMPLETED",
    });
    loaded.reviewed.push(refOf(shot));
  }
  return loaded;
}

async function ask(provider: Provider, messages: Message[], signal: AbortSignal): Promise<{ text: string; costUsd: number }> {
  const parts: string[] = [];
  let bytes = 0;
  let cost = 0;
  for await (const chunk of provider.stream(messages, [], { signal })) {
    if (chunk.type === "usage") cost += costUsd(provider.model, chunk);
    if (chunk.type !== "text_delta") continue;
    bytes += Buffer.byteLength(chunk.delta, "utf8");
    if (bytes > MAX_REPLY_BYTES) throw new Error(`Visual review reply exceeded ${MAX_REPLY_BYTES} bytes`);
    parts.push(chunk.delta);
  }
  return { text: parts.join(""), costUsd: cost };
}

function parseReview(text: string): { review: VisualReview } | { error: string } {
  const parsed = VisualReviewSchema.safeParse(extractJsonFromReply(text));
  return parsed.success ? { review: parsed.data } : { error: parsed.error.message };
}

async function runReview(provider: Provider, loaded: Loaded, signal: AbortSignal): Promise<ReviewResult> {
  const first: Message = { role: "user", type: "text", content: buildReviewPrompt(loaded.reviewed), attachments: loaded.attachments };
  const answer = await ask(provider, [first], signal);
  const parsed = parseReview(answer.text);
  const base = { reviewed: loaded.reviewed, skipped: loaded.skipped, model: provider.model, promptVersion: VISUAL_REVIEW_PROMPT_VERSION };
  if ("review" in parsed) return { ok: true, review: parsed.review, ...base, costUsd: answer.costUsd };
  const retry = await ask(
    provider,
    [first, { role: "assistant", type: "text", content: answer.text }, { role: "user", type: "text", content: buildRepairPrompt(answer.text, parsed.error) }],
    signal,
  );
  const repaired = parseReview(retry.text);
  if ("error" in repaired) return { ok: false, reason: `Visual review returned invalid JSON twice: ${repaired.error.slice(0, 300)}` };
  return { ok: true, review: repaired.review, ...base, costUsd: answer.costUsd + retry.costUsd };
}

export async function reviewScreenshots(options: ReviewOptions): Promise<ReviewResult> {
  if (options.shots.length === 0) return { ok: false, reason: "No screenshots to review" };
  const loaded = loadShots(options.shots);
  if (loaded.reviewed.length === 0) return { ok: false, reason: "Every screenshot was over the size limit" };
  const signal = options.signal ?? AbortSignal.timeout(REVIEW_TIMEOUT_MS);
  try {
    const provider = options.provider ?? new OpenAiProvider({ model: options.model ?? VISUAL_REVIEW_MODEL });
    return await runReview(provider, loaded, signal);
  } catch (error) {
    if (!(error instanceof Error)) throw error;
    return { ok: false, reason: `Visual review unavailable: ${error.message}` };
  }
}
