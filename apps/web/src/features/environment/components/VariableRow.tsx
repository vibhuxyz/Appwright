import { KeyRound, Lock, Trash2 } from "lucide-react";
import type { ProjectEnvironmentVariableResponse, VariableScope } from "@repo/contracts";
import { cn } from "@/shared/lib/cn";

const SHARED_SCOPE = "all";

interface VariableRowProps {
  variable: ProjectEnvironmentVariableResponse;
  sourceLabel: string;
  canDelete: boolean;
  onDelete: (input: { environment: VariableScope; key: string }) => void;
}

export function VariableRow({ variable, sourceLabel, canDelete, onDelete }: VariableRowProps) {
  return (
    <tr className="hover:bg-surface-2/40">
      <td className="px-4 py-3 font-mono font-semibold text-foreground">
        {variable.key}
        {variable.environment === SHARED_SCOPE && (
          <span className="ml-2 rounded-full border border-border px-1.5 py-0.5 font-sans text-[10px] font-medium text-muted">
            All environments
          </span>
        )}
      </td>
      <td className="px-4 py-3 text-muted">{sourceLabel}</td>
      <td className="px-4 py-3">
        <span className="inline-flex items-center gap-1 text-[11px] text-muted">
          {variable.isSecret ? <Lock className="size-3 text-warning" /> : <KeyRound className="size-3 text-info" />}
          {variable.isSecret ? "Secret" : "Plaintext"}
        </span>
      </td>
      <td className="px-4 py-3 font-mono text-[11px] text-muted">
        {variable.maskedValue ?? <span className="text-warning/80 italic">Missing value</span>}
      </td>
      <td className="px-4 py-3">
        <span className={cn("text-[10px] font-semibold", variable.required ? "text-danger" : "text-muted")}>
          {variable.required ? "Required" : "Optional"}
        </span>
      </td>
      <td className="px-4 py-3 text-right">
        {canDelete && (
          <button
            type="button"
            onClick={() => onDelete({ environment: variable.environment, key: variable.key })}
            className="p-1 text-muted transition-colors hover:text-danger"
            aria-label={`Delete ${variable.key}`}
          >
            <Trash2 className="size-3.5" />
          </button>
        )}
      </td>
    </tr>
  );
}
