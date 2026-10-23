import z from "zod";

export const ProjectType = z.enum([
  "business-site",
  "marketplace",
  "portfolio",
  "saas",
  "wallet",
  "other",
]);
export type ProjectType = z.infer<typeof ProjectType>;

export const RequirementArea = z.enum([
  "admin",
  "media",
  "seo",
  "security",
  "testing",
  "deploy",
]);
export type RequirementArea = z.infer<typeof RequirementArea>;

export const RequirementLevel = z.enum(["required", "conditional", "not-applicable"]);
export type RequirementLevel = z.infer<typeof RequirementLevel>;

export const RequirementSchema = z.object({
  id: z.string().min(1),
  area: RequirementArea,
  level: RequirementLevel,
  reason: z.string().min(1),
  acceptance: z.array(z.string().min(1)).default([]),
});
export type Requirement = z.infer<typeof RequirementSchema>;
