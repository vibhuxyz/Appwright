import type { IntegrationField } from "@repo/contracts";
import type { CredentialCopy } from "./credential-copy";
import { credentialFieldErrorKey, type CredentialDraft, type CredentialScope } from "./types";

interface CredentialFieldInputProps {
  field: IntegrationField;
  copy: CredentialCopy;
  draft: CredentialDraft;
  errors: Readonly<Record<string, string>>;
  onChange: (draft: CredentialDraft) => void;
}

interface ScopedInputProps {
  field: IntegrationField;
  scope: CredentialScope;
  label: string;
  value: string;
  error: string | undefined;
  onValueChange: (value: string) => void;
}

function ScopedInput({ field, scope, label, value, error, onValueChange }: ScopedInputProps) {
  const inputId = `credential-${scope}-${field.key}`;
  return (
    <div className="space-y-1">
      <label htmlFor={inputId} className="block text-xs font-medium text-foreground-secondary">{label}</label>
      <input
        id={inputId}
        type={field.inputType}
        value={value}
        autoComplete="off"
        placeholder={field.placeholder}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${inputId}-error` : undefined}
        onChange={(event) => onValueChange(event.target.value)}
        className="block w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-foreground placeholder:text-muted focus-visible:outline-2 focus-visible:outline-lime"
      />
      {error && <p id={`${inputId}-error`} role="alert" className="text-xs text-danger">{error}</p>}
    </div>
  );
}

export function CredentialFieldInput({ field, copy, draft, errors, onChange }: CredentialFieldInputProps) {
  const setValue = (scope: CredentialScope, value: string) => {
    const valuesKey = scope === "primary" ? "primaryValues" : "productionValues";
    onChange({ ...draft, [valuesKey]: { ...draft[valuesKey], [field.key]: value } });
  };

  return (
    <div className="space-y-3">
      <ScopedInput
        field={field}
        scope="primary"
        label={copy.primaryScopeLabel}
        value={draft.primaryValues[field.key] ?? ""}
        error={errors[credentialFieldErrorKey("primary", field.key)]}
        onValueChange={(value) => setValue("primary", value)}
      />
      <label className="flex items-center gap-2 text-xs text-foreground-secondary">
        <input
          type="checkbox"
          checked={draft.hasSeparateProductionKey}
          onChange={(event) => onChange({ ...draft, hasSeparateProductionKey: event.target.checked })}
          className="accent-lime"
        />
        {copy.productionToggleLabel}
      </label>
      {draft.hasSeparateProductionKey && (
        <ScopedInput
          field={field}
          scope="production"
          label={copy.productionScopeLabel}
          value={draft.productionValues[field.key] ?? ""}
          error={errors[credentialFieldErrorKey("production", field.key)]}
          onValueChange={(value) => setValue("production", value)}
        />
      )}
      <p className="text-xs text-muted">{field.helpText}</p>
    </div>
  );
}
