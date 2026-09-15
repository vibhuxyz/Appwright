import { z } from "zod";

// `url` is this one build, frozen forever. `aliasUrl` is the project's
// production address and only points here once readyState is READY.
export const deploymentSchema = z.object({
  id: z.string(),
  url: z.string(),
  aliasUrl: z.string().nullable(),
  readyState: z.string(),
  errorMessage: z.string().nullable().optional(),
});
export type Deployment = z.infer<typeof deploymentSchema>;

export const vercelStatusSchema = z.object({
  connected: z.boolean(),
  teamId: z.string().nullable(),
  connectedAt: z.string().nullable(),
});
export type VercelStatus = z.infer<typeof vercelStatusSchema>;

export const TERMINAL_DEPLOYMENT_STATES = new Set([
  "READY",
  "ERROR",
  "CANCELED",
]);
