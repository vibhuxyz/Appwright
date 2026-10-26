interface TextAnswerStepProps {
  stepId: string;
  label: string;
  text: string;
  why?: string;
  value: string;
  isDate: boolean;
  error: string | undefined;
  onChange: (value: string) => void;
}

const MAX_ANSWER_CHARS = 1000;

export function TextAnswerStep({ stepId, label, text, why, value, isDate, error, onChange }: TextAnswerStepProps) {
  const inputId = `answer-${stepId}`;
  return (
    <div>
      <label htmlFor={inputId} className="block text-[15px] leading-snug font-medium text-foreground">
        {label} — {text}
      </label>
      {why && <p className="mt-1 text-xs text-muted">{why}</p>}
      <input
        id={inputId}
        type={isDate ? "date" : "text"}
        value={value}
        autoFocus
        maxLength={MAX_ANSWER_CHARS}
        placeholder={isDate ? "Choose a date" : "Write your answer"}
        aria-describedby={error ? `${inputId}-error` : undefined}
        onChange={(event) => onChange(event.target.value)}
        className="mt-3 block w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-foreground placeholder:text-muted focus-visible:outline-2 focus-visible:outline-lime"
      />
      {error && <p id={`${inputId}-error`} role="alert" className="mt-2 text-xs text-danger">{error}</p>}
    </div>
  );
}
