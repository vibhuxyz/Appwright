import { z } from "zod";
import { BlueprintSchema, TaskSchema } from "@repo/contracts";

export const PlanTaskSchema = TaskSchema.pick({
  id: true,
  type: true,
  title: true,
  owns: true,
  reads: true,
  riskTier: true,
  capability: true,
  verification: true,
});
export type PlanTask = z.infer<typeof PlanTaskSchema>;

export const PlanIssueSchema = z.object({
  code: z.string(),
  message: z.string(),
});

export const PlanQuestionSchema = z.object({
  need: z.string(),
  text: z.string(),
  defaultAnswer: z.boolean(),
});
export type PlanQuestion = z.infer<typeof PlanQuestionSchema>;

export const PlanContractSchema = z.object({
  blueprint: BlueprintSchema,
  tasks: z.array(PlanTaskSchema),
  dependsOn: z.record(z.string(), z.array(z.string())),
  levels: z.array(z.array(z.string())),
  ownershipConflicts: z.array(z.tuple([z.string(), z.string()])),
  warnings: z.array(PlanIssueSchema),
  estimatedCostCents: z.number().int().nonnegative(),
});
export type PlanContract = z.infer<typeof PlanContractSchema>;

export const PlanRejectionSchema = z.object({
  issues: z.array(PlanIssueSchema),
});
export type PlanRejection = z.infer<typeof PlanRejectionSchema>;

export const ChangeRequestSchema = z.object({
  taskId: z.string().min(1),
  why: z.string().min(1),
  patch: BlueprintSchema.partial(),
  blocks: z.array(z.string()),
});

export const ChangeRequestDecisionSchema = z.discriminatedUnion("status", [
  z.object({ status: z.literal("rejected"), reason: z.string() }),
  z.object({ status: z.literal("needs_confirmation"), blueprint: BlueprintSchema }),
  z.object({
    status: z.literal("approved"),
    blueprint: BlueprintSchema,
    affectedTaskIds: z.array(z.string()),
  }),
]);
export type ChangeRequestDecisionContract = z.infer<typeof ChangeRequestDecisionSchema>;
