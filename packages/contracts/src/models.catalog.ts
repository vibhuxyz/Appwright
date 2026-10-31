import type { AvailableModel, ModelCategory } from "./session.schema";

export const AUTO_MODEL_ID = "auto";

export const AUTO_MODEL: AvailableModel = {
  id: AUTO_MODEL_ID,
  name: "Auto",
  provider: "Appwright",
  description: "Always selects the best model",
};

export function isAutoModel(id: string): boolean {
  return id === AUTO_MODEL_ID;
}

export const MODEL_CATEGORIES = ["frontier", "standard", "efficient"] as const;
export const MODEL_CATEGORY_LABEL: Record<ModelCategory, string> = {
  efficient: "Efficient",
  standard: "Standard",
  frontier: "Frontier",
};

function hasToken(id: string, token: string): boolean {
  const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`).test(id);
}

export function inferModelCategory(id: string): ModelCategory {
  const n = id.toLowerCase();
  if (
    hasToken(n, "flash") ||
    hasToken(n, "mini") ||
    hasToken(n, "haiku") ||
    hasToken(n, "instant") ||
    hasToken(n, "8b") ||
    hasToken(n, "20b")
  ) {
    return "efficient";
  }
  if (
    hasToken(n, "opus") ||
    hasToken(n, "reasoner") ||
    hasToken(n, "grok") ||
    hasToken(n, "120b") ||
    hasToken(n, "gpt-5.4")
  ) {
    return "frontier";
  }
  return "standard";
}

export function modelCategory(model: Pick<AvailableModel, "id" | "category">): ModelCategory {
  return model.category ?? inferModelCategory(model.id);
}

export function modelsForCategory(
  models: readonly AvailableModel[],
  category: ModelCategory,
): AvailableModel[] {
  return models.filter((model) => modelCategory(model) === category);
}

// Curated picker list. GET /models starts from this and overlays live ids
// from each provider that has an API key. Keep display copy here so the
// web fallback and the API cannot drift.
export const AVAILABLE_MODELS: readonly AvailableModel[] = [
  {
    id: "gemini-3.7-flash",
    name: "Gemini 3.7 Flash",
    provider: "Google",
    description: "Hybrid reasoning & ultra-fast generation",
    category: "efficient",
    badge: "Recommended",
    isDefault: true,
  },
  {
    id: "gemini-3.1-pro-preview",
    name: "Gemini 3.1 Pro",
    provider: "Google",
    description: "Advanced reasoning for complex codebase tasks",
    category: "standard",
  },
  {
    id: "gpt-5.4",
    name: "GPT-5.4",
    provider: "OpenAI",
    description: "Flagship frontier intelligence for deep challenges",
    category: "frontier",
    badge: "Usage credits",
  },
  {
    id: "gpt-5.4-mini",
    name: "GPT-5.4 Mini",
    provider: "OpenAI",
    description: "Fast, cost-efficient model for everyday coding",
    category: "efficient",
  },
  {
    id: "gpt-5.2-codex",
    name: "GPT-5.2 Codex",
    provider: "OpenAI",
    description: "High-precision code synthesis & refactoring",
    category: "standard",
  },
  {
    id: "gpt-4o-mini",
    name: "GPT-4o Mini",
    provider: "OpenAI",
    description: "Lightweight fast completions",
    category: "efficient",
  },
  {
    id: "claude-sonnet-5-5",
    name: "Claude Sonnet 5.5",
    provider: "Anthropic",
    description: "Strong coding and agentic workflows",
    category: "standard",
  },
  {
    id: "claude-opus-5-5",
    name: "Claude Opus 5.5",
    provider: "Anthropic",
    description: "Highest-capability Claude for hard reasoning",
    category: "frontier",
  },
  {
    id: "claude-haiku-5-5",
    name: "Claude Haiku 5.5",
    provider: "Anthropic",
    description: "Fast, cheap Claude for everyday edits",
    category: "efficient",
  },
  {
    id: "deepseek-flash",
    name: "DeepSeek Flash",
    provider: "DeepSeek",
    description: "Fast V4-class general-purpose model",
    category: "efficient",
  },
  {
    id: "deepseek-chat",
    name: "DeepSeek Chat",
    provider: "DeepSeek",
    description: "Cost-efficient general-purpose model",
    category: "standard",
  },
  {
    id: "deepseek-reasoner",
    name: "DeepSeek Reasoner",
    provider: "DeepSeek",
    description: "Chain-of-thought reasoning for complex problems",
    category: "frontier",
  },
  {
    id: "llama-3.3-70b-versatile",
    name: "Llama 3.3 70B",
    provider: "Groq",
    description: "High-throughput open-weights model via Groq",
    category: "standard",
  },
  {
    id: "llama-3.1-8b-instant",
    name: "Llama 3.1 8B",
    provider: "Groq",
    description: "Sub-second instant generation for quick edits",
    category: "efficient",
  },
  {
    id: "openai/gpt-oss-120b",
    name: "GPT-OSS 120B",
    provider: "Groq",
    description: "Massive open-source intelligence hosted on Groq",
    category: "frontier",
  },
  {
    id: "openai/gpt-oss-20b",
    name: "GPT-OSS 20B",
    provider: "Groq",
    description: "Fast lightweight open model",
    category: "efficient",
  },
  {
    id: "qwen/qwen3.6-27b",
    name: "Qwen 3.6 27B",
    provider: "Groq",
    description: "Leading multi-lingual and coding open model",
    category: "standard",
  },
  {
    id: "grok-beta",
    name: "Grok Beta",
    provider: "xAI",
    description: "Real-time frontier intelligence by xAI",
    category: "frontier",
  },
];
