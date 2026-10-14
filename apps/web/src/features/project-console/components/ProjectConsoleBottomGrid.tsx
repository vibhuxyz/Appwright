import { ArrowRight, ChevronRight, MoreVertical } from "lucide-react";
import {
  RECENT_DEPLOYMENTS,
  RECENT_ACTIVITY,
  QUICK_ACTIONS,
} from "../data/consoleData";

export function ProjectConsoleBottomGrid() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      {/* 1. Recent Deployments */}
      <div className="flex flex-col justify-between rounded-2xl border border-border/70 bg-[#121622]/90 p-5">
        <div>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Recent Deployments</h3>
            <button
              type="button"
              className="flex items-center gap-1 text-[11px] font-semibold text-muted hover:text-foreground"
            >
              <span>View all</span>
              <ArrowRight className="size-3" />
            </button>
          </div>

          <div className="mt-4 space-y-2.5">
            {RECENT_DEPLOYMENTS.map((d) => {
              const Icon = "icon" in d ? d.icon : null;
              return (
                <div
                  key={d.id}
                  className="flex items-center justify-between rounded-xl border border-border/40 bg-surface/30 p-2.5"
                >
                  <div className="flex items-center gap-2.5">
                    {Icon ? (
                      <Icon className={`size-4 ${d.iconColor}`} />
                    ) : (
                      <span className={`size-3.5 rounded-full ${d.dotStyle}`} />
                    )}
                    <div>
                      <p className="text-xs font-semibold text-foreground">{d.env}</p>
                      <p className="text-[10px] text-muted">{d.time}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-muted">{d.commit}</span>
                    <MoreVertical className="size-3.5 text-muted" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. Recent Activity */}
      <div className="flex flex-col justify-between rounded-2xl border border-border/70 bg-[#121622]/90 p-5">
        <div>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Recent Activity</h3>
            <button
              type="button"
              className="flex items-center gap-1 text-[11px] font-semibold text-muted hover:text-foreground"
            >
              <span>View all</span>
              <ArrowRight className="size-3" />
            </button>
          </div>

          <div className="mt-4 space-y-2.5">
            {RECENT_ACTIVITY.map((act) => {
              const Icon = act.icon;
              return (
                <div
                  key={act.id}
                  className="flex items-center justify-between rounded-xl border border-border/40 bg-surface/30 p-2.5"
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`grid size-6 place-items-center rounded-lg ${act.style}`}>
                      <Icon className="size-3.5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground">{act.title}</p>
                      <p className="text-[10px] text-muted">{act.desc}</p>
                    </div>
                  </div>
                  <span className="text-[10px] text-muted">{act.time}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Quick Actions */}
      <div className="flex flex-col justify-between rounded-2xl border border-border/70 bg-[#121622]/90 p-5">
        <div>
          <h3 className="text-sm font-bold text-white">Quick Actions</h3>

          <div className="mt-4 space-y-2.5">
            {QUICK_ACTIONS.map((qa) => {
              const Icon = qa.icon;
              return (
                <button
                  key={qa.id}
                  type="button"
                  className="flex w-full cursor-pointer items-center justify-between rounded-xl border border-border/40 bg-surface/30 p-2.5 text-left transition-colors hover:border-border/80 hover:bg-surface/70"
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`grid size-6 place-items-center rounded-lg ${qa.style}`}>
                      <Icon className="size-3.5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground">{qa.title}</p>
                      <p className="text-[10px] text-muted">{qa.desc}</p>
                    </div>
                  </div>
                  <ChevronRight className="size-4 text-muted" />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
