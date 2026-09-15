import { ArrowRight, Paperclip, Sparkles, Square } from "lucide-react";
import { ModelSelect } from "@/features/workspace/components/ModelSelect";
import {
  PROMPT_QUALITY_LABEL,
  PROMPT_QUALITY_TONE,
  type PromptQuality,
} from "../utils/evaluatePrompt";
import { Badge } from "@/shared/components/ui/Badge";

// Cold-start prompts: the empty chat should never be a blank box.
const STARTERS = [
  { label: "Add dark mode", prompt: "Add a dark mode toggle that persists the user's choice." },
  {
    label: "Add authentication",
    prompt: "Add email and password authentication with protected routes and a sign-out action.",
  },
  {
    label: "Connect database",
    prompt: "Connect the app to a database and persist the main entity with full CRUD.",
  },
];

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
        title="Stop the current AI run"
        className="ml-auto grid size-9 cursor-pointer place-items-center rounded-xl bg-danger text-white transition-all hover:brightness-110"
      >
        <Square className="size-3.5 fill-current" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onSubmit}
      disabled={disabled}
      title="Send — Enter"
      className="ml-auto grid size-9 cursor-pointer place-items-center rounded-xl bg-lime text-background-deep transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-30"
    >
      <ArrowRight className="size-4" />
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
  onStop: () => void;
}) {
  const trimmed = input.trim();

  return (
    <div className="shrink-0 border-t border-border-soft p-3">
      <div className="rounded-2xl border border-border bg-surface-2 p-3 transition-colors focus-within:border-surface-3">
        <textarea
          rows={Math.min(6, Math.max(2, input.split("\n").length))}
          className="w-full resize-none bg-transparent text-[13px] leading-relaxed text-foreground placeholder-muted outline-none"
          placeholder={
            running
              ? "AI is working on your app… stop it anytime."
              : "Ask me to build, edit, or add a feature…"
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

        <div className="mt-2 flex flex-wrap items-center gap-2">
          {/* The model is part of the message you are about to send, so it
              belongs in the composer — not in a header two panes away. */}
          {model && <ModelSelect value={model} disabled={running} onChange={onModelChange} />}

          <button
            type="button"
            disabled
            title="Attachments land with the visual editor (V4.5)"
            className="flex cursor-not-allowed items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-foreground-secondary opacity-60"
          >
            <Paperclip className="size-3.5" /> Attach
          </button>

          <button
            type="button"
            onClick={onEnhance}
            disabled={!trimmed || isEnhancing || running}
            title="Expand this prompt into a full spec — data models, views, interactions"
            className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-foreground-secondary transition-colors hover:bg-surface-3 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Sparkles className={`size-3.5 ${isEnhancing ? "animate-pulse text-lime" : ""}`} />
            {isEnhancing ? "Enhancing…" : "Enhance Prompt"}
          </button>

          {quality && !running && (
            <Badge tone={PROMPT_QUALITY_TONE[quality]}>{PROMPT_QUALITY_LABEL[quality]}</Badge>
          )}
          {enhancedSuccess && !quality && <Badge tone="success">Enhanced</Badge>}
          {enhanceError && <span className="truncate text-[11px] text-danger">{enhanceError}</span>}

          <SubmitButton
            running={running}
            disabled={!trimmed || isEnhancing}
            onSubmit={onSubmit}
            onStop={onStop}
          />
        </div>
      </div>

      {!trimmed && !running && (
        <div className="mt-2.5 flex flex-wrap gap-2">
          {STARTERS.map((s) => (
            <button
              key={s.label}
              type="button"
              onClick={() => onChange(s.prompt)}
              className="cursor-pointer rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-xs text-foreground-secondary transition-colors hover:bg-surface-3 hover:text-foreground"
            >
              {s.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
