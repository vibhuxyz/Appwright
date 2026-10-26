import { Database } from "lucide-react";
import type { DatabaseSource, IntegrationEnvironment } from "@repo/contracts";
import { cn } from "@/shared/lib/cn";
import { TONE_TEXT_CLASS, databaseSourcePresentation } from "../presentation";

interface DatabaseSourceRowProps {
  database: DatabaseSource;
  environment: IntegrationEnvironment;
}

export function DatabaseSourceRow({ database, environment }: DatabaseSourceRowProps) {
  const presentation = databaseSourcePresentation(database, environment);
  return (
    <tr className="hover:bg-surface-2/40">
      <td className="px-4 py-3 font-mono font-semibold text-foreground">MONGODB_URI</td>
      <td className="px-4 py-3 text-muted">Database</td>
      <td className="px-4 py-3">
        <span className="inline-flex items-center gap-1 text-[11px] text-muted">
          <Database className="size-3 text-info" />
          Managed
        </span>
      </td>
      <td className={cn("px-4 py-3 text-[11px] font-semibold", TONE_TEXT_CLASS[presentation.tone])}>
        {presentation.label}
        {presentation.detail && <span className="ml-1 font-mono font-normal text-muted">({presentation.detail})</span>}
      </td>
      <td className="px-4 py-3 text-[10px] font-semibold text-muted">
        {database.source === "NOT_REQUIRED" ? "Optional" : "Required"}
      </td>
      <td className="px-4 py-3" />
    </tr>
  );
}
