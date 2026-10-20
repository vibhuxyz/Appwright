import { Plus, Sparkles } from "lucide-react";
import { Badge } from "@/shared/components/ui/Badge";

export function ChatPaneHeader({ isBusy, onNewChat }: { isBusy: boolean; onNewChat: () => void }) {
  return (
    <header className="shrink-0 border-b border-border-soft px-4 pt-4 pb-3.5">
      <div className="flex items-center gap-2.5">
        <Sparkles className="size-5 text-pink-light" />
        <span className="text-[15px] font-semibold text-foreground">Appwright AI</span>
        <Badge tone="premium">Beta</Badge>
        <button
          type="button"
          onClick={onNewChat}
          disabled={isBusy}
          className="ml-auto flex cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-[13px] text-foreground-secondary transition-colors hover:bg-surface-3 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Plus className="size-3.5" /> New Chat
        </button>
      </div>
      <p className="mt-2 truncate text-[13px] text-muted">Build, edit, and improve your app with AI.</p>
    </header>
  );
}
