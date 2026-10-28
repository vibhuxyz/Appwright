import { MAX_REVIEW_ISSUES } from "./schema";
import type { ShotRef } from "./types";

export const VISUAL_REVIEW_PROMPT_VERSION = "visual-review@2";

function shotList(shots: readonly ShotRef[]): string {
  return shots.map((shot, index) => `${index + 1}. route ${shot.route}, viewport ${shot.viewport}`).join("\n");
}

export function buildReviewPrompt(shots: readonly ShotRef[]): string {
  return [
    "You are a senior visual designer reviewing full-page screenshots of a generated website.",
    "The screenshots are attached in this order:",
    shotList(shots),
    "",
    "Judge only what you can see in still screenshots; motion and interaction are tested separately, so do not score them.",
    "Score each from 1 (broken) to 5 (polished):",
    "- hierarchy: one clear focal point per screen, then a readable order.",
    "- layout: alignment, grid, nothing spilling or colliding.",
    "- typography: one type scale, good line wrapping, no orphaned single words in headings.",
    "- imagery: images fit the business, crops keep the subject, consistent ratios inside grids.",
    "- spacing: generous, consistent whitespace inside sections.",
    "- composition: sections relate to each other; overlaps and asymmetry look deliberate, not accidental.",
    "- color: the palette feels owned by this business; one accent used sparingly; no pure black or white surfaces, no generic purple-to-blue gradient.",
    "- rhythm: density and surfaces alternate; no run of look-alike sections.",
    "- distinctiveness: the page has an idea of its own and does not read as a default template.",
    "- mobile: the phone layout is recomposed for touch (readable type, tappable controls, no tiny desktop shrink).",
    "List concrete defects only: overlapping or clipped text, broken or empty image frames, collapsed or unreadable sections, text with poor contrast, awkward gaps, elements spilling outside the screen, a subject cropped out of its image, a mobile layout that is just the desktop shrunk.",
    "severity is \"severe\" when a visitor would notice the page is broken, otherwise \"minor\". Do not report taste preferences as severe.",
    `At most ${MAX_REVIEW_ISSUES} issues. Each fix names the section and the change in one sentence.`,
    "",
    "Reply with JSON only, no prose:",
    '{"scores":{"hierarchy":1-5,"layout":1-5,"typography":1-5,"imagery":1-5,"spacing":1-5,"composition":1-5,"color":1-5,"rhythm":1-5,"distinctiveness":1-5,"mobile":1-5},"issues":[{"route":"/","viewport":"mobile","severity":"severe","area":"hero","problem":"...","fix":"..."}]}',
  ].join("\n");
}

export function buildRepairPrompt(reply: string, error: string): string {
  return [
    "Your previous reply was not valid for the required JSON shape.",
    `Validation error: ${error.replace(/\s+/g, " ").slice(0, 600)}`,
    `Previous reply (data): ${reply.replace(/\s+/g, " ").slice(0, 2000)}`,
    "Reply again with the JSON object only.",
  ].join("\n");
}
