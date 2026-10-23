import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import type { ProjectDatabaseResponse } from "@repo/contracts";
import { templateNeedsDatabase } from "@repo/contracts";
import {
  useProjectDatabases,
  useRetryProjectDatabase,
} from "../hooks/useProjectDatabase";

function statusCopy(row: ProjectDatabaseResponse): {
  label: string;
  detail: string;
} {
  if (row.status === "ready") {
    return {
      label: "Ready",
      detail: `Logical database ${row.databaseName}`,
    };
  }
  if (row.status === "failed") {
    return {
      label: "Failed",
      detail: row.lastErrorCode
        ? `Could not provision (${row.lastErrorCode})`
        : "Could not provision the project database",
    };
  }
  if (row.status === "provisioning" || row.status === "pending") {
    return {
      label: "Provisioning",
      detail: "Assigning a project-scoped MongoDB database",
    };
  }
  return {
    label: "Scheduled for deletion",
    detail: "The database will be removed after the retention period",
  };
}

export function ProjectDatabaseStatus({
  projectId,
  templateId,
}: {
  projectId?: string;
  templateId?: string;
}) {
  const needsDatabase = templateNeedsDatabase(templateId ?? "");
  const query = useProjectDatabases(needsDatabase ? projectId : undefined);
  const retry = useRetryProjectDatabase(projectId ?? "");

  if (!needsDatabase) {
    return (
      <div className="flex items-center justify-between rounded-xl border border-border/40 bg-surface/40 p-3">
        <div>
          <p className="text-xs font-semibold text-foreground">Database</p>
          <p className="text-[11px] text-muted">
            This project does not use a generated-app database
          </p>
        </div>
      </div>
    );
  }

  if (query.isPending) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-border/40 bg-surface/40 p-3">
        <Loader2 className="size-4 animate-spin text-muted" aria-hidden />
        <div>
          <p className="text-xs font-semibold text-foreground">Database</p>
          <p className="text-[11px] text-muted">Checking database status…</p>
        </div>
      </div>
    );
  }

  if (query.isError) {
    return (
      <div className="flex items-center justify-between rounded-xl border border-border/40 bg-surface/40 p-3">
        <div className="flex items-center gap-3">
          <AlertCircle className="size-4 text-destructive" aria-hidden />
          <div>
            <p className="text-xs font-semibold text-foreground">Database</p>
            <p className="text-[11px] text-muted">
              {query.error instanceof Error
                ? query.error.message
                : "Could not load database status"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const row = query.data.items.find((item) => item.environment === "development");
  if (!row) {
    return (
      <div className="flex items-center justify-between rounded-xl border border-border/40 bg-surface/40 p-3">
        <div>
          <p className="text-xs font-semibold text-foreground">Database</p>
          <p className="text-[11px] text-muted">
            No database. One is created when the app stores data.
          </p>
        </div>
        {projectId ? (
          <button
            type="button"
            className="rounded-lg border border-border/60 px-2 py-1 text-[11px] font-semibold text-foreground hover:bg-surface"
            onClick={() => retry.mutate("development")}
            disabled={retry.isPending}
          >
            {retry.isPending ? "Provisioning…" : "Provision"}
          </button>
        ) : null}
      </div>
    );
  }

  const copy = statusCopy(row);
  return (
    <div className="flex items-center justify-between rounded-xl border border-border/40 bg-surface/40 p-3">
      <div className="flex items-center gap-3">
        {row.status === "ready" ? (
          <CheckCircle2 className="size-4 text-emerald-400" aria-hidden />
        ) : row.status === "failed" ? (
          <AlertCircle className="size-4 text-destructive" aria-hidden />
        ) : (
          <Loader2 className="size-4 animate-spin text-muted" aria-hidden />
        )}
        <div>
          <p className="text-xs font-semibold text-foreground">
            Database · {copy.label}
          </p>
          <p className="text-[11px] text-muted">{copy.detail}</p>
        </div>
      </div>
      {row.status === "failed" && projectId ? (
        <button
          type="button"
          className="rounded-lg border border-border/60 px-2 py-1 text-[11px] font-semibold text-foreground hover:bg-surface"
          onClick={() => retry.mutate(row.environment)}
          disabled={retry.isPending}
        >
          {retry.isPending ? "Retrying…" : "Retry"}
        </button>
      ) : null}
    </div>
  );
}
