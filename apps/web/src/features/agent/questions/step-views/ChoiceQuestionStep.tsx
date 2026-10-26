import { EMPTY_CHOICE_DRAFT, toggleOption, toggleOther } from "../steps";
import type { ChoiceDraft } from "../types";

const MAX_OTHER_TEXT_CHARS = 500;

interface ChoiceQuestionStepProps {
  stepId: string;
  label: string;
  text: string;
  options: readonly string[];
  isMultiple: boolean;
  draft: ChoiceDraft | undefined;
  error: string | undefined;
  otherLabel?: string;
  maxOtherChars?: number;
  onChange: (draft: ChoiceDraft) => void;
}

const OPTION_CLASS = "flex cursor-pointer items-center gap-3 rounded-lg px-1 py-1.5 text-sm text-foreground-secondary transition-colors hover:text-foreground";

export function ChoiceQuestionStep({
  stepId,
  label,
  text,
  options,
  isMultiple,
  draft = EMPTY_CHOICE_DRAFT,
  error,
  otherLabel = "Something else",
  maxOtherChars = MAX_OTHER_TEXT_CHARS,
  onChange,
}: ChoiceQuestionStepProps) {
  const inputType = isMultiple ? "multiple" : "single";
  const groupName = `choice-${stepId}`;
  return (
    <fieldset aria-describedby={error ? `${groupName}-error` : undefined}>
      <legend className="text-[15px] leading-snug font-medium text-foreground">{label} — {text}</legend>
      <div className="mt-3 space-y-0.5">
        {options.map((option, index) => (
          <label key={`${index}-${option}`} className={OPTION_CLASS}>
            <input
              type={isMultiple ? "checkbox" : "radio"}
              name={groupName}
              checked={draft.selectedOptionIndexes.includes(index)}
              onChange={() => onChange(toggleOption(draft, index, inputType))}
              className="size-4 accent-info"
            />
            {option}
          </label>
        ))}
        <label className={OPTION_CLASS}>
          <input
            type={isMultiple ? "checkbox" : "radio"}
            name={groupName}
            checked={draft.isOtherSelected}
            onChange={() => onChange(toggleOther(draft, inputType))}
            className="size-4 accent-info"
          />
          <span className="text-muted">{otherLabel}</span>
        </label>
        {draft.isOtherSelected && (
          <input
            type="text"
            value={draft.otherText}
            autoFocus
            maxLength={maxOtherChars}
            aria-label="Your own answer"
            placeholder="Type your answer"
            onChange={(event) => onChange({ ...draft, otherText: event.target.value })}
            className="mt-1 block w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-foreground placeholder:text-muted focus-visible:outline-2 focus-visible:outline-lime"
          />
        )}
      </div>
      {error && <p id={`${groupName}-error`} role="alert" className="mt-2 text-xs text-danger">{error}</p>}
    </fieldset>
  );
}
