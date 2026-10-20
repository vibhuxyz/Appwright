import { useState, type FormEvent } from "react";
import { Button } from "@/shared/components/ui/Button";

interface AnswerControlsProps {
  options: readonly string[];
  suggestion: string;
  isSubmitting: boolean;
  onAnswer: (value: string) => void;
  onSkip: () => void;
  onSkipRest: () => void;
}

export function AnswerControls({
  options,
  suggestion,
  isSubmitting,
  onAnswer,
  onSkip,
  onSkipRest,
}: AnswerControlsProps) {
  const [draft, setDraft] = useState("");

  const sendDraft = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = draft.trim();
    if (trimmed.length === 0) return;
    onAnswer(trimmed);
  };

  return (
    <div className="flex flex-col gap-2 border-t border-border-soft p-3">
      <div className="flex flex-wrap items-center gap-2">
        {options.map((option) => (
          <Button
            key={option}
            type="button"
            variant="secondary"
            size="sm"
            disabled={isSubmitting}
            onClick={() => onAnswer(option)}
          >
            {option}
          </Button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isSubmitting}
          onClick={() => setDraft(suggestion)}
        >
          Help me answer
        </Button>
        <Button type="button" variant="outline" size="sm" disabled={isSubmitting} onClick={onSkip}>
          Skip question
        </Button>
        <Button type="button" variant="ghost" size="sm" disabled={isSubmitting} onClick={onSkipRest}>
          End chat
        </Button>
      </div>
      <form className="flex items-center gap-2" onSubmit={sendDraft}>
        <label className="sr-only" htmlFor="question-answer">
          Write your answer
        </label>
        <input
          id="question-answer"
          value={draft}
          disabled={isSubmitting}
          placeholder="Write your answer"
          onChange={(event) => setDraft(event.target.value)}
          className="min-w-0 flex-1 rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted"
        />
        <Button type="submit" size="sm" disabled={isSubmitting || draft.trim().length === 0}>
          Send
        </Button>
      </form>
    </div>
  );
}
