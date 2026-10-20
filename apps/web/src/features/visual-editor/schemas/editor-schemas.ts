import { z } from "zod";
import { PlanContractSchema } from "../api/plan-contract";

export const BREAKPOINTS = ["desktop", "tablet", "mobile"] as const;
export const breakpointSchema = z.enum(BREAKPOINTS);
export type Breakpoint = z.infer<typeof breakpointSchema>;

export const componentNodeSchema = z.object({
  id: z.string().min(1),
  parentId: z.string().nullable(),
  route: z.string(),
  sourceFile: z.string(),
  blueprintVersion: z.number().int(),
});
export type ComponentNode = z.infer<typeof componentNodeSchema>;

export const componentGraphSchema = z.object({ components: z.array(componentNodeSchema) });

export const frameSelectionSchema = z.object({
  type: z.literal("aw:select"),
  awId: z.string().min(1),
  rect: z.object({ x: z.number(), y: z.number(), width: z.number(), height: z.number() }),
  computed: z.record(z.string(), z.string()),
});
export type FrameSelection = z.infer<typeof frameSelectionSchema>;

export const designChangeSchema = z.object({
  componentId: z.string().min(1),
  property: z.string().min(1),
  from: z.string(),
  to: z.string(),
  breakpoint: breakpointSchema,
});
export type DesignChange = z.infer<typeof designChangeSchema>;

export const changeSetInputSchema = z.object({
  changes: z.array(designChangeSchema),
  intents: z.array(z.object({ componentId: z.string().min(1), prompt: z.string().min(1) })),
});
export type ChangeSetInput = z.infer<typeof changeSetInputSchema>;

export const changeSetIssueSchema = z.object({
  code: z.string(),
  message: z.string(),
  componentId: z.string().optional(),
});
export type ChangeSetIssue = z.infer<typeof changeSetIssueSchema>;

export const compileResultSchema = z.discriminatedUnion("status", [
  z.object({
    status: z.literal("ready"),
    plan: PlanContractSchema,
    exactCount: z.number().int(),
    intentCount: z.number().int(),
    affectedFiles: z.array(z.string()),
  }),
  z.object({ status: z.literal("rejected"), issues: z.array(changeSetIssueSchema) }),
]);
export type CompileResult = z.infer<typeof compileResultSchema>;

export const verificationCheckSchema = z.object({
  componentId: z.string(),
  property: z.string(),
  asked: z.string(),
  rendered: z.string(),
  passed: z.boolean(),
});
export type VerificationCheck = z.infer<typeof verificationCheckSchema>;

export const submitResultSchema = z.object({
  runId: z.string(),
  status: z.enum(["applied", "failed"]),
  llmTokens: z.number().int().nonnegative(),
  checks: z.array(verificationCheckSchema),
  error: z.string().nullable().optional(),
});
export type SubmitResult = z.infer<typeof submitResultSchema>;
