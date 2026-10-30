import { useState } from "react";
import { ChevronDown, ChevronUp, Wrench } from "lucide-react";
import type { Msg } from "../schemas/agentSchemas";

const VERIFICATION_PREFIX = "Verification failed, retrying:";

export function retryLabel(content: string): string {
  if (!content.startsWith(VERIFICATION_PREFIX)) return "An automated check asked for a fix";
  const issues = content.slice(VERIFICATION_PREFIX.length).split("\n").filter((line) => line.trim().length > 0);
  return `Checks found ${issues.length} ${issues.length === 1 ? "issue" : "issues"}: the agent is fixing them`;
}

export function RetryNotice({ msg }: { msg: Msg }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="self-stretch rounded-lg border border-border-soft bg-surface-2 px-3 py-2 text-[12px] text-foreground-secondary">
      <button type="button" onClick={() => setIsOpen((open) => !open)} className="flex w-full cursor-pointer items-center gap-2 text-left">
        <Wrench className="size-3.5 shrink-0" />
        <span className="flex-1">{retryLabel(msg.content)}</span>
        {isOpen ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
      </button>
      {isOpen && <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap break-words font-mono text-[11px]">{msg.content}</pre>}
    </div>
  );
}
