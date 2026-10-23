import z from "zod";

export const BrowserWatchAction = z.enum(["open", "scroll", "click", "type", "submit"]);
export type BrowserWatchAction = z.infer<typeof BrowserWatchAction>;

export const BrowserWatchStep = z.object({
  action: BrowserWatchAction,
  label: z.string().max(160),
  route: z.string().max(200),
  viewport: z.enum(["mobile", "tablet", "desktop"]),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  point: z.object({ x: z.number(), y: z.number() }).nullable(),
  frame: z.string().min(1),
});
export type BrowserWatchStep = z.infer<typeof BrowserWatchStep>;

export const BrowserWatchEvent = z.discriminatedUnion("phase", [
  z.object({ phase: z.literal("step"), step: BrowserWatchStep }),
  z.object({ phase: z.literal("end") }),
]);
export type BrowserWatchEvent = z.infer<typeof BrowserWatchEvent>;
