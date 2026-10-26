import type { ReactNode } from "react";
import { Bot } from "lucide-react";
import { MessageText } from "./message-text";
import { MessageMeta } from "./MessageMeta";

interface AgentBlockProps {
  text: string | null;
  isStreaming?: boolean;
  meta?: { createdAt: string } | null;
  children?: ReactNode;
}

export function AgentBlock({ text, isStreaming = false, meta = null, children }: AgentBlockProps) {
  return (
    <div className="flex w-full items-start gap-3 self-start">
      <div aria-hidden="true" className="grid size-8 shrink-0 place-items-center rounded-lg border border-border-soft bg-surface-2 text-foreground-secondary">
        <Bot className="size-4" />
      </div>
      <div className="min-w-0 flex-1 space-y-2.5 pt-1">
        {text !== null && <MessageText text={text} isStreaming={isStreaming} />}
        {children}
        {meta && text && <MessageMeta createdAt={meta.createdAt} copyText={text} />}
      </div>
    </div>
  );
}
