import { useState } from "react";
import { Search, Table2 } from "lucide-react";
import type { DatabaseCollection } from "../schemas/databaseSchemas";

export function DatabaseCollectionsList({
  collections,
  selectedCollectionName,
  onSelectCollection,
}: {
  collections: DatabaseCollection[];
  selectedCollectionName: string | null;
  onSelectCollection: (name: string) => void;
}) {
  const [search, setSearch] = useState("");

  const filtered = collections.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="flex h-full w-64 shrink-0 flex-col rounded-2xl border border-border/70 bg-[#121622]/90 p-4">
      <div className="flex items-center justify-between pb-3">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider">
          Collections
        </h3>
        <span className="rounded-full bg-surface-3 px-2 py-0.5 text-[10px] font-semibold text-muted">
          {collections.length}
        </span>
      </div>

      <div className="relative my-2">
        <Search className="absolute top-2.5 left-2.5 size-3.5 text-muted" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter collections…"
          className="w-full rounded-xl border border-border/70 bg-surface/60 py-1.5 pr-2.5 pl-8 text-xs text-foreground placeholder-muted outline-none focus:border-border"
        />
      </div>

      <div className="mt-2 flex-1 space-y-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="py-4 text-center text-xs text-muted">No collections found</p>
        ) : (
          filtered.map((col) => {
            const isSelected = col.name === selectedCollectionName;
            return (
              <button
                key={col.name}
                type="button"
                onClick={() => onSelectCollection(col.name)}
                className={`flex w-full cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-left text-xs transition-colors ${
                  isSelected
                    ? "bg-lime/10 font-bold text-lime border border-lime/30"
                    : "text-foreground-secondary hover:bg-surface/70 hover:text-foreground border border-transparent"
                }`}
              >
                <div className="flex min-w-0 items-center gap-2">
                  <Table2 className={`size-3.5 shrink-0 ${isSelected ? "text-lime" : "text-muted"}`} />
                  <span className="truncate font-mono">{col.name}</span>
                </div>
                <span className="shrink-0 rounded-md bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] text-muted">
                  {col.documentCount}
                </span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
