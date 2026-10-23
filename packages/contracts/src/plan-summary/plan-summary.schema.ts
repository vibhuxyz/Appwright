import { z } from "zod";
import { AssetPurpose } from "../asset.schema";

export const PLAN_SUMMARY_LIMITS = {
  maxPages: 12,
  maxSectionsPerPage: 16,
  maxNameChars: 80,
  maxPurposeChars: 300,
  maxFeatures: 8,
} as const;

export const PlanSectionSchema = z.object({
  name: z.string().min(1).max(PLAN_SUMMARY_LIMITS.maxNameChars),
  image: AssetPurpose.optional(),
});
export type PlanSection = z.infer<typeof PlanSectionSchema>;

export const PlanPageSchema = z.object({
  route: z.string().min(1).max(PLAN_SUMMARY_LIMITS.maxNameChars),
  purpose: z.string().min(1).max(PLAN_SUMMARY_LIMITS.maxPurposeChars),
  sections: z.array(PlanSectionSchema).max(PLAN_SUMMARY_LIMITS.maxSectionsPerPage),
});
export type PlanPage = z.infer<typeof PlanPageSchema>;

export const PlanSummarySchema = z.object({
  pages: z.array(PlanPageSchema).min(1).max(PLAN_SUMMARY_LIMITS.maxPages),
  features: z.array(z.string().min(1).max(PLAN_SUMMARY_LIMITS.maxNameChars)).max(PLAN_SUMMARY_LIMITS.maxFeatures),
});
export type PlanSummary = z.infer<typeof PlanSummarySchema>;
