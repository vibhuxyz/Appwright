import z from "zod";

// D30: owns/reads are the graph. D31: capability, never a model name.
// D32: riskTier, derived from type. Both ship in the schema from the first
// version with a Task table, even unused — adding them later migrates
// every persisted task.

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
]);
export type TaskType = z.infer<typeof TaskType>;

export const RiskTier = z.enum(["low", "medium", "high"]);
export type RiskTier = z.infer<typeof RiskTier>;

// D32: a lookup table, not a model scoring itself. The planner may only
// override upward from this.
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

// D37: file globs and non-file resources share one declaration list.
// `db:app`, `port:3000`, `prisma:app.prisma`, `env:STRIPE_KEY` alongside
// `src/checkout/**`. Canonicalisation and overlap live in packages/planner
// — this schema only records the raw declaration.
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
