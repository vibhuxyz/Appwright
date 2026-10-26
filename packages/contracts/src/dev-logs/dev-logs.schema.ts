import { z } from "zod";

export const DEV_LOG_STREAMS = ["stdout", "stderr", "system"] as const;
export const DEV_LOG_LIMITS = { maxLines: 2000, maxLineChars: 2000, pageLines: 500 } as const;

export const DevLogLineSchema = z.object({
  seq: z.number().int().nonnegative(),
  stream: z.enum(DEV_LOG_STREAMS),
  text: z.string(),
  at: z.string(),
});

export const DevLogsResponse = z.object({
  lines: z.array(DevLogLineSchema),
  nextSeq: z.number().int().nonnegative(),
  isRunning: z.boolean(),
});

export type DevLogLine = z.infer<typeof DevLogLineSchema>;
export type DevLogsResponse = z.infer<typeof DevLogsResponse>;
