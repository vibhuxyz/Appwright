import { useState } from "react";
import { Check, Copy, ExternalLink, Code2, Loader2, Globe, ServerCrash } from "lucide-react";
import type { Project } from "@/features/projects/schemas/projectSchemas";

function LivePreviewBadge({ isRunning, status }: { isRunning: boolean; status: string }) {
  if (isRunning) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-400">
        <span className="size-1.5 rounded-full bg-emerald-400" />
        Live & Deployed
      </span>
    );
  }
  if (status === "BUILDING") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[10px] font-semibold text-amber-400">
        <Loader2 className="size-3 animate-spin text-amber-400" />
        Building Project
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-3 px-2.5 py-0.5 text-[10px] font-semibold text-muted">
      <span className="size-1.5 rounded-full bg-muted/60" />
      Dev Server Idle
    </span>
  );
}

function LivePreviewEmptyState({
  status,
  onOpenSandbox,
}: {
  status: string;
  onOpenSandbox: () => void;
}) {
  const isBuilding = status === "BUILDING";
  const isError = status === "ERROR";

  return (
    <div className="mt-3 flex h-70 w-full flex-col items-center justify-center rounded-xl border border-dashed border-border/70 bg-[#0E1119] p-6 text-center">
      <div className="grid size-12 place-items-center rounded-2xl border border-border/60 bg-surface-2 text-muted">
        {isBuilding ? (
          <Loader2 className="size-6 animate-spin text-amber-400" />
        ) : isError ? (
          <ServerCrash className="size-6 text-rose-400" />
        ) : (
          <Globe className="size-6 text-lime" />
        )}
      </div>

      <h3 className="mt-3 text-sm font-bold text-foreground">
        {isBuilding
          ? "Compiling Application…"
          : isError
            ? "Build Error Encountered"
            : "Dev Server Not Started"}
      </h3>

      <p className="mt-1.5 max-w-xs text-xs text-muted">
        {isBuilding
          ? "Assembling project dependencies and initializing the server."
          : "Resume building to start the live dev server and preview your application."}
      </p>

      <button
        type="button"
        onClick={onOpenSandbox}
        className="mt-4 flex cursor-pointer items-center gap-2 rounded-xl bg-lime px-4 py-2 text-xs font-bold text-black shadow-md transition-all hover:bg-lime/90"
      >
        <Code2 className="size-4" />
        <span>Resume Building</span>
      </button>
    </div>
  );
}

export function ProjectConsoleLivePreview({
  projectName,
  project,
  onOpenSandbox,
}: {
  projectName: string;
  project?: Project;
  onOpenSandbox: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [iframeError, setIframeError] = useState(false);

  const previewUrl = project?.previewUrl;
  const status = project?.status ?? "READY";
  const domain = previewUrl
    ? previewUrl.replace(/^https?:\/\//, "").replace(/\/$/, "")
    : `${projectName.toLowerCase().replace(/[^a-z0-9]/g, "-")}.appwright.app`;

  const handleCopy = () => {
    navigator.clipboard.writeText(previewUrl ?? `https://${domain}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isRunning = Boolean(previewUrl && !iframeError);

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-border/70 bg-[#121622]/90 p-5">
      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white">Live Preview</h2>
          <LivePreviewBadge isRunning={isRunning} status={status} />
        </div>

        {isRunning && previewUrl ? (
          <div className="relative mt-3 h-70 w-full overflow-hidden rounded-xl border border-border/80 bg-background shadow-inner">
            <div
              className="h-160 w-full animate-auto-scroll-frame"
              style={{ ["--scroll-viewport" as string]: "280px" }}
            >
              <iframe
                src={previewUrl}
                title={projectName}
                onError={() => setIframeError(true)}
                className="pointer-events-none size-full border-0 bg-background"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              />
            </div>
          </div>
        ) : (
          <LivePreviewEmptyState status={status} onOpenSandbox={onOpenSandbox} />
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border/40 pt-3 text-xs">
        <a
          href={previewUrl ?? `https://${domain}`}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 text-muted transition-colors hover:text-foreground"
        >
          <span className="text-muted">🌐</span>
          <span className="font-mono text-[11px]">{previewUrl ?? `https://${domain}`}</span>
          <ExternalLink className="size-3" />
        </a>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-border/80 bg-surface/80 px-2.5 py-1 text-xs font-semibold text-foreground transition-colors hover:bg-surface-2"
          >
            {copied ? <Check className="size-3 text-lime" /> : <Copy className="size-3" />}
            <span>{copied ? "Copied" : "Copy Link"}</span>
          </button>

          <button
            type="button"
            onClick={onOpenSandbox}
            className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-lime/30 bg-lime/10 px-2.5 py-1 text-xs font-bold text-lime transition-colors hover:bg-lime/20"
          >
            <Code2 className="size-3" />
            <span>Resume Building</span>
          </button>
        </div>
      </div>
    </div>
  );
}
