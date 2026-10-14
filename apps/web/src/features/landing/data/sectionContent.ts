import type { DeployCheck, ModelCard, PlatformFeature, TemplateCard } from "../types";

export const MODELS: ModelCard[] = [
  {
    name: "Claude Opus 4.6",
    copy: "Plans architecture and writes production code.",
    task: "Build",
    pill: "TOP",
    pillTone: "premium",
    glyph: "✳",
    tint: "text-lime",
  },
  {
    name: "GPT-6 Astra",
    copy: "Long-horizon agent runs with tool use.",
    task: "Agent",
    pill: "NEW",
    pillTone: "accent",
    glyph: "◎",
    tint: "text-blue-bright",
  },
  {
    name: "Gemini 3.7 Flash",
    copy: "Fast edits, refactors and test fixes.",
    task: "Fast",
    pill: "CHEAP",
    pillTone: "neutral",
    glyph: "⚡",
    tint: "text-blue",
  },
  {
    name: "Appwright Schema",
    copy: "Data modelling, migrations and policies.",
    task: "Database",
    pill: "NATIVE",
    pillTone: "neutral",
    glyph: "▤",
    tint: "text-lime",
  },
  {
    name: "Appwright Vision",
    copy: "Turns screenshots and Figma frames into UI.",
    task: "Design",
    pill: "BETA",
    pillTone: "neutral",
    glyph: "◳",
    tint: "text-pink-light",
  },
  {
    name: "Sentinel QA",
    copy: "Writes tests, reads traces, repairs failures.",
    task: "Testing",
    pill: "AUTO",
    pillTone: "neutral",
    glyph: "✓",
    tint: "text-blue-bright",
  },
];

export const PLATFORM_FEATURES: PlatformFeature[] = [
  {
    tag: "AUTH",
    name: "Authentication",
    copy: "Email, OAuth, magic links and role-based access generated with your data model.",
    meta: "sessions · MFA · SSO",
  },
  {
    tag: "DATA",
    name: "Databases",
    copy: "Postgres with migrations the agent writes, reviews and rolls back safely.",
    meta: "schema · migrations",
  },
  {
    tag: "FILES",
    name: "Storage",
    copy: "Signed uploads, image transforms and CDN delivery wired into your forms.",
    meta: "S3-compatible",
  },
  {
    tag: "COMPUTE",
    name: "Functions",
    copy: "Server actions, cron jobs and webhooks deployed with the app.",
    meta: "edge + node",
  },
  {
    tag: "SOCKETS",
    name: "Realtime",
    copy: "Presence, live queries and notifications without extra plumbing.",
    meta: "websockets",
  },
  {
    tag: "OPS",
    name: "Observability",
    copy: "Logs, traces, error grouping and usage in the same workspace you build in.",
    meta: "alerts · uptime",
  },
];

export const TEMPLATES: TemplateCard[] = [
  {
    name: "SaaS Starter",
    copy: "Auth, billing, teams and a dashboard shell.",
    stack: "Next.js · Stripe",
    chrome: "Analytics",
    stat: "+34%",
    accent: "#e3fc18",
    wash: "rgba(227,252,24,.08)",
  },
  {
    name: "AI Chat App",
    copy: "Streaming chat with accounts and usage tracking.",
    stack: "Next.js · OpenAI",
    chrome: "Assistant",
    stat: "live",
    accent: "#4aa8ff",
    wash: "rgba(74,168,255,.10)",
  },
  {
    name: "Ecommerce Store",
    copy: "Catalog, cart, payments and admin panel.",
    stack: "Next.js · Stripe",
    chrome: "Store",
    stat: "$120",
    accent: "#f80058",
    wash: "rgba(248,0,88,.10)",
  },
  {
    name: "Blog / CMS",
    copy: "MDX content model with SEO defaults.",
    stack: "Next.js · MDX",
    chrome: "Editorial",
    stat: "12 posts",
    accent: "#3b8fac",
    wash: "rgba(59,143,172,.10)",
  },
  {
    name: "Project Management",
    copy: "Boards, sprints and realtime updates.",
    stack: "Next.js · Realtime",
    chrome: "Sprint Board",
    stat: "8 open",
    accent: "#f43abc",
    wash: "rgba(244,58,188,.10)",
  },
];

export const DEPLOY_CHECKS: DeployCheck[] = [
  { label: "auth/login flow", time: "0.9s" },
  { label: "cart → checkout session", time: "1.4s" },
  { label: "stripe webhook · order.paid", time: "0.6s" },
  { label: "admin dashboard access control", time: "1.1s" },
];

export const WORKSPACE_STATS = [
  { value: "99.98%", label: "API uptime", accent: false },
  { value: "4m 12s", label: "First deploy", accent: true },
  { value: "1,204", label: "Functions/day", accent: false },
] as const;

export const PRICING_MONTHLY = { pro: "$29", max: "$99" } as const;
export const PRICING_YEARLY = { pro: "$23", max: "$79" } as const;
