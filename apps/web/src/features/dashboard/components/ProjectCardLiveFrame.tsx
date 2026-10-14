import { CheckSquare, Play, Sparkles, MessageSquare, Video } from "lucide-react";
import type { Project } from "@/features/projects/schemas/projectSchemas";

function MockupContent({ name }: { name: string }) {
  const lower = name.toLowerCase();

  if (lower.includes("video")) {
    return (
      <div className="flex flex-col gap-2 p-3">
        <div className="flex h-20 w-full flex-col items-center justify-center rounded-lg bg-linear-to-br from-indigo-950/40 via-background to-purple-950/30 p-2">
          <div className="flex size-7 items-center justify-center rounded-full bg-lime/20 text-lime ring-2 ring-lime/10">
            <Play className="ml-0.5 size-3.5 fill-lime" />
          </div>
          <div className="mt-2 h-1 w-20 rounded-full bg-surface-3">
            <div className="h-full w-12 rounded-full bg-lime" />
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-surface-2/60 p-1.5">
          <Video className="size-3 text-purple-400" />
          <div className="h-1.5 w-20 rounded-full bg-surface-3" />
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-surface-2/40 p-1.5">
          <div className="size-3 rounded-full bg-lime/20" />
          <div className="h-1.5 w-24 rounded-full bg-surface-3" />
        </div>
      </div>
    );
  }

  if (lower.includes("todo") || lower.includes("task")) {
    return (
      <div className="flex flex-col gap-1.5 p-3">
        <div className="flex items-center gap-2 rounded-md bg-surface-2/80 px-2 py-1.5">
          <CheckSquare className="size-3 text-emerald-400" />
          <div className="h-1.5 w-20 rounded-full bg-surface-3" />
        </div>
        <div className="flex items-center gap-2 rounded-md bg-surface-2/60 px-2 py-1.5">
          <CheckSquare className="size-3 text-emerald-400" />
          <div className="h-1.5 w-24 rounded-full bg-surface-3" />
        </div>
        <div className="flex items-center gap-2 rounded-md bg-surface-2/40 px-2 py-1.5">
          <div className="size-3 rounded border border-border" />
          <div className="h-1.5 w-16 rounded-full bg-surface-3" />
        </div>
        <div className="flex items-center gap-2 rounded-md bg-surface-2/30 px-2 py-1.5">
          <div className="size-3 rounded border border-border" />
          <div className="h-1.5 w-28 rounded-full bg-surface-3" />
        </div>
      </div>
    );
  }

  if (lower.includes("ai") || lower.includes("chat")) {
    return (
      <div className="flex flex-col gap-1.5 p-3">
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-purple-400">
          <Sparkles className="size-3" />
          <span>AI Assistant</span>
        </div>
        <div className="rounded-lg bg-purple-900/20 p-2 text-[9px] text-muted">
          Ready to generate components and backend functions…
        </div>
        <div className="flex items-center gap-1.5 rounded-lg bg-surface-2/60 p-1.5">
          <MessageSquare className="size-3 text-sky-400" />
          <div className="h-1.5 w-20 rounded-full bg-surface-3" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 p-3">
      <div className="flex items-center justify-between">
        <div className="h-2 w-14 rounded-full bg-lime/40" />
        <div className="h-1.5 w-8 rounded-full bg-surface-3" />
      </div>
      <div className="space-y-1 rounded-lg bg-surface-2/40 p-2">
        <div className="h-2 w-24 rounded-full bg-foreground/60" />
        <div className="h-1.5 w-32 rounded-full bg-surface-3" />
      </div>
      <div className="flex items-center gap-2">
        <div className="h-4 w-14 rounded bg-lime/20" />
        <div className="h-4 w-10 rounded bg-surface-2" />
      </div>
    </div>
  );
}

export function ProjectCardLiveFrame({ project }: { project: Project }) {
  const domain = `${project.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}.appwright.app`;

  return (
    <div className="relative my-3.5 h-34 w-full overflow-hidden rounded-xl border border-border/70 bg-[#090C12] transition-colors group-hover:border-border">
      {/* Mini browser top address bar */}
      <div className="flex h-6 items-center justify-between border-b border-border/50 bg-[#0E121A] px-2.5">
        <div className="flex items-center gap-1">
          <span className="size-1.5 rounded-full bg-rose-500/80" />
          <span className="size-1.5 rounded-full bg-amber-500/80" />
          <span className="size-1.5 rounded-full bg-emerald-500/80" />
        </div>
        <span className="max-w-[130px] truncate font-mono text-[9px] text-muted/70">
          {domain}
        </span>
        <span className="size-1.5 rounded-full bg-emerald-400" />
      </div>

      {/* Frame content with smooth auto-scroll effect */}
      <div className="relative h-[calc(100%-24px)] w-full overflow-hidden">
        {project.previewUrl ? (
          <div
            className="h-65 w-full animate-auto-scroll-frame"
            style={{ ["--scroll-viewport" as string]: "112px" }}
          >
            <iframe
              src={project.previewUrl}
              title={project.name}
              loading="lazy"
              tabIndex={-1}
              sandbox="allow-scripts allow-same-origin"
              className="pointer-events-none size-full border-0 bg-background"
            />
          </div>
        ) : (
          <div className="w-full animate-auto-scroll-card">
            <MockupContent name={project.name} />
          </div>
        )}
      </div>
    </div>
  );
}
