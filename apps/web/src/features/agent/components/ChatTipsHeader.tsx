import { useState, useEffect } from "react";
import { Sparkles, ChevronDown } from "lucide-react";
import type { PromptQuality } from "../utils/evaluatePrompt";

interface TipItem {
  prefix: string;
  highlight: string;
  suffix: string;
  color: string;
}

const HIGHLIGHTED_TIPS: TipItem[] = [
  {
    prefix: "Tip: Press ",
    highlight: "Enter",
    suffix: " to send, Shift + Enter for new line",
    color: "text-lime",
  },
  {
    prefix: "Tip: Click ",
    highlight: "✨ Enhance",
    suffix: " to generate a complete component spec",
    color: "text-[#E3FC18]",
  },
  {
    prefix: "Tip: Be specific with ",
    highlight: "Tailwind UI & state models",
    suffix: " for best output",
    color: "text-cyan-400",
  },
  {
    prefix: "Tip: Ask AI to ",
    highlight: "refactor code",
    suffix: " or add interactive animations",
    color: "text-pink-400",
  },
  {
    prefix: "Tip: Request ",
    highlight: "REST API endpoints",
    suffix: " with full CRUD & schema validation",
    color: "text-amber-400",
  },
];

export function ChatTipsHeader({
  onEnhanceSpec,
  isEnhancing,
  hasInput,
  quality,
}: {
  onEnhanceSpec?: () => void;
  isEnhancing?: boolean;
  hasInput?: boolean;
  quality?: PromptQuality;
}) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % HIGHLIGHTED_TIPS.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const current = HIGHLIGHTED_TIPS[index];
  const isEnhancementNeeded = quality === "needs_detail" && Boolean(hasInput);

  return (
    <div className="flex items-center justify-between border-b border-border-soft/60 pb-2 text-xs">
      {/* Left cycling tip */}
      <button
        type="button"
        onClick={() => setIndex((i) => (i + 1) % HIGHLIGHTED_TIPS.length)}
        title="Click to cycle next tip"
        className="group flex cursor-pointer items-center gap-1.5 text-left text-muted transition-colors hover:text-foreground"
      >
        <Sparkles className="size-3.5 shrink-0 text-lime transition-transform group-hover:scale-110" />
        <span className="truncate">
          <span>{current.prefix}</span>
          <span className={`font-semibold ${current.color}`}>{current.highlight}</span>
          <span>{current.suffix}</span>
        </span>
        <ChevronDown className="size-3 shrink-0 opacity-60 transition-opacity group-hover:opacity-100" />
      </button>

      {/* Right side Highlighted Enhance Icon Button (no popover blocking clicks) */}
      <div className="ml-2 shrink-0">
        <button
          type="button"
          disabled={!hasInput || isEnhancing}
          onClick={onEnhanceSpec}
          title={
            isEnhancing
              ? "Enhancing prompt with AI…"
              : hasInput
                ? "Click to enhance prompt with AI specification"
                : "Type a prompt to enhance"
          }
          className={`group relative flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
            isEnhancing
              ? "cursor-wait border border-lime/50 bg-lime/15 text-lime"
              : hasInput
                ? "border border-lime/50 bg-lime/10 text-lime shadow-xs shadow-lime/20 hover:scale-105 hover:border-lime hover:bg-lime/20 active:scale-95"
                : "cursor-not-allowed border border-transparent text-muted/40 opacity-40"
          }`}
        >
          <Sparkles
            className={`size-3.5 transition-transform ${
              isEnhancing
                ? "animate-spin text-lime"
                : hasInput
                  ? "text-lime drop-shadow-[0_0_6px_rgba(227,252,24,0.6)] group-hover:scale-110"
                  : "text-muted"
            }`}
          />
          {hasInput && (
            <span className="text-[11px] font-semibold text-lime">
              {isEnhancing ? "Enhancing…" : "Enhance"}
            </span>
          )}
          {isEnhancementNeeded && !isEnhancing && (
            <span className="absolute -top-1 -right-1 size-2 animate-pulse rounded-full bg-lime ring-2 ring-surface-2" />
          )}
        </button>
      </div>
    </div>
  );
}
