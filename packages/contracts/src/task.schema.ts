import z from "zod";

export const TaskType = z.enum([
  "scaffold",
  "schema",
  "auth",
  "payment",
  "migration",
  "api",
  "seed",
  "page",
  "component",
  "theme",
  "design-system",
  "app-shell",
  "typography",
  "layout",
  "responsive",
  "visual-verification",
]);
export type TaskType = z.infer<typeof TaskType>;

export const RiskTier = z.enum(["low", "medium", "high"]);
export type RiskTier = z.infer<typeof RiskTier>;

export const RISK_TIER_BY_TASK_TYPE: Record<TaskType, RiskTier> = {
  schema: "high",
  auth: "high",
  payment: "high",
  migration: "high",
  api: "medium",
  seed: "medium",
  page: "low",
  component: "low",
  theme: "low",
  scaffold: "low",
  "design-system": "low",
  "app-shell": "medium",
  typography: "low",
  layout: "low",
  responsive: "low",
  "visual-verification": "low",
};

export const Capability = z.enum([
  "strong_reasoning",
  "strong_coding",
  "fast_coding",
  "cheap",
]);
export type Capability = z.infer<typeof Capability>;

export const TaskStatus = z.enum([
  "pending",
  "ready",
  "running",
  "blocked",
  "failed",
  "done",
]);
export type TaskStatus = z.infer<typeof TaskStatus>;

export const OwnershipDeclarationSchema = z.string().min(1);

export const VerificationPolicySchema = z.object({
  tier: z.union([z.literal(1), z.literal(2), z.literal(3)]),
});
export type VerificationPolicy = z.infer<typeof VerificationPolicySchema>;

export const TaskSchema = z.object({
  id: z.string().min(1),
  blueprintId: z.string().min(1),
  type: TaskType,
  title: z.string().min(1),
  status: TaskStatus,
  dependsOn: z.array(z.string()).default([]),
  owns: z.array(OwnershipDeclarationSchema).min(1),
  reads: z.array(OwnershipDeclarationSchema).default([]),
  riskTier: RiskTier,
  capability: Capability,
  verification: VerificationPolicySchema,
});
export type Task = z.infer<typeof TaskSchema>;
