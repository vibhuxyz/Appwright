import { Key, Hash, Sparkles } from "lucide-react";
import type { DatabaseField } from "../schemas/databaseSchemas";

function typeBadgeStyle(type: string): string {
  const normalized = type.toLowerCase();
  if (normalized.includes("objectid") || normalized.includes("id")) {
    return "bg-purple-500/15 text-purple-400 border-purple-500/30";
  }
  if (normalized.includes("string") || normalized.includes("text")) {
    return "bg-sky-500/15 text-sky-400 border-sky-500/30";
  }
  if (normalized.includes("int") || normalized.includes("number")) {
    return "bg-amber-500/15 text-amber-400 border-amber-500/30";
  }
  if (normalized.includes("bool")) {
    return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
  }
  if (normalized.includes("date") || normalized.includes("time")) {
    return "bg-cyan-500/15 text-cyan-400 border-cyan-500/30";
  }
  if (normalized.includes("array") || normalized.includes("list")) {
    return "bg-pink-500/15 text-pink-400 border-pink-500/30";
  }
  return "bg-surface-3 text-muted border-border";
}

export function DatabaseStructureTable({
  fields,
}: {
  fields: DatabaseField[];
}) {
  if (fields.length === 0) {
    return (
      <div className="py-12 text-center text-xs text-muted">
        No schema fields detected for this collection.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead>
          <tr className="border-b border-border/60 text-[11px] font-semibold text-muted uppercase tracking-wider">
            <th className="py-3 pr-4 pl-2">Field Name</th>
            <th className="px-4 py-3">Type</th>
            <th className="px-4 py-3">Nullability</th>
            <th className="px-4 py-3">Unique</th>
            <th className="px-4 py-3">Indexed</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/40">
          {fields.map((field) => {
            const isPrimary = field.name === "_id";
            return (
              <tr key={field.name} className="transition-colors hover:bg-surface/40">
                <td className="py-3 pr-4 pl-2">
                  <div className="flex items-center gap-2">
                    {isPrimary ? (
                      <Key className="size-3.5 text-amber-400 shrink-0" />
                    ) : (
                      <Hash className="size-3.5 text-muted shrink-0" />
                    )}
                    <span className="font-mono font-bold text-white">{field.name}</span>
                    {isPrimary && (
                      <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-black text-amber-300">
                        PRIMARY
                      </span>
                    )}
                  </div>
                </td>

                <td className="px-4 py-3">
                  <span
                    className={`inline-block rounded-md border px-2 py-0.5 font-mono text-[10px] font-bold ${typeBadgeStyle(
                      field.type,
                    )}`}
                  >
                    {field.type}
                  </span>
                </td>

                <td className="px-4 py-3">
                  {field.required ? (
                    <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                      Required
                    </span>
                  ) : (
                    <span className="text-muted text-[11px]">Optional</span>
                  )}
                </td>

                <td className="px-4 py-3">
                  {field.unique ? (
                    <span className="inline-flex items-center gap-1 rounded bg-sky-500/10 px-2 py-0.5 text-[10px] font-bold text-sky-400">
                      <Sparkles className="size-2.5" />
                      Unique
                    </span>
                  ) : (
                    <span className="text-muted/60">—</span>
                  )}
                </td>

                <td className="px-4 py-3">
                  {field.indexed ? (
                    <span className="rounded bg-purple-500/10 px-2 py-0.5 font-mono text-[10px] font-bold text-purple-400">
                      Indexed
                    </span>
                  ) : (
                    <span className="text-muted/60">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
