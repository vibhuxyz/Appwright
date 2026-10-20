import { z } from "zod";
import { BlueprintSchema, TaskSchema } from "@repo/contracts";

const contractTaskSchema = TaskSchema.pick({
  id: true,
  type: true,
  title: true,
  owns: true,
  reads: true,
  riskTier: true,
  capability: true,
  verification: true,
});

const planIssueSchema = z.object({ code: z.string(), message: z.string() });

export const planContractSchema = z.object({
  blueprint: BlueprintSchema,
  tasks: z.array(contractTaskSchema),
  dependsOn: z.record(z.string(), z.array(z.string())),
  levels: z.array(z.array(z.string())),
  ownershipConflicts: z.array(z.tuple([z.string(), z.string()])),
  warnings: z.array(planIssueSchema),
  estimatedCostCents: z.number().int().nonnegative(),
});
export type PlanContract = z.infer<typeof planContractSchema>;
export type ContractTask = z.infer<typeof contractTaskSchema>;

export const planRejectionSchema = z.object({ issues: z.array(planIssueSchema) });
export type PlanRejection = z.infer<typeof planRejectionSchema>;

export const changeRequestDecisionSchema = z.discriminatedUnion("status", [
  z.object({ status: z.literal("rejected"), reason: z.string() }),
  z.object({ status: z.literal("needs_confirmation"), blueprint: BlueprintSchema }),
  z.object({
    status: z.literal("approved"),
    blueprint: BlueprintSchema,
    affectedTaskIds: z.array(z.string()),
  }),
]);
export type ChangeRequestDecision = z.infer<typeof changeRequestDecisionSchema>;
