import { z } from "zod";

const CachedUsageSchema = z.object({
  prompt_cache_hit_tokens: z.number().int().nonnegative().optional(),
  prompt_tokens_details: z.object({ cached_tokens: z.number().int().nonnegative().optional() }).nullish(),
});

export function cachedPromptTokens(usage: unknown): number {
  const parsed = CachedUsageSchema.safeParse(usage);
  if (!parsed.success) return 0;
  return parsed.data.prompt_cache_hit_tokens ?? parsed.data.prompt_tokens_details?.cached_tokens ?? 0;
}
