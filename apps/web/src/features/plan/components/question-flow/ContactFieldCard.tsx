import { ContactFieldIcon } from "./ContactFieldIcon";
import type { ContactFieldConfig } from "./contact-field-config";

interface ContactFieldCardProps {
  field: ContactFieldConfig;
  value: string;
  isSubmitting: boolean;
  onChange: (value: string) => void;
}

export function ContactFieldCard({ field, value, isSubmitting, onChange }: ContactFieldCardProps) {
  const inputId = `contact-field-${field.label.toLowerCase()}`;
  return (
    <div className="flex flex-col gap-1.5 rounded-xl border border-border bg-surface-2 p-3">
      <div className="flex items-center gap-2">
        <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-lime/15 text-lime">
          <ContactFieldIcon name={field.label} className="size-4" />
        </span>
        <label htmlFor={inputId} className="text-sm font-medium text-foreground">
          {field.label}
          <span className="ml-1 text-xs font-normal text-muted">
            {field.required ? "required" : "optional"}
          </span>
        </label>
      </div>
      <input
        id={inputId}
        type={field.type}
        value={value}
        required={field.required}
        disabled={isSubmitting}
        placeholder={field.placeholder}
        autoComplete={field.autoComplete}
        inputMode={field.inputMode}
        spellCheck={field.type === "text"}
        onChange={(event) => onChange(event.target.value)}
        className="min-w-0 rounded-lg border border-border-soft bg-background px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted"
      />
    </div>
  );
}
