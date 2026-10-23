import { useState } from "react";
import { ChevronLeft, ChevronRight, Eye, Loader2 } from "lucide-react";
import { useCollectionDocuments } from "../hooks/useCollectionDocuments";
import { DocumentDetailModal } from "./DocumentDetailModal";

function formatCellValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export function DatabaseRecordsTable({
  projectId,
  collectionName,
}: {
  projectId: string;
  collectionName: string;
}) {
  const [page, setPage] = useState(0);
  const [selectedDoc, setSelectedDoc] = useState<Record<string, unknown> | null>(null);
  const limit = 20;

  const { data, isLoading } = useCollectionDocuments(
    projectId,
    collectionName,
    page,
    limit,
  );

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center gap-2 text-xs text-muted">
        <Loader2 className="size-4 animate-spin text-lime" />
        <span>Loading live collection records…</span>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="py-12 text-center text-xs text-muted">
        No documents currently stored in this collection.
      </div>
    );
  }

  const columns = Array.from(
    new Set(items.flatMap((item) => Object.keys(item))),
  );

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-border/60 text-[11px] font-semibold text-muted uppercase tracking-wider">
              <th className="py-2.5 pr-2 pl-2">#</th>
              {columns.map((col) => (
                <th key={col} className="px-3 py-2.5 font-mono">
                  {col}
                </th>
              ))}
              <th className="py-2.5 pr-2 pl-3 text-right">View</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40 font-mono">
            {items.map((doc, idx) => (
              <tr
                key={String(doc._id ?? idx)}
                onClick={() => setSelectedDoc(doc)}
                className="cursor-pointer transition-colors hover:bg-surface/50"
              >
                <td className="py-2.5 pr-2 pl-2 text-[10px] text-muted">
                  {page * limit + idx + 1}
                </td>
                {columns.map((col) => (
                  <td key={col} className="max-w-xs truncate px-3 py-2.5 text-foreground-secondary">
                    {formatCellValue(doc[col])}
                  </td>
                ))}
                <td className="py-2.5 pr-2 pl-3 text-right">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedDoc(doc);
                    }}
                    className="rounded p-1 text-muted hover:text-foreground"
                    aria-label="Inspect document"
                  >
                    <Eye className="size-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-3 text-xs text-muted">
        <span>
          Showing {items.length > 0 ? page * limit + 1 : 0} to{" "}
          {Math.min((page + 1) * limit, total)} of {total} documents
        </span>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="flex items-center gap-1 rounded-lg border border-border/70 px-2 py-1 text-xs text-foreground transition-colors hover:bg-surface disabled:opacity-40"
          >
            <ChevronLeft className="size-3.5" />
            <span>Prev</span>
          </button>
          <span>
            {page + 1} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => (p + 1 < totalPages ? p + 1 : p))}
            disabled={page + 1 >= totalPages}
            className="flex items-center gap-1 rounded-lg border border-border/70 px-2 py-1 text-xs text-foreground transition-colors hover:bg-surface disabled:opacity-40"
          >
            <span>Next</span>
            <ChevronRight className="size-3.5" />
          </button>
        </div>
      </div>

      <DocumentDetailModal
        document={selectedDoc}
        onClose={() => setSelectedDoc(null)}
      />
    </div>
  );
}
