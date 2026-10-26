import { CheckCircle2, ChevronRight, Activity, AlertCircle } from "lucide-react";
import type { EnvironmentIntegrationView } from "@repo/contracts";
import { ProjectDatabaseStatus } from "@/features/projects/components/ProjectDatabaseStatus";
import {
  TONE_TEXT_CLASS,
  integrationStatusPresentation,
  useEnvironmentOverview,
} from "@/features/environment";
import type {
  ProjectOverviewDatabase,
  ProjectOverviewHealth,
} from "../schemas/projectConsoleSchemas";

interface ProjectConsoleHealthProps {
  projectId?: string;
  templateId?: string;
  health?: ProjectOverviewHealth;
  database?: ProjectOverviewDatabase | null;
  previewUrl?: string | null;
  onOpenDatabase?: () => void;
  onOpenEnvironment?: () => void;
}

const RUNTIME_ENVIRONMENT = "development";

function formatStatus(view: EnvironmentIntegrationView | undefined): { label: string; color: string; isFailing: boolean } {
  const presentation = integrationStatusPresentation(view?.status ?? "not_required");
  return {
    label: presentation.label,
    color: TONE_TEXT_CLASS[presentation.tone],
    isFailing: presentation.tone === "danger",
  };
}

export function ProjectConsoleHealth({
  projectId,
  templateId,
  health,
  onOpenDatabase,
  onOpenEnvironment,
}: ProjectConsoleHealthProps) {
  const { data: envOverview } = useEnvironmentOverview(projectId, RUNTIME_ENVIRONMENT);
  const isDevRunning = Boolean(health?.devServer.running);
  const overallStatus = health?.overallStatus ?? "healthy";

  const badgeConfig = {
    healthy: {
      text: "All Systems Operational",
      badgeClass: "bg-emerald-500/15 text-emerald-400",
      dotClass: "bg-emerald-400",
      subtitle: "All configured project services are operational.",
    },
    provisioning: {
      text: "Services Provisioning",
      badgeClass: "bg-amber-500/15 text-amber-400",
      dotClass: "bg-amber-400 animate-pulse",
      subtitle: "Project infrastructure is being provisioned.",
    },
    degraded: {
      text: "Attention Needed",
      badgeClass: "bg-rose-500/15 text-rose-400",
      dotClass: "bg-rose-400",
      subtitle: "One or more project services encountered an error.",
    },
  }[overallStatus];

  const storageIntegration = envOverview?.integrations.find((i) => i.provider === "cloudinary");
  const authIntegration = envOverview?.integrations.find((i) => i.provider === "auth");

  const storageStatus = formatStatus(storageIntegration);
  const authStatus = formatStatus(authIntegration);

  const systemServices = [
    {
      id: "preview",
      name: "Local Dev Server",
      desc: isDevRunning && health?.devServer.url ? health.devServer.url : "Dev server idle",
      status: isDevRunning ? "Online" : "Idle",
      statusColor: isDevRunning ? "text-success" : "text-muted",
      isFailing: false,
    },
    {
      id: "storage",
      name: "Media Storage (Cloudinary)",
      desc: storageIntegration?.lastError ?? "Asset uploads & CDN delivery",
      status: storageStatus.label,
      statusColor: storageStatus.color,
      isFailing: storageStatus.isFailing,
    },
    {
      id: "auth",
      name: "Authentication (Auth.js)",
      desc: authIntegration?.lastError ?? "Session security & credentials",
      status: authStatus.label,
      statusColor: authStatus.color,
      isFailing: authStatus.isFailing,
    },
  ];

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-border/70 bg-[#121622]/90 p-5">
      <div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <h2 className="text-sm font-bold text-white">App Health</h2>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${badgeConfig.badgeClass}`}
            >
              <span className={`size-1.5 rounded-full ${badgeConfig.dotClass}`} />
              {badgeConfig.text}
            </span>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg border border-border/60 bg-surface/60 px-2.5 py-1 text-[11px] text-muted">
            <Activity className="size-3 text-emerald-400" />
            <span>Live telemetry</span>
          </div>
        </div>

        <p className="mt-1 text-xs text-muted">{badgeConfig.subtitle}</p>

        <div className="mt-4 space-y-2">
          <div
            onClick={onOpenDatabase}
            className={onOpenDatabase ? "cursor-pointer transition-transform hover:scale-[1.01]" : ""}
          >
            <ProjectDatabaseStatus projectId={projectId} templateId={templateId} />
          </div>
          {systemServices.map((svc) => (
            <div
              key={svc.id}
              onClick={onOpenEnvironment}
              className={`flex items-center justify-between rounded-xl border border-border/40 bg-surface/40 p-3 transition-colors hover:border-border/80 hover:bg-surface/70 ${onOpenEnvironment ? "cursor-pointer" : ""}`}
            >
              <div className="flex items-center gap-3">
                {svc.isFailing ? (
                  <AlertCircle className={`size-4 shrink-0 ${svc.statusColor}`} />
                ) : (
                  <CheckCircle2 className={`size-4 shrink-0 ${svc.statusColor}`} />
                )}
                <div>
                  <p className="text-xs font-semibold text-foreground">{svc.name}</p>
                  <p className="text-[11px] text-muted">{svc.desc}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-right">
                <span className={`font-mono text-xs font-semibold ${svc.statusColor}`}>
                  {svc.status}
                </span>
                <ChevronRight className="size-3.5 text-muted" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
