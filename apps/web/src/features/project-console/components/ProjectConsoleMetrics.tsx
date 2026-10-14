import { ArrowUpRight, Database, FileCode2, Users, Zap } from "lucide-react";

const METRICS = [
  {
    id: "requests",
    title: "Total Requests",
    value: "12,548",
    change: "↑ 12% from last week",
    icon: Zap,
    iconStyle: "bg-purple-500/15 border-purple-500/30 text-purple-400",
    strokeColor: "#A855F7",
    points: "0,25 20,20 40,22 60,14 80,18 100,5 120,8",
  },
  {
    id: "users",
    title: "Active Users",
    value: "892",
    change: "↑ 8% from last week",
    icon: Users,
    iconStyle: "bg-emerald-500/15 border-emerald-500/30 text-emerald-400",
    strokeColor: "#10B981",
    points: "0,22 20,18 40,25 60,16 80,10 100,12 120,4",
  },
  {
    id: "storage",
    title: "Storage Used",
    value: "2.4 GB",
    change: "↑ 4% from last week",
    icon: Database,
    iconStyle: "bg-sky-500/15 border-sky-500/30 text-sky-400",
    strokeColor: "#38BDF8",
    points: "0,18 20,22 40,15 60,18 80,24 100,12 120,10",
  },
  {
    id: "functions",
    title: "Function Invocations",
    value: "1,204",
    change: "↑ 18% from last week",
    icon: FileCode2,
    iconStyle: "bg-pink-500/15 border-pink-500/30 text-pink-400",
    strokeColor: "#F43F5E",
    points: "0,24 20,16 40,18 60,10 80,15 100,8 120,4",
  },
] as const;

export function ProjectConsoleMetrics() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {METRICS.map((item) => {
        const Icon = item.icon;
        return (
          <div
            key={item.id}
            className="flex flex-col justify-between rounded-2xl border border-border/70 bg-[#121622]/90 p-5 shadow-xs transition-colors hover:border-border"
          >
            <div className="flex items-center gap-3">
              <div className={`grid size-8 place-items-center rounded-xl border ${item.iconStyle}`}>
                <Icon className="size-4" />
              </div>
              <span className="text-xs font-semibold text-muted">{item.title}</span>
            </div>

            <div className="mt-4 flex items-end justify-between">
              <div>
                <p className="text-2xl font-black text-white">{item.value}</p>
                <div className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                  <ArrowUpRight className="size-3" />
                  <span>{item.change.replace("↑ ", "")}</span>
                </div>
              </div>

              {/* Sparkline curve */}
              <div className="h-8 w-24">
                <svg className="size-full overflow-visible" viewBox="0 0 120 30">
                  <polyline
                    fill="none"
                    stroke={item.strokeColor}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={item.points}
                  />
                </svg>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
