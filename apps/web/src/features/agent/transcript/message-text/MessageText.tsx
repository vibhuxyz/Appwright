import { Fragment } from "react";
import { cn } from "@/shared/lib/cn";
import { parseMessageBlocks, type InlineSegment, type MessageBlock } from "./parse-message-blocks";

const HEADING_CLASS: Record<1 | 2 | 3, string> = {
  1: "text-lg font-semibold text-foreground",
  2: "text-base font-semibold text-foreground",
  3: "text-sm font-semibold text-foreground",
};

function Segments({ segments }: { segments: readonly InlineSegment[] }) {
  return segments.map((segment, index) => {
    const key = `${index}-${segment.kind}`;
    if (segment.kind === "code") {
      return <code key={key} className="rounded-md border border-border-soft bg-surface-2 px-1.5 py-0.5 font-mono text-[12px] text-foreground">{segment.text}</code>;
    }
    if (segment.kind === "bold") return <strong key={key} className="font-semibold text-foreground">{segment.text}</strong>;
    return <Fragment key={key}>{segment.text}</Fragment>;
  });
}

function BlockView({ block }: { block: MessageBlock }) {
  if (block.kind === "heading") {
    return <p className={HEADING_CLASS[block.level]}><Segments segments={block.segments} /></p>;
  }
  if (block.kind === "list") {
    return (
      <ul className="ml-5 list-disc space-y-1 marker:text-muted">
        {block.items.map((segments, index) => (
          <li key={`${index}-${segments.length}`} className="pl-1"><Segments segments={segments} /></li>
        ))}
      </ul>
    );
  }
  return <p className="whitespace-pre-wrap"><Segments segments={block.segments} /></p>;
}

export function MessageText({ text, isStreaming = false, className }: { text: string; isStreaming?: boolean; className?: string }) {
  const blocks = parseMessageBlocks(text);
  return (
    <div className={cn("space-y-2 text-[14px] leading-relaxed text-foreground-secondary", className)}>
      {blocks.map((block, index) => <BlockView key={`${index}-${block.kind}`} block={block} />)}
      {isStreaming && <span aria-hidden="true" className="inline-block h-3.5 w-1.5 animate-pulse bg-lime align-middle" />}
    </div>
  );
}
