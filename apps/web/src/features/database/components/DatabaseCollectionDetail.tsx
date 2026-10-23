import { FileSpreadsheet, Layers } from "lucide-react";
import type { DatabaseCollection } from "../schemas/databaseSchemas";
import { DatabaseStructureTable } from "./DatabaseStructureTable";
import { DatabaseRecordsTable } from "./DatabaseRecordsTable";

export function DatabaseCollectionDetail({
  collection,
  activeTab,
  onTabChange,
  projectId,
}: {
  collection: DatabaseCollection;
  activeTab: "structure" | "records";
  onTabChange: (tab: "structure" | "records") => void;
  projectId?: string;
}) {
  return (
    <div className="flex-1 rounded-2xl border border-border/70 bg-[#121622]/90 p-5 shadow-xs">
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-4">
          <div className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-xl bg-amber-500/10 text-amber-400 font-mono text-sm font-black">
              {collection.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-mono text-base font-bold text-white">
                  {collection.name}
                </h3>
                <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[10px] font-semibold text-muted">
                  {collection.documentCount} records
                </span>
              </div>
              <p className="text-xs text-muted">
                MongoDB collection with {collection.fields.length} schema fields
              </p>
            </div>
          </div>

          <div className="flex items-center rounded-xl border border-border/70 bg-surface/60 p-1 text-xs">
            <button
              type="button"
              onClick={() => onTabChange("structure")}
              className={`flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1 font-semibold transition-colors ${
                activeTab === "structure"
                  ? "bg-surface-2 text-white shadow-xs"
                  : "text-muted hover:text-foreground"
              }`}
            >
              <Layers className="size-3.5 text-amber-400" />
              <span>Schema Structure</span>
            </button>
            <button
              type="button"
              onClick={() => onTabChange("records")}
              className={`flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1 font-semibold transition-colors ${
                activeTab === "records"
                  ? "bg-surface-2 text-white shadow-xs"
                  : "text-muted hover:text-foreground"
              }`}
            >
              <FileSpreadsheet className="size-3.5 text-lime" />
              <span>Live Records</span>
            </button>
          </div>
        </div>

        <div className="pt-4">
          {activeTab === "structure" ? (
            <div>
              <DatabaseStructureTable fields={collection.fields} />
              {collection.indexes.length > 0 && (
                <div className="mt-6 border-t border-border/50 pt-4">
                  <h4 className="text-xs font-bold text-muted uppercase tracking-wider">
                    Collection Indexes ({collection.indexes.length})
                  </h4>
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    {collection.indexes.map((idx) => (
                      <div
                        key={idx.name}
                        className="flex items-center gap-1.5 rounded-lg border border-border/60 bg-surface-2 px-2.5 py-1 text-xs font-mono"
                      >
                        <span className="font-semibold text-white">{idx.name}</span>
                        <span className="text-muted text-[10px]">
                          {JSON.stringify(idx.keys)}
                        </span>
                        {idx.unique && (
                          <span className="rounded bg-sky-500/20 px-1 text-[9px] font-bold text-sky-400">
                            UNIQUE
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <DatabaseRecordsTable
              projectId={projectId ?? ""}
              collectionName={collection.name}
            />
          )}
        </div>
      </div>
    </div>
  );
}
