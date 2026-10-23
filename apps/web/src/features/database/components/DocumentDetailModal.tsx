import { useState } from "react";
import { Check, Copy, X } from "lucide-react";

export function DocumentDetailModal({
  document,
  onClose,
}: {
  document: Record<string, unknown> | null;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  if (!document) return null;

  const formatted = JSON.stringify(document, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(formatted);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
      <div className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-2xl border border-border bg-[#121622] p-5 shadow-2xl">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <div className="flex items-center gap-2">
            <h3 className="font-mono text-sm font-bold text-white">Record Inspector</h3>
            {typeof document._id === "string" && (
              <span className="rounded bg-surface-2 px-2 py-0.5 font-mono text-[10px] text-muted">
                {document._id}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1 rounded-lg border border-border/80 bg-surface px-2.5 py-1 text-xs text-foreground transition-colors hover:bg-surface-2"
            >
              {copied ? <Check className="size-3.5 text-lime" /> : <Copy className="size-3.5" />}
              <span>{copied ? "Copied" : "Copy JSON"}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1 text-muted hover:bg-surface hover:text-foreground"
              aria-label="Close record inspector"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        <div className="mt-3 flex-1 overflow-auto rounded-xl border border-border/60 bg-[#0A0D14] p-4">
          <pre className="font-mono text-xs text-emerald-400 select-all">
            {formatted}
          </pre>
        </div>
      </div>
    </div>
  );
}
