import { AudioLines, Play, Plus, Sparkles, Square } from "lucide-react";
import { ModelSelect } from "@/features/workspace/components/ModelSelect";
import {
  PROMPT_QUALITY_LABEL,
  PROMPT_QUALITY_TONE,
  type PromptQuality,
} from "../utils/evaluatePrompt";
import { Badge } from "@/shared/components/ui/Badge";
import { ChatTipsHeader } from "./ChatTipsHeader";

function SubmitButton({
  running,
  disabled,
  onSubmit,
  onStop,
}: {
  running: boolean;
  disabled: boolean;
  onSubmit: () => void;
  onStop: () => void;
}) {
  if (running) {
    return (
      <button
        type="button"
        onClick={onStop}
        title="Stop AI execution"
        className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-[#E3FC18] px-3.5 py-1.5 text-xs font-semibold text-background transition-all hover:brightness-105 active:scale-95"
      >
        <Square className="size-3 fill-current" />
        <span>Stop</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onSubmit}
      disabled={disabled}
      title="Send — Enter"
      className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-[#C16848] px-3.5 py-1.5 text-xs font-medium text-white shadow-sm transition-all hover:bg-[#D27655] disabled:cursor-not-allowed disabled:opacity-40"
    >
      <Play className="size-3 fill-current" />
      <span>Send</span>
    </button>
  );
}

export function ChatInput({
  input,
  running,
  isEnhancing,
  enhancedSuccess,
  enhanceError,
  quality,
  model,
  onModelChange,
  onChange,
  onSubmit,
  onEnhance,
  onStopEnhance,
  onStop,
}: {
  input: string;
  running: boolean;
  isEnhancing: boolean;
  enhancedSuccess: boolean;
  enhanceError: string | null;
  quality: PromptQuality;
  model: string | undefined;
  onModelChange: (model: string) => void;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onEnhance: () => void;
  onStopEnhance: () => void;
  onStop: () => void;
}) {
  const trimmed = input.trim();

  return (
    <div className="shrink-0 border-t border-border-soft p-3">
      <div className="flex flex-col gap-2.5 rounded-2xl border border-border bg-surface-2 p-3 transition-colors focus-within:border-surface-3">
        {/* Top header row: Tips with highlighted colors & Enhance icon (no popover) */}
        <ChatTipsHeader
          onEnhanceSpec={onEnhance}
          onStopEnhance={onStopEnhance}
          isEnhancing={isEnhancing}
          hasInput={Boolean(trimmed)}
          quality={quality}
        />

        {/* Textarea or Animated Enhancing Prompt Display */}
        {isEnhancing ? (
          <div className="relative max-h-56 min-h-18 w-full overflow-y-auto rounded-xl border border-lime/30 bg-lime/5 p-2.5 select-none">
            <div className="pointer-events-none absolute -inset-1 rounded-xl bg-linear-to-r from-lime/15 via-purple-500/10 to-cyan-500/15 blur-sm" />
            <div className="relative z-10 animate-text-shimmer bg-[linear-gradient(90deg,#e3fc18,#f59e0b,#ec4899,#06b6d4,#e3fc18)] bg-size-[250%_auto] bg-clip-text text-[13px] leading-relaxed font-medium text-transparent select-text">
              {input}
            </div>
            <div className="relative z-10 mt-2 flex items-center gap-2 text-[11px] font-medium text-lime">
              <Sparkles className="size-3.5 animate-spin" />
              <span className="animate-pulse">Improving your prompt…</span>
            </div>
          </div>
        ) : (
          <textarea
            rows={Math.min(9, Math.max(3, input.split("\n").length))}
            className="max-h-56 min-h-18 w-full resize-none overflow-y-auto bg-transparent text-[13px] leading-relaxed text-foreground placeholder-muted outline-none"
            placeholder={
              running
                ? "AI is working on your app… stop it anytime."
                : "Describe what you want to create…"
            }
            value={input}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onSubmit();
              }
            }}
          />
        )}

        {/* Bottom controls row */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border-soft/40 pt-2">
          {/* Left tools */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled
              title="Add attachment (coming in next update)"
              className="grid size-7 cursor-not-allowed place-items-center rounded-lg border border-border-soft bg-surface text-muted opacity-60"
            >
              <Plus className="size-3.5" />
            </button>

            <button
              type="button"
              disabled
              title="Voice prompt"
              className="grid size-7 cursor-not-allowed place-items-center rounded-lg border border-border-soft bg-surface text-muted opacity-60"
            >
              <AudioLines className="size-3.5" />
            </button>

            {quality && !running && (
              <Badge tone={PROMPT_QUALITY_TONE[quality]}>{PROMPT_QUALITY_LABEL[quality]}</Badge>
            )}
            {enhancedSuccess && !quality && <Badge tone="success">Enhanced</Badge>}
            {enhanceError && <span className="truncate text-[11px] text-danger">{enhanceError}</span>}
          </div>

          {/* Right model selector & Send button */}
          <div className="flex items-center gap-2">
            {model && <ModelSelect value={model} disabled={running} onChange={onModelChange} />}

            <SubmitButton
              running={running}
              disabled={!trimmed || isEnhancing || !model}
              onSubmit={onSubmit}
              onStop={onStop}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
