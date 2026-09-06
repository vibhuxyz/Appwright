import z from "zod";

export const ProjectStatus = z.enum([
  "PROVISIONING",
  "BUILDING",
  "READY",
  "ERROR",
]);

export const CreateProjectRequest = z.object({
  name: z.string().min(1),
});

export const ProjectResponse = z.object({
  id: z.string(),
  name: z.string(),
  templateId: z.string(),
  status: ProjectStatus,
  previewUrl: z.string().nullable(),
  createdAt: z.string(),
});

export type CreateProjectRequest = z.infer<typeof CreateProjectRequest>;
export type ProjectResponse = z.infer<typeof ProjectResponse>;
