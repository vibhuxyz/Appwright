import { Sparkles } from "lucide-react";
import type { VerificationResult } from "@repo/contracts";
import type { Msg } from "../schemas/agentSchemas";
import { VerificationStatusBar } from "./VerificationStatusBar";

export function AgentMessageItem({
  msg,
  isStreaming = false,
}: {
  msg?: Msg;
  content?: string;
  isStreaming?: boolean;
}) {
  const text = msg?.content ?? "";
  const verification = (msg?.data as { verification?: VerificationResult[] } | null)?.verification;

  return (
    <div className="flex w-full flex-col items-start gap-1.5 self-start">
      <div className="flex items-center gap-2 text-[11px] font-medium text-muted">
        <div className="grid size-5.5 place-items-center rounded-lg border border-pink-500/30 bg-pink-500/10 text-pink-400 shadow-xs">
          <Sparkles className="size-3 text-pink-400" />
        </div>
        <span className="font-bold text-white">Appwright AI</span>
        <span className="rounded-full border border-pink-500/20 bg-pink-500/10 px-2 py-0.5 text-[10px] font-semibold text-pink-400">
          Agent
        </span>
      </div>
      <div className="w-full rounded-2xl border border-[#23262D] bg-[#111317] p-4 text-[13px] leading-relaxed whitespace-pre-wrap text-foreground-secondary shadow-xs">
        {text}
        {isStreaming && (
          <span className="ml-1 inline-block h-3.5 w-1.5 animate-pulse bg-lime align-middle" />
        )}
        {verification && Array.isArray(verification) && (
          <VerificationStatusBar results={verification} />
        )}
      </div>
    </div>
  );
}
