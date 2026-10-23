import type { LucideIcon } from "lucide-react";
import {
  Code2,
  Database,
  ExternalLink,
  Rocket,
} from "lucide-react";

export interface DeploymentItem {
  id: string;
  env: string;
  time: string;
  commit: string;
  icon?: LucideIcon;
  iconColor?: string;
  dotStyle?: string;
}

export interface QuickActionItem {
  id: string;
  title: string;
  desc: string;
  icon: LucideIcon;
  style: string;
  action: "editor" | "deploy" | "database" | "preview";
}

export const CONSOLE_QUICK_ACTIONS: readonly QuickActionItem[] = [
  {
    id: "resume-building",
    title: "Resume Building",
    desc: "Open editor and build with AI agent",
    icon: Code2,
    style: "bg-lime/15 text-lime",
    action: "editor",
  },
  {
    id: "deploy-vercel",
    title: "Deploy to Vercel",
    desc: "Ship production app to Vercel",
    icon: Rocket,
    style: "bg-emerald-500/15 text-emerald-400",
    action: "deploy",
  },
  {
    id: "manage-db",
    title: "Project Database",
    desc: "Inspect MongoDB connection & status",
    icon: Database,
    style: "bg-amber-500/15 text-amber-400",
    action: "database",
  },
  {
    id: "open-preview",
    title: "Open Live Preview",
    desc: "Launch running preview in browser tab",
    icon: ExternalLink,
    style: "bg-sky-500/15 text-sky-400",
    action: "preview",
  },
] as const;
