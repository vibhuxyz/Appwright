import { useState } from "react";
import {
  ExternalLink,
  Copy,
  Check,
  Rocket,
  Code2,
} from "lucide-react";
import { RuntimeEnvironmentBadge } from "@/features/projects/runtime-environment";
import type { Project } from "@/features/projects/schemas/projectSchemas";

export function ProjectConsoleProjectHeader({
  projectName,
  project,
  onOpenSandbox,
  onOpenDeploy,
}: {
  projectName: string;
  project?: Project;
  onOpenSandbox: () => void;
  onOpenDeploy?: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const status = project?.status ?? "READY";
  const domain = project?.previewUrl
    ? project.previewUrl.replace(/^https?:\/\//, "").replace(/\/$/, "")
    : `${projectName.toLowerCase().replace(/[^a-z0-9]/g, "-")}.appwright.app`;

  const handleCopy = () => {
    navigator.clipboard.writeText(project?.previewUrl ?? `https://${domain}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const subtitle =
    project?.templateId === "nextjs-fullstack"
      ? "Fullstack Next.js application with MongoDB and Tailwind CSS"
      : "Vite and React application with Tailwind CSS";

  return (
    <div className="border-b border-border/60 bg-background px-8 py-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        {/* Project info */}
        <div className="flex items-start gap-4">
          <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-linear-to-br from-indigo-500 to-purple-600 font-mono text-xl font-black text-white shadow-lg shadow-purple-900/20">
            {projectName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-extrabold tracking-tight text-white sm:text-2xl">
                {projectName}
              </h1>
              <RuntimeEnvironmentBadge
                status={status}
                hasProductionDeployment={project?.hasProductionDeployment ?? false}
              />
            </div>

            <div className="mt-1 flex items-center gap-2 text-xs text-muted">
              <a
                href={project?.previewUrl ?? `https://${domain}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-muted transition-colors hover:text-foreground hover:underline"
              >
                <span>{domain}</span>
                <ExternalLink className="size-3" />
              </a>
              <button
                type="button"
                onClick={handleCopy}
                className="cursor-pointer text-muted transition-colors hover:text-foreground"
                aria-label="Copy URL"
              >
                {copied ? <Check className="size-3 text-lime" /> : <Copy className="size-3" />}
              </button>
            </div>

            <p className="mt-1 text-xs text-muted">{subtitle}</p>
          </div>
        </div>

        {/* Top actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <a
            href={project?.previewUrl ?? `https://${domain}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 rounded-xl border border-border/80 bg-surface/80 px-3.5 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-surface-2"
          >
            <span>Visit App</span>
            <ExternalLink className="size-3.5 text-muted" />
          </a>

          <button
            type="button"
            onClick={onOpenSandbox}
            className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-lime/40 bg-lime/10 px-3.5 py-2 text-xs font-bold text-lime transition-all hover:bg-lime/20"
          >
            <Code2 className="size-3.5" />
            <span>Resume Building</span>
          </button>

          <button
            type="button"
            onClick={onOpenDeploy}
            className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-lime px-4 py-2 text-xs font-black text-black shadow-lg shadow-lime/20 transition-all hover:bg-lime/90"
          >
            <Rocket className="size-3.5 fill-black" />
            <span>Deploy</span>
          </button>
        </div>
      </div>
    </div>
  );
}
