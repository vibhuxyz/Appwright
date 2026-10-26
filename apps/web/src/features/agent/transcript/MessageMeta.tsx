import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";
import { formatDateTime } from "@/shared/lib/formatters";

const COPIED_RESET_MS = 1500;

export function MessageMeta({ createdAt, copyText }: { createdAt: string; copyText: string }) {
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (!isCopied) return;
    const timer = window.setTimeout(() => setIsCopied(false), COPIED_RESET_MS);
    return () => window.clearTimeout(timer);
  }, [isCopied]);

  const copy = () => {
    void navigator.clipboard.writeText(copyText).then(() => setIsCopied(true), () => setIsCopied(false));
  };

  return (
    <div className="flex items-center justify-end gap-2 text-[11px] text-muted">
      {createdAt && <time dateTime={createdAt}>{formatDateTime(createdAt)}</time>}
      <button
        type="button"
        onClick={copy}
        aria-label={isCopied ? "Copied" : "Copy message"}
        className="grid size-6 cursor-pointer place-items-center rounded-md transition-colors hover:bg-surface-3 hover:text-foreground"
      >
        {isCopied ? <Check aria-hidden="true" className="size-3.5" /> : <Copy aria-hidden="true" className="size-3.5" />}
      </button>
    </div>
  );
}
