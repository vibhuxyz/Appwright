import { AVAILABLE_MODELS, type AvailableModel } from "@repo/contracts";
import { z } from "zod";
import { type ListedModel, buildModelList } from "./model-listing";
import { ENDPOINTS, type ListAuth, type ProviderId } from "./openai";

const LIST_TIMEOUT_MS = 4_000;

const OpenAiListSchema = z.object({
  data: z.array(z.object({ id: z.string() })),
});

const GeminiListSchema = z.object({
  models: z.array(
    z.object({
      name: z.string(),
      displayName: z.string().optional(),
      supportedGenerationMethods: z.array(z.string()).optional(),
    }),
  ),
});

const AnthropicListSchema = z.object({
  data: z.array(
    z.object({
      id: z.string(),
      display_name: z.string().optional(),
    }),
  ),
});

export type FetchLike = (
  input: string | URL | Request,
  init?: RequestInit,
) => Promise<Response>;

export interface ListAvailableModelsOpts {
  env?: NodeJS.Dict<string>;
  fetch?: FetchLike;
}

function hasKey(env: NodeJS.Dict<string>, envKey: string): boolean {
  const value = env[envKey];
  return typeof value === "string" && value.length > 0;
}

function listHeaders(
  auth: ListAuth,
  apiKey: string,
  extra: Record<string, string> | undefined,
): Record<string, string> {
  if (auth === "x-api-key") {
    return { "x-api-key": apiKey, ...extra };
  }
  if (auth === "bearer") {
    return { Authorization: `Bearer ${apiKey}`, ...extra };
  }
  return { ...extra };
}

function listUrl(url: string, auth: ListAuth, apiKey: string): string {
  if (auth !== "query-key") return url;
  const parsed = new URL(url);
  parsed.searchParams.set("key", apiKey);
  return parsed.toString();
}

function isChatModel(provider: ProviderId, id: string): boolean {
  if (id.length === 0) return false;
  if (provider === "openai") {
    if (
      /audio|realtime|transcribe|tts|whisper|dall-e|embedding|moderation|babbage|davinci|image|search/.test(
        id,
      )
    ) {
      return false;
    }
    return /^(gpt-|o[1-9]|chatgpt-)/.test(id);
  }
  if (provider === "gemini") {
    return !/embedding|imagen|tts|aqa|image|veo|audio|live|robotics|computer-use|learnlm|gemma|transcribe|nano-banana|omni|customtools/.test(id);
  }
  if (provider === "anthropic") return id.startsWith("claude");
  if (provider === "xai") return id.startsWith("grok");
  if (provider === "groq") return !/whisper|guard|tts|playai|orpheus|safeguard/.test(id);
  return true;
}

function parseListed(provider: ProviderId, body: unknown): ListedModel[] {
  if (provider === "gemini") {
    const parsed = GeminiListSchema.safeParse(body);
    if (!parsed.success) return [];
    return parsed.data.models.flatMap((model) => {
      if (
        model.supportedGenerationMethods &&
        !model.supportedGenerationMethods.includes("generateContent")
      ) {
        return [];
      }
      const id = model.name.replace(/^models\//, "");
      return [{ id, name: model.displayName }];
    });
  }
  if (provider === "anthropic") {
    const parsed = AnthropicListSchema.safeParse(body);
    if (!parsed.success) return [];
    return parsed.data.data.map((model) => ({
      id: model.id,
      name: model.display_name,
    }));
  }
  const parsed = OpenAiListSchema.safeParse(body);
  if (!parsed.success) return [];
  return parsed.data.data.map((model) => ({ id: model.id }));
}

async function fetchProviderModels(
  provider: ProviderId,
  env: NodeJS.Dict<string>,
  fetchImpl: FetchLike,
): Promise<ListedModel[]> {
  const endpoint = ENDPOINTS[provider];
  const apiKey = env[endpoint.envKey];
  if (!apiKey) return [];

  const res = await fetchImpl(listUrl(endpoint.listUrl, endpoint.listAuth, apiKey), {
    method: "GET",
    headers: listHeaders(endpoint.listAuth, apiKey, endpoint.headers),
    signal: AbortSignal.timeout(LIST_TIMEOUT_MS),
  });
  if (!res.ok) return [];
  const body: unknown = await res.json().catch(() => null);
  return parseListed(provider, body).filter((model) =>
    isChatModel(provider, model.id),
  );
}

export async function listAvailableModels(
  opts: ListAvailableModelsOpts = {},
): Promise<AvailableModel[]> {
  const env = opts.env ?? process.env;
  const fetchImpl = opts.fetch ?? fetch;
  const providers = (
    Object.keys(ENDPOINTS) as ProviderId[]
  ).filter((provider) => hasKey(env, ENDPOINTS[provider].envKey));

  const listings = await Promise.all(
    providers.map(async (provider) => {
      try {
        return { provider, models: await fetchProviderModels(provider, env, fetchImpl) };
      } catch {
        return { provider, models: [] as ListedModel[] };
      }
    }),
  );
  return buildModelList(AVAILABLE_MODELS, listings);
}
