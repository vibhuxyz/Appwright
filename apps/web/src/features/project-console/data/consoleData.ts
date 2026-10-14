import type { LucideIcon } from "lucide-react";
import {
  CheckCircle2,
  Clock,
  Database,
  FileCode2,
  FileUp,
  UserPlus,
  Users,
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

export const RECENT_DEPLOYMENTS: DeploymentItem[] = [
  {
    id: "prod",
    env: "Production",
    time: "Deployed 2 hours ago",
    commit: "a1b2c3d",
    icon: CheckCircle2,
    iconColor: "text-emerald-400",
  },
  {
    id: "stage",
    env: "Staging",
    time: "Deployed 1 day ago",
    commit: "d4e5f6g",
    dotStyle: "border-2 border-sky-400 bg-sky-400/20",
  },
  {
    id: "dev",
    env: "Development",
    time: "Deployed 3 days ago",
    commit: "h7i8j9k",
    icon: Clock,
    iconColor: "text-muted",
  },
];

export const RECENT_ACTIVITY = [
  {
    id: "user-signup",
    title: "User signed up",
    desc: "john@example.com",
    time: "2m ago",
    icon: UserPlus,
    style: "bg-emerald-500/15 text-emerald-400",
  },
  {
    id: "db-record",
    title: "Database record created",
    desc: "users collection",
    time: "12m ago",
    icon: Database,
    style: "bg-sky-500/15 text-sky-400",
  },
  {
    id: "func-exec",
    title: "Function executed",
    desc: "send-welcome-email",
    time: "25m ago",
    icon: FileCode2,
    style: "bg-amber-500/15 text-amber-400",
  },
  {
    id: "file-upload",
    title: "File uploaded",
    desc: "avatar.png (124 KB)",
    time: "1h ago",
    icon: FileUp,
    style: "bg-purple-500/15 text-purple-400",
  },
] as const;

export const QUICK_ACTIONS = [
  {
    id: "create-db",
    title: "Create Database",
    desc: "Set up a new database",
    icon: Database,
    style: "bg-amber-500/15 text-amber-400",
  },
  {
    id: "add-auth",
    title: "Add Authentication",
    desc: "Enable login with email, OAuth, etc.",
    icon: Users,
    style: "bg-pink-500/15 text-pink-400",
  },
  {
    id: "create-func",
    title: "Create Function",
    desc: "Run backend serverless code",
    icon: FileCode2,
    style: "bg-purple-500/15 text-purple-400",
  },
  {
    id: "upload-file",
    title: "Upload File",
    desc: "Store files in storage bucket",
    icon: FileUp,
    style: "bg-sky-500/15 text-sky-400",
  },
] as const;
