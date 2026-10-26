import { AudioLines, Paperclip } from "lucide-react";
import { ModelSelect } from "@/features/workspace/components/ModelSelect";
import {
  PROMPT_QUALITY_LABEL,
  PROMPT_QUALITY_TONE,
  type PromptQuality,
} from "../utils/evaluatePrompt";
import { Badge } from "@/shared/components/ui/Badge";
import { SubmitButton } from "./SubmitButton";

export function ChatInputControls({
  running,
  canSubmit,
  quality,
  enhancedSuccess,
  enhanceError,
  model,
  onAttachClick,
  onModelChange,
  onSubmit,
  onStop,
}: {
  running: boolean;
  canSubmit: boolean;
  quality: PromptQuality;
  enhancedSuccess: boolean;
  enhanceError: string | null;
  model: string | undefined;
  onAttachClick: () => void;
  onModelChange: (model: string) => void;
  onSubmit: () => void;
  onStop: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border-soft/40 pt-2">
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={onAttachClick}
          title="Add reference image or PDF document"
          className="grid size-7 cursor-pointer place-items-center rounded-lg border border-border-soft bg-surface text-muted transition-colors hover:border-[#E3FC18]/60 hover:text-foreground active:scale-95"
        >
          <Paperclip className="size-3.5" />
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

      <div className="flex items-center gap-2">
        {model && <ModelSelect value={model} disabled={running} onChange={onModelChange} />}

        <SubmitButton
          running={running}
          disabled={!canSubmit}
          onSubmit={onSubmit}
          onStop={onStop}
        />
      </div>
    </div>
  );
}
