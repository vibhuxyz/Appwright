import { Check, RefreshCw, Send } from "lucide-react";

interface EmailCardActionsProps {
  lastTestedAt: string | null;
  isSaving: boolean;
  isTesting: boolean;
  onSave: () => void;
  onTest: () => void;
  onOpenTestModal: () => void;
}

export function EmailCardActions({
  lastTestedAt,
  isSaving,
  isTesting,
  onSave,
  onTest,
  onOpenTestModal,
}: EmailCardActionsProps) {
  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-zinc-800/60 pt-3">
      <span className="text-[11px] text-zinc-500">
        {lastTestedAt
          ? `Tested: ${new Date(lastTestedAt).toLocaleTimeString()}`
          : "Not yet tested"}
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onSave}
          disabled={isSaving}
          className="flex items-center gap-1.5 rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-700"
        >
          <Check className="size-3.5" />
          <span>Save Configuration</span>
        </button>
        <button
          type="button"
          onClick={onTest}
          disabled={isTesting}
          className="flex items-center gap-1.5 rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:text-white"
        >
          <RefreshCw className={`size-3.5 ${isTesting ? "animate-spin" : ""}`} />
          <span>Test Connection</span>
        </button>
        <button
          type="button"
          onClick={onOpenTestModal}
          className="flex items-center gap-1.5 rounded-lg bg-emerald-600/90 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500"
        >
          <Send className="size-3.5" />
          <span>Send Test Email</span>
        </button>
      </div>
    </div>
  );
}
