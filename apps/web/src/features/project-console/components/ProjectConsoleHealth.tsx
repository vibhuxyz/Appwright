import { CheckCircle2, ChevronDown, ChevronRight } from "lucide-react";

const HEALTH_SERVICES = [
  { id: "api", name: "API", desc: "All endpoints responding normally", uptime: "99.98% uptime" },
  { id: "db", name: "Databases", desc: "All databases are healthy", uptime: "100% uptime" },
  { id: "storage", name: "Storage", desc: "File storage is running smoothly", uptime: "100% uptime" },
  { id: "functions", name: "Functions", desc: "All functions are executing normally", uptime: "99.95% uptime" },
  { id: "realtime", name: "Realtime", desc: "Realtime connections active", uptime: "100% uptime" },
] as const;

export function ProjectConsoleHealth() {
  return (
    <div className="flex flex-col justify-between rounded-2xl border border-border/70 bg-[#121622]/90 p-5">
      <div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <h2 className="text-sm font-bold text-white">App Health</h2>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-400">
              <span className="size-1.5 rounded-full bg-emerald-400" />
              All Systems Operational
            </span>
          </div>
          <button
            type="button"
            className="flex items-center gap-1 rounded-lg border border-border/60 bg-surface/60 px-2 py-1 text-[11px] text-muted hover:text-foreground"
          >
            <span>Last 24 hours</span>
            <ChevronDown className="size-3" />
          </button>
        </div>

        <p className="mt-1 text-xs text-muted">Your app is running smoothly.</p>

        <div className="mt-4 space-y-2">
          {HEALTH_SERVICES.map((svc) => (
            <div
              key={svc.id}
              className="flex items-center justify-between rounded-xl border border-border/40 bg-surface/40 p-3 transition-colors hover:border-border/80 hover:bg-surface/70"
            >
              <div className="flex items-center gap-3">
                <CheckCircle2 className="size-4 shrink-0 text-emerald-400" />
                <div>
                  <p className="text-xs font-semibold text-foreground">{svc.name}</p>
                  <p className="text-[11px] text-muted">{svc.desc}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-right">
                <span className="font-mono text-xs font-semibold text-emerald-400">
                  {svc.uptime}
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
