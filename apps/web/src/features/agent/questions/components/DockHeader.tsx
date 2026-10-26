import { HelpCircle, X } from "lucide-react";

export function DockHeader({ onMinimize }: { onMinimize: () => void }) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5">
      <h2 className="flex items-center gap-2 text-sm font-medium text-info">
        <HelpCircle aria-hidden="true" className="size-4.5" />
        Agent has questions for you
      </h2>
      <button
        type="button"
        onClick={onMinimize}
        aria-label="Minimize the questions"
        title="Minimize"
        className="grid size-7 cursor-pointer place-items-center rounded-lg text-muted transition-colors hover:bg-surface-3 hover:text-foreground"
      >
        <X aria-hidden="true" className="size-4" />
      </button>
    </div>
  );
}
