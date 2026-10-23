import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";

const MAX_PROMPT_CHARS = 500;

interface GeneratePromptEditorProps {
  inputId: string;
  initialPrompt: string;
  isPending: boolean;
  onGenerate: (prompt: string) => void;
}

export function GeneratePromptEditor({
  inputId,
  initialPrompt,
  isPending,
  onGenerate,
}: GeneratePromptEditorProps) {
  const [prompt, setPrompt] = useState(initialPrompt);

  return (
    <div className="mt-2.5 rounded-lg border border-border-soft bg-surface-3 p-2.5">
      <label htmlFor={inputId} className="text-[11px] font-medium text-foreground-secondary">
        Prompt for the AI image
      </label>
      <textarea
        id={inputId}
        value={prompt}
        maxLength={MAX_PROMPT_CHARS}
        onChange={(event) => setPrompt(event.target.value)}
        rows={3}
        className="mt-1 w-full resize-none rounded-md border border-border-soft bg-surface-2 p-2 text-xs text-foreground outline-none focus:border-primary"
      />
      <button
        type="button"
        disabled={isPending || prompt.trim().length === 0}
        onClick={() => onGenerate(prompt.trim())}
        className="mt-2 flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
      >
        {isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
        <span>Generate</span>
      </button>
    </div>
  );
}
