import { useState, type FormEvent, type HTMLInputTypeAttribute } from "react";
import { Button } from "@/shared/components/ui/Button";
import { ContactFields } from "./ContactFields";
import { ImageSectionDropzones } from "./ImageSectionDropzones";

interface TextFieldUi {
  placeholder: string;
  type: HTMLInputTypeAttribute;
  autoComplete: string;
  inputMode?: "text" | "email" | "tel" | "url";
}

const TEXT_FIELDS: Readonly<Record<string, TextFieldUi>> = {
  "business-name": {
    placeholder: "The name customers will see",
    type: "text",
    autoComplete: "organization",
  },
};

interface AnswerControlsProps {
  need: string;
  options: readonly string[];
  suggestion: string;
  inputType?: "single" | "multiple" | "short-text" | "date" | "images" | "contacts";
  importance?: "required" | "optional";
  isSubmitting: boolean;
  onAnswer: (value: string) => void;
  onSkip?: () => void;
  onSkipRest?: () => void;
  prefill?: Readonly<Record<string, string>>;
}

export function AnswerControls({
  need,
  options,
  suggestion,
  inputType = "single",
  importance = "required",
  isSubmitting,
  onAnswer,
  onSkip,
  onSkipRest,
  prefill,
}: AnswerControlsProps) {
  const [draft, setDraft] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const isChoice = inputType === "single" || inputType === "multiple";
  const isRequired =
    importance === "required" &&
    (inputType === "short-text" || inputType === "images" || inputType === "contacts");
  const field = TEXT_FIELDS[need];
  const inputKind = inputType === "date" ? "date" : (field?.type ?? "text");
  const placeholder =
    field?.placeholder ?? (inputType === "date" ? "Choose a date" : "Write your answer");

  if (inputType === "images") {
    return (
      <ImageSectionDropzones
        sections={options}
        isSubmitting={isSubmitting}
        onContinue={onAnswer}
      />
    );
  }

  if (inputType === "contacts" || need === "business-contacts") {
    return (
      <ContactFields
        fields={options}
        prefill={prefill}
        isSubmitting={isSubmitting}
        onContinue={onAnswer}
      />
    );
  }

  const sendDraft = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (inputType === "multiple") {
      if (selected.length === 0) return;
      onAnswer(selected.join(", "));
      return;
    }
    const trimmed = draft.trim();
    if (trimmed.length === 0) return;
    onAnswer(trimmed);
  };

  return (
    <div className="flex flex-col gap-2 border-t border-border-soft p-3">
      {isChoice && (
        <div className="flex flex-wrap items-center gap-2">
          {options.map((option) => {
            const isSelected = inputType === "multiple" && selected.includes(option);
            return (
              <Button
                key={option}
                type="button"
                variant={isSelected ? "primary" : "secondary"}
                size="sm"
                disabled={isSubmitting}
                aria-pressed={inputType === "multiple" ? isSelected : undefined}
                onClick={() => {
                  if (inputType === "multiple") {
                    setSelected((current) =>
                      current.includes(option)
                        ? current.filter((item) => item !== option)
                        : [...current, option],
                    );
                    return;
                  }
                  onAnswer(option);
                }}
              >
                {option}
              </Button>
            );
          })}
        </div>
      )}
      {(suggestion && isChoice) || (onSkip && !isRequired) || onSkipRest ? (
        <div className="flex flex-wrap items-center gap-2">
          {suggestion && isChoice && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isSubmitting}
              onClick={() => {
                if (inputType === "multiple") setSelected(suggestion.split(", ").filter(Boolean));
                else setDraft(suggestion);
              }}
            >
              Help me answer
            </Button>
          )}
          {onSkip && !isRequired && (
            <Button type="button" variant="outline" size="sm" disabled={isSubmitting} onClick={onSkip}>
              Skip question
            </Button>
          )}
          {onSkipRest && (
            <Button type="button" variant="ghost" size="sm" disabled={isSubmitting} onClick={onSkipRest}>
              Skip remaining
            </Button>
          )}
        </div>
      ) : null}
      <form className="flex items-center gap-2" onSubmit={sendDraft}>
        <label className="sr-only" htmlFor="question-answer">
          {placeholder}
        </label>
        {inputType !== "multiple" && (
          <input
            id="question-answer"
            type={inputKind}
            value={draft}
            required={isRequired}
            disabled={isSubmitting}
            placeholder={placeholder}
            autoComplete={field?.autoComplete ?? "off"}
            inputMode={field?.inputMode}
            spellCheck={inputKind === "text"}
            onChange={(event) => setDraft(event.target.value)}
            className="min-w-0 flex-1 rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted"
          />
        )}
        <Button
          type="submit"
          size="sm"
          disabled={
            isSubmitting ||
            (inputType === "multiple" ? selected.length === 0 : draft.trim().length === 0)
          }
        >
          Send
        </Button>
      </form>
    </div>
  );
}
