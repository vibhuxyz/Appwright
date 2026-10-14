import {
  Plus,
  LayoutDashboard,
  Bot,
  ShoppingBag,
  BookOpen,
  Kanban,
} from "lucide-react";

export const SUGGESTED_TEMPLATES = [
  {
    id: "blank",
    name: "Blank Project",
    framework: "vite-react" as const,
    desc: "Vite SPA",
    Icon: Plus,
    iconStyle: "border-slate-700/60 bg-slate-800/80 text-slate-300",
  },
  {
    id: "saas",
    name: "SaaS Starter",
    framework: "nextjs-fullstack" as const,
    desc: "Next.js & DB",
    Icon: LayoutDashboard,
    iconStyle: "border-emerald-500/30 bg-emerald-500/15 text-emerald-400",
  },
  {
    id: "ai-chat",
    name: "AI Chat App",
    framework: "nextjs-fullstack" as const,
    desc: "AI Streaming",
    Icon: Bot,
    iconStyle: "border-blue-500/30 bg-blue-500/15 text-blue-400",
  },
  {
    id: "ecommerce",
    name: "Ecommerce",
    framework: "nextjs-fullstack" as const,
    desc: "Store & Stripe",
    Icon: ShoppingBag,
    iconStyle: "border-amber-500/30 bg-amber-500/15 text-amber-400",
  },
  {
    id: "blog-cms",
    name: "Blog / CMS",
    framework: "nextjs-fullstack" as const,
    desc: "MDX & Content",
    Icon: BookOpen,
    iconStyle: "border-purple-500/30 bg-purple-500/15 text-purple-400",
  },
  {
    id: "pm",
    name: "Project Mgmt",
    framework: "nextjs-fullstack" as const,
    desc: "Sprint Kanban",
    Icon: Kanban,
    iconStyle: "border-rose-500/30 bg-rose-500/15 text-rose-400",
  },
];

export type StarterTemplate = (typeof SUGGESTED_TEMPLATES)[number];
