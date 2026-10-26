import { useEffect } from "react";
import { AlertOctagon, AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import type { ToastItem, ToastVariant } from "./types";

const VARIANT_CONFIGS = {
  success: {
    container: "border-emerald-500/50 bg-[#0c2419]/95 text-emerald-100 shadow-emerald-950/60",
    badge: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40 ring-2 ring-emerald-500/20",
    accent: "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]",
    progress: "bg-gradient-to-r from-emerald-500 to-teal-300",
    desc: "text-emerald-200/80",
    close: "text-emerald-400/70 hover:text-emerald-100 hover:bg-emerald-500/20",
    Icon: CheckCircle2,
  },
  error: {
    container: "border-rose-500/50 bg-[#2a0c13]/95 text-rose-100 shadow-rose-950/60",
    badge: "bg-rose-500/20 text-rose-400 border-rose-500/40 ring-2 ring-rose-500/20",
    accent: "bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.8)]",
    progress: "bg-gradient-to-r from-rose-500 to-red-400",
    desc: "text-rose-200/80",
    close: "text-rose-400/70 hover:text-rose-100 hover:bg-rose-500/20",
    Icon: AlertOctagon,
  },
  warning: {
    container: "border-amber-500/50 bg-[#291705]/95 text-amber-100 shadow-amber-950/60",
    badge: "bg-amber-500/20 text-amber-400 border-amber-500/40 ring-2 ring-amber-500/20",
    accent: "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]",
    progress: "bg-gradient-to-r from-amber-500 to-yellow-300",
    desc: "text-amber-200/80",
    close: "text-amber-400/70 hover:text-amber-100 hover:bg-amber-500/20",
    Icon: AlertTriangle,
  },
  info: {
    container: "border-sky-500/50 bg-[#081f2f]/95 text-sky-100 shadow-sky-950/60",
    badge: "bg-sky-500/20 text-sky-400 border-sky-500/40 ring-2 ring-sky-500/20",
    accent: "bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.8)]",
    progress: "bg-gradient-to-r from-sky-500 to-indigo-400",
    desc: "text-sky-200/80",
    close: "text-sky-400/70 hover:text-sky-100 hover:bg-sky-500/20",
    Icon: Info,
  },
} as const satisfies Record<ToastVariant, unknown>;

export function ToastItemView({
  item,
  onDismiss,
}: {
  item: ToastItem;
  onDismiss: (id: string) => void;
}) {
  const config = VARIANT_CONFIGS[item.variant];
  const { Icon } = config;

  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(item.id);
    }, item.durationMs);
    return () => clearTimeout(timer);
  }, [item.id, item.durationMs, onDismiss]);

  return (
    <div
      role={item.variant === "error" ? "alert" : "status"}
      className={cn(
        "pointer-events-auto relative flex w-full max-w-sm flex-col overflow-hidden rounded-2xl border backdrop-blur-xl shadow-2xl transition-all duration-300",
        config.container,
      )}
    >
      <div className="flex items-start gap-3 p-4">
        <div className={cn("grid size-9 shrink-0 place-items-center rounded-xl border", config.badge)}>
          <Icon className="size-4.5" />
        </div>
        <div className="min-w-0 flex-1 pt-0.5">
          <h4 className="text-sm font-bold tracking-tight text-white">{item.title}</h4>
          {item.description && (
            <p className={cn("mt-1 text-xs leading-relaxed", config.desc)}>
              {item.description}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => onDismiss(item.id)}
          aria-label="Dismiss notification"
          className={cn("grid size-7 shrink-0 cursor-pointer place-items-center rounded-lg transition-colors", config.close)}
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="h-1 w-full bg-black/30">
        <div
          className={cn("h-full", config.progress)}
          style={{
            animation: `toastProgressShrink ${item.durationMs}ms linear forwards`,
          }}
        />
      </div>
    </div>
  );
}
