import { useState } from "react";
import { ChevronDown, ExternalLink, Link2, Rocket, LayoutDashboard } from "lucide-react";
import type { Project } from "@/features/projects/schemas/projectSchemas";
import type { Session } from "@/features/agent/schemas/agentSchemas";
import { DeployButton } from "@/features/deployments/components/DeployButton";
import { AppHeader } from "@/app/layouts/AppHeader";
import { PermissionModeSelect } from "./PermissionModeSelect";
import { SessionSwitcher } from "./SessionSwitcher";

const STATUS: Record<Project["status"], { label: string; dot: string; text: string }> = {
  READY: { label: "Production", dot: "bg-success", text: "text-success" },
  BUILDING: { label: "Building", dot: "animate-pulse bg-warning", text: "text-warning" },
  PROVISIONING: {
    label: "Provisioning",
    dot: "animate-pulse bg-blue-bright",
    text: "text-blue-bright",
  },
  ERROR: { label: "Error", dot: "bg-danger", text: "text-danger" },
};

function host(url: string) {
  return url.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

function ProjectChip({
  project,
  projectId,
  session,
  onOpenConsole,
}: {
  project: Project | undefined;
  projectId: string;
  session: Session | undefined;
  onOpenConsole?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const name = project?.name ?? projectId;
  const status = project ? STATUS[project.status] : undefined;
  const url = project?.previewUrl;

  return (
    <div className="relative flex min-w-0 items-center gap-2 rounded-full border border-border-soft bg-surface p-1">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex min-w-0 cursor-pointer items-center gap-2 rounded-full py-0.5 pr-2 pl-0.5"
      >
        <span className="grid size-7 shrink-0 place-items-center rounded-full bg-linear-to-br from-pink-light to-pink text-xs font-semibold text-white">
          {name.charAt(0).toLowerCase()}
        </span>
        <span className="max-w-45 truncate text-sm text-foreground">{name}</span>
        <ChevronDown className="size-4 shrink-0 text-muted" />
      </button>

      {status && (
        <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-surface-2 px-2.5 py-1 text-[11px] font-medium">
          <span className={`size-1.5 rounded-full ${status.dot}`} />
          <span className={status.text}>{status.label}</span>
        </span>
      )}

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 z-20 mt-2 w-72 rounded-xl border border-border bg-surface p-1.5 shadow-2xl shadow-black/60">
            <div className="truncate px-2.5 py-2 text-xs text-muted">
              {url ? host(url) : "preview starting…"}
            </div>
            {onOpenConsole && (
              <button
                type="button"
                onClick={() => {
                  onOpenConsole();
                  setOpen(false);
                }}
                className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-foreground-secondary transition-colors hover:bg-surface-3 hover:text-foreground"
              >
                <LayoutDashboard className="size-4" /> Project Console
              </button>
            )}
            <a
              href={url ?? undefined}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-foreground-secondary transition-colors hover:bg-surface-3 hover:text-foreground ${
                url ? "" : "pointer-events-none opacity-40"
              }`}
            >
              <ExternalLink className="size-4" /> Open preview
            </a>
            <button
              type="button"
              disabled={!url}
              onClick={() => {
                if (url) void navigator.clipboard.writeText(url);
                setOpen(false);
              }}
              className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-foreground-secondary transition-colors hover:bg-surface-3 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Link2 className="size-4" /> Copy share link
            </button>
            {session && (
              <PermissionModeSelect projectId={projectId} session={session} />
            )}
            <SessionSwitcher projectId={projectId} activeSessionId={session?.id} />
            {session && (
              <div className="border-t border-border-soft px-2.5 pt-2 pb-1 text-[11px] text-muted">
                ${session.cost.toFixed(4)} · {session.tokenIn}↑ {session.tokenOut}↓ this session
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export function ProjectHeader({
  projectId,
  project,
  session,
  onAddCredits,
  onUpgrade,
  onOpenConsole,
}: {
  projectId: string;
  project: Project | undefined;
  session?: Session | undefined;
  onAddCredits?: () => void;
  onUpgrade?: () => void;
  onOpenConsole?: () => void;
}) {
  return (
    <AppHeader
      session={session}
      onAddCredits={onAddCredits}
      onUpgrade={onUpgrade}
      project={
        <ProjectChip
          project={project}
          projectId={projectId}
          session={session}
          onOpenConsole={onOpenConsole}
        />
      }
      actions={<DeployButton projectId={projectId} icon={<Rocket className="size-4 text-lime" />} />}
    />
  );
}
