import z from "zod";

export const ProjectStatus = z.enum([
  "PROVISIONING",
  "BUILDING",
  "READY",
  "ERROR",
]);
export const CreateProjectRequest = z.object({
  prompt: z.string().min(1),
});

export const CreateProjectResponse = z.object({
  projectId: z.string(),
  status: ProjectStatus,
});

export type CreateProjectRequest = z.infer<typeof CreateProjectRequest>;
export type CreateProjectResponse = z.infer<typeof CreateProjectResponse>;
