import { useQuery } from "@tanstack/react-query";
import { agentApi } from "../api/agentApi";
import type { AvailableModel } from "../schemas/agentSchemas";

export const FALLBACK_MODELS: AvailableModel[] = [
  {
    id: "gemini-3.7-flash",
    name: "Gemini 3.7 Flash",
    provider: "Google",
    description: "Hybrid reasoning & ultra-fast generation",
    badge: "Recommended",
    isDefault: true,
  },
  {
    id: "gemini-3.1-pro-preview",
    name: "Gemini 3.1 Pro",
    provider: "Google",
    description: "Advanced reasoning for complex codebase tasks",
  },
  {
    id: "gpt-5.4",
    name: "GPT-5.4",
    provider: "OpenAI",
    description: "Flagship frontier intelligence for deep challenges",
    badge: "Usage credits",
  },
  {
    id: "gpt-5.4-mini",
    name: "GPT-5.4 Mini",
    provider: "OpenAI",
    description: "Fast, cost-efficient model for everyday coding",
  },
  {
    id: "gpt-5.2-codex",
    name: "GPT-5.2 Codex",
    provider: "OpenAI",
    description: "High-precision code synthesis & refactoring",
  },
  {
    id: "gpt-4o-mini",
    name: "GPT-4o Mini",
    provider: "OpenAI",
    description: "Lightweight fast completions",
  },
  {
    id: "llama-3.3-70b-versatile",
    name: "Llama 3.3 70B",
    provider: "Groq",
    description: "High-throughput open-weights model via Groq",
  },
  {
    id: "llama-3.1-8b-instant",
    name: "Llama 3.1 8B",
    provider: "Groq",
    description: "Sub-second instant generation for quick edits",
  },
  {
    id: "openai/gpt-oss-120b",
    name: "GPT-OSS 120B",
    provider: "Groq",
    description: "Massive open-source intelligence hosted on Groq",
  },
  {
    id: "openai/gpt-oss-20b",
    name: "GPT-OSS 20B",
    provider: "Groq",
    description: "Fast lightweight open model",
  },
  {
    id: "qwen/qwen3.6-27b",
    name: "Qwen 3.6 27B",
    provider: "Groq",
    description: "Leading multi-lingual and coding open model",
  },
  {
    id: "grok-beta",
    name: "Grok Beta",
    provider: "xAI",
    description: "Real-time frontier intelligence by xAI",
  },
];

export function useAvailableModels() {
  return useQuery({
    queryKey: ["available-models"],
    queryFn: () => agentApi.getAvailableModels(),
    staleTime: 1000 * 60 * 10,
    placeholderData: FALLBACK_MODELS,
  });
}
