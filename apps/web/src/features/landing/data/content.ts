import type { NavLink, QuickPrompt, ShowcaseItem } from "../types";

export const NAV_LINKS: NavLink[] = [
  { label: "Product", href: "#how" },
  { label: "Platform", href: "#platform" },
  { label: "Templates", href: "#templates" },
  { label: "Workspace", href: "#workspace" },
  { label: "Pricing", href: "#pricing" },
  { label: "Agents", href: "#platform", badge: { label: "NEW", tone: "accent" } },
  { label: "Deploy", href: "#platform", badge: { label: "BETA", tone: "neutral" } },
];

export const DEFAULT_PROMPT =
  "Build me an ecommerce app with login, products, cart, Stripe payments, admin dashboard and deployment.";

export const QUICK_PROMPTS: QuickPrompt[] = [
  {
    label: "Ecommerce + Stripe",
    prompt: DEFAULT_PROMPT,
  },
  {
    label: "Internal CRM",
    prompt:
      "Build an internal CRM with contacts, deal pipeline, team roles, activity log and CSV import.",
  },
  {
    label: "AI support desk",
    prompt:
      "Build an AI support desk with ticket inbox, knowledge base retrieval, escalation rules and analytics.",
  },
  {
    label: "Marketplace with payouts",
    prompt:
      "Build a two-sided marketplace with seller onboarding, listings, escrow checkout and Stripe Connect payouts.",
  },
];

export const STACK_BADGES = ["Next.js", "Postgres", "Stripe"] as const;

export const SHOWCASE_ITEMS: ShowcaseItem[] = [
  {
    id: "aw-showcase-hero",
    name: "Appwright agent run",
    copy: "One prompt to a deployed ecommerce app in 4m 12s.",
    kind: "FULL RUN",
    tint: "text-lime",
    placeholder: "Agent build run",
  },
  {
    id: "aw-showcase-1",
    name: "Loopkit CRM",
    copy: "Internal CRM with pipeline, roles and CSV import.",
    kind: "VIDEO",
    tint: "text-lime",
    placeholder: "CRM app demo",
  },
  {
    id: "aw-showcase-2",
    name: "Helpline AI",
    copy: "Support desk with retrieval and escalation rules.",
    kind: "VIDEO",
    tint: "text-blue-bright",
    placeholder: "Support desk app demo",
  },
  {
    id: "aw-showcase-3",
    name: "Sidecar Market",
    copy: "Two-sided marketplace with Stripe Connect payouts.",
    kind: "LIVE",
    tint: "text-pink-light",
    placeholder: "Marketplace app demo",
  },
  {
    id: "aw-showcase-4",
    name: "Nimbus Analytics",
    copy: "Realtime dashboard built and deployed in one run.",
    kind: "LIVE",
    tint: "text-blue",
    placeholder: "Analytics dashboard demo",
  },
];
