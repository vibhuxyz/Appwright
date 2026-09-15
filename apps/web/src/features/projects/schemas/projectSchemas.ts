import { z } from "zod";

export const projectStatusSchema = z.enum([
  "PROVISIONING",
  "BUILDING",
  "READY",
  "ERROR",
]);

export const projectSchema = z.object({
  id: z.string(),
  name: z.string(),
  templateId: z.string(),
  status: projectStatusSchema,
  previewUrl: z.string().nullable(),
  createdAt: z.string(),
});
export type Project = z.infer<typeof projectSchema>;

export const createProjectFormSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  templateId: z.enum(["vite-react", "nextjs-fullstack"]),
});
export type CreateProjectForm = z.infer<typeof createProjectFormSchema>;
