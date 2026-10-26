import { Plus } from "lucide-react";

export function NewChatButton({ isBusy, onNewChat }: { isBusy: boolean; onNewChat: () => void }) {
  return (
    <button
      type="button"
      onClick={onNewChat}
      disabled={isBusy}
      className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border border-border-soft bg-surface px-3 py-1.5 text-[13px] text-foreground-secondary transition-colors hover:bg-surface-3 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
    >
      <Plus aria-hidden="true" className="size-3.5" /> New chat
    </button>
  );
}
