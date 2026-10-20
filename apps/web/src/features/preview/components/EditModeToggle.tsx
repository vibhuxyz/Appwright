import { MousePointerClick } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { useSelectionStore } from "../store/selection-store";

export function EditModeToggle({ disabled }: { disabled: boolean }) {
  const isEditMode = useSelectionStore((s) => s.isEditMode);
  const setEditMode = useSelectionStore((s) => s.setEditMode);
  return (
    <button
      type="button"
      aria-pressed={isEditMode}
      aria-label="Select an element to edit"
      title="Select an element in the preview, then describe the change in chat"
      disabled={disabled}
      onClick={() => setEditMode(!isEditMode)}
      className={cn(
        "flex h-8 cursor-pointer items-center gap-1.5 rounded-lg px-2.5 text-[12px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40",
        isEditMode
          ? "bg-primary/15 text-primary"
          : "text-muted hover:bg-surface-2 hover:text-foreground",
      )}
    >
      <MousePointerClick className="size-4" />
      Edit
    </button>
  );
}
