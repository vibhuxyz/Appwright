import {
  AvailableModelSchema,
  MODEL_CATEGORIES,
  inferModelCategory,
  modelCategory,
  type AvailableModel,
} from "@repo/contracts";
import { type ProviderId, providerFor } from "./openai";

export interface ListedModel {
  id: string;
  name?: string;
}

export interface ProviderListing {
  provider: ProviderId;
  models: readonly ListedModel[];
}

const PROVIDER_LABEL: Record<ProviderId, string> = {
  openai: "OpenAI",
  groq: "Groq",
  xai: "xAI",
  gemini: "Google",
  deepseek: "DeepSeek",
  anthropic: "Anthropic",
};

export function titleFromId(id: string): string {
  return id
    .replace(/^models\//, "")
    .replace(/[/]/g, " ")
    .split(/[-_]/)
    .filter((part) => part.length > 0)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function liveRow(provider: ProviderId, listed: ListedModel): AvailableModel {
  return AvailableModelSchema.parse({
    id: listed.id,
    name: listed.name && listed.name.length > 0 ? listed.name : titleFromId(listed.id),
    provider: PROVIDER_LABEL[provider],
    description: `Available from ${PROVIDER_LABEL[provider]}`,
    category: inferModelCategory(listed.id),
  });
}

function providerRows(
  listing: ProviderListing,
  catalogById: ReadonlyMap<string, AvailableModel>,
  catalog: readonly AvailableModel[],
): AvailableModel[] {
  if (listing.models.length === 0) {
    return catalog.filter((model) => providerFor(model.id) === listing.provider);
  }
  return listing.models
    .filter((model) => providerFor(model.id) === listing.provider)
    .map((model) => catalogById.get(model.id) ?? liveRow(listing.provider, model));
}

function categoryRank(model: AvailableModel): number {
  return MODEL_CATEGORIES.indexOf(modelCategory(model));
}

function compareModels(a: AvailableModel, b: AvailableModel): number {
  return (
    a.provider.localeCompare(b.provider) ||
    categoryRank(a) - categoryRank(b) ||
    a.id.localeCompare(b.id)
  );
}

export function buildModelList(
  catalog: readonly AvailableModel[],
  listings: readonly ProviderListing[],
): AvailableModel[] {
  const catalogById = new Map(catalog.map((model) => [model.id, model]));
  const unique = new Map<string, AvailableModel>();
  for (const listing of listings) {
    for (const row of providerRows(listing, catalogById, catalog)) {
      if (!unique.has(row.id)) unique.set(row.id, row);
    }
  }
  return [...unique.values()].sort(compareModels);
}
