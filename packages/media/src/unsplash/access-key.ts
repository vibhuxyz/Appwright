import z from "zod";

const EnvSchema = z.object({
  UNSPLASH_ACCESS_KEY: z.string().trim().min(1).optional(),
});

export function readUnsplashAccessKey(env: Readonly<Record<string, string | undefined>>): string | undefined {
  const parsed = EnvSchema.safeParse({ UNSPLASH_ACCESS_KEY: env.UNSPLASH_ACCESS_KEY || undefined });
  return parsed.success ? parsed.data.UNSPLASH_ACCESS_KEY : undefined;
}
