import { cn } from "@/shared/lib/cn";
import { deriveRuntimeEnvironment, type RuntimeEnvironmentKind } from "./derive-runtime-environment";

const BADGE_TONE: Record<RuntimeEnvironmentKind, { badge: string; dot: string }> = {
  building: { badge: "bg-warning/15 text-warning", dot: "animate-pulse bg-warning" },
  error: { badge: "bg-danger/15 text-danger", dot: "bg-danger" },
  production: { badge: "bg-success/15 text-success", dot: "bg-success" },
  development: { badge: "bg-info/15 text-info", dot: "bg-info" },
};

interface RuntimeEnvironmentBadgeProps {
  status: string;
  hasProductionDeployment: boolean;
  className?: string;
}

export function RuntimeEnvironmentBadge({ status, hasProductionDeployment, className }: RuntimeEnvironmentBadgeProps) {
  const environment = deriveRuntimeEnvironment({ status, hasProductionDeployment });
  const tone = BADGE_TONE[environment.kind];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
        tone.badge,
        className,
      )}
    >
      <span aria-hidden="true" className={cn("size-1.5 rounded-full", tone.dot)} />
      {environment.label}
    </span>
  );
}
