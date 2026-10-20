import { X } from "lucide-react";
import { describeSelection } from "../lib/inspector-protocol";
import { useSelectionStore } from "../store/selection-store";

export function SelectionChip() {
  const selection = useSelectionStore((s) => s.selection);
  const clearSelection = useSelectionStore((s) => s.clearSelection);
  if (selection === null) return null;
  return (
    <div className="mx-4 mb-2 flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-3 py-1.5 text-[12px] text-foreground">
      <span className="truncate">
        Editing <strong className="font-medium">{describeSelection(selection)}</strong> on{" "}
        <code>{selection.route || "/"}</code>
      </span>
      <button
        type="button"
        aria-label="Clear selected element"
        onClick={clearSelection}
        className="ml-auto grid size-5 shrink-0 cursor-pointer place-items-center rounded text-muted hover:text-foreground"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}
