import { z } from "zod";

export const fileListSchema = z.object({ paths: z.array(z.string()) });

export const fileContentSchema = z.object({
  path: z.string(),
  content: z.string(),
});
