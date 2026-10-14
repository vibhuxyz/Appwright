import { useUpdateSessionMode } from "@/features/agent/hooks/useSession";
import {
  PERMISSION_MODES,
  type PermissionMode,
  type Session,
} from "@/features/agent/schemas/agentSchemas";

const MODE_LABEL: Record<PermissionMode, string> = {
  default: "Ask before edits",
  "accept-edits": "Auto-accept edits",
  plan: "Plan (read-only)",
};

function isPermissionMode(value: string): value is PermissionMode {
  return PERMISSION_MODES.some((mode) => mode === value);
}

export function PermissionModeSelect({
  projectId,
  session,
}: {
  projectId: string;
  session: Session;
}) {
  const updateMode = useUpdateSessionMode(projectId);
  const current = session.mode && isPermissionMode(session.mode) ? session.mode : "default";

  return (
    <label className="flex items-center justify-between gap-2 px-2.5 py-2 text-xs text-muted">
      Permissions
      <select
        value={current}
        disabled={updateMode.isPending}
        onChange={(event) => {
          const next = event.target.value;
          if (isPermissionMode(next)) updateMode.mutate({ sessionId: session.id, mode: next });
        }}
        className="rounded-md bg-surface-2 px-1.5 py-1 text-foreground"
      >
        {PERMISSION_MODES.map((mode) => (
          <option key={mode} value={mode}>
            {MODE_LABEL[mode]}
          </option>
        ))}
      </select>
    </label>
  );
}
