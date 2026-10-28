import path from "node:path";
import { reviewScreenshots, type VisualIssue } from "@repo/agent-core";
import type { BrowserCheckResult } from "@repo/browser";
import { createLogger } from "@repo/logger";
import { sessionBrowserReportPath } from "@repo/workspace";
import type { PersistFields } from "../persist";
import { readShots, type ShotFile } from "./read-shots";

const log = createLogger("visual-review");
const REVIEW_VIEWPORTS = ["desktop", "mobile"] as const;
const MAX_REVIEW_ROUTES = 2;

export interface ReviewNewPagesParams {
  readonly check: BrowserCheckResult | undefined;
  readonly projectId: string;
  readonly sessionId: string;
  readonly persist: (fields: PersistFields) => Promise<unknown>;
}

export function isVisualReviewEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.VISUAL_REVIEW !== "false";
}

export function shotsToReview(check: BrowserCheckResult, outputDir: string): ShotFile[] {
  if (check.status !== "checked" || check.risk !== "page") return [];
  const routes = [...new Set(check.report.pageShots.map((shot) => shot.route))].sort().slice(0, MAX_REVIEW_ROUTES);
  const wanted = new Set<string>(REVIEW_VIEWPORTS);
  return check.report.pageShots
    .filter((shot) => routes.includes(shot.route) && wanted.has(shot.viewport))
    .sort((left, right) => left.route.localeCompare(right.route) || left.viewport.localeCompare(right.viewport))
    .map((shot) => ({ route: shot.route, viewport: shot.viewport, filePath: path.join(outputDir, shot.file) }));
}

export async function reviewNewPages(params: ReviewNewPagesParams): Promise<VisualIssue[]> {
  const { check, projectId, sessionId, persist } = params;
  if (!check || !isVisualReviewEnabled()) return [];
  const files = shotsToReview(check, sessionBrowserReportPath(projectId, sessionId));
  if (files.length === 0) return [];
  const { shots, skipped: oversized } = await readShots(files);
  if (oversized.length > 0) log.warn("screenshots too large to review", { sessionId, oversized });
  const result = await reviewScreenshots({ shots });
  if (!result.ok) {
    log.warn("visual review skipped", { sessionId, reason: result.reason });
    await persist({ role: "assistant", type: "text", content: `⚠️ Visual review not run: ${result.reason}` });
    return [];
  }
  const { review, model, promptVersion, costUsd, reviewed, skipped } = result;
  log.info("visual review", { sessionId, model, promptVersion, costUsd, reviewed: reviewed.length, skipped, issues: review.issues.length });
  const scores = Object.entries(review.scores).map(([name, score]) => `${name} ${score}/5`).join(", ");
  const severe = review.issues.filter((issue) => issue.severity === "severe").length;
  await persist({
    role: "assistant",
    type: "text",
    content: `🔎 Visual review (AI judgement of ${reviewed.length} screenshot(s), not a measurement): ${scores}. ${severe} severe and ${review.issues.length - severe} minor issue(s).`,
    data: { visualReview: { model, promptVersion, scores: review.scores, issues: review.issues } },
  });
  return review.issues;
}
