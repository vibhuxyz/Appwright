import { z } from "zod";

export const MAX_REVIEW_ISSUES = 12;

const Score = z.number().int().min(1).max(5);

export const VisualIssueSchema = z.object({
  route: z.string().min(1).max(200),
  viewport: z.string().min(1).max(20),
  severity: z.enum(["severe", "minor"]),
  area: z.string().min(1).max(80),
  problem: z.string().min(1).max(240),
  fix: z.string().min(1).max(240),
});
export type VisualIssue = z.infer<typeof VisualIssueSchema>;

export const VisualReviewSchema = z.object({
  scores: z.object({
    hierarchy: Score,
    layout: Score,
    typography: Score,
    imagery: Score,
    spacing: Score,
    composition: Score,
    color: Score,
    rhythm: Score,
    distinctiveness: Score,
    mobile: Score,
  }),
  issues: z.array(VisualIssueSchema).max(MAX_REVIEW_ISSUES),
});
export type VisualReview = z.infer<typeof VisualReviewSchema>;
