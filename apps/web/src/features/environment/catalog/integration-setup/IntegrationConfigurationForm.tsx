import type { FormEvent } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { CredentialMode, IntegrationCatalogEntry, IntegrationEnvironment } from "@repo/contracts";

interface IntegrationConfigurationFormProps {
  entry: IntegrationCatalogEntry;
  environment: IntegrationEnvironment;
  credentialMode: CredentialMode;
  isPending: boolean;
  errorMessage: string | null;
  resultMessage: string | null;
  onBack: () => void;
  onSubmit: (values: Record<string, string>) => Promise<void>;
}

function createFormSchema(entry: IntegrationCatalogEntry) {
  return z.record(z.string(), z.string()).superRefine((values, context) => {
    for (const field of entry.fields) {
      const value = values[field.key]?.trim() ?? "";
      if (field.isRequired && !value) {
        context.addIssue({ code: "custom", path: [field.key], message: `${field.label} is required` });
      }
      if (field.inputType === "email" && value && !z.email().safeParse(value).success) {
        context.addIssue({ code: "custom", path: [field.key], message: "Enter a valid email address" });
      }
    }
  });
}

export function IntegrationConfigurationForm({
  entry,
  environment,
  credentialMode,
  isPending,
  errorMessage,
  resultMessage,
  onBack,
  onSubmit,
}: IntegrationConfigurationFormProps) {
  const form = useForm<Record<string, string>>({
    resolver: zodResolver(createFormSchema(entry)),
    defaultValues: Object.fromEntries(entry.fields.map((field) => [field.key, ""])),
  });
  const submitForm = (event: FormEvent<HTMLFormElement>) => {
    if (credentialMode === "APPWRITE_MANAGED") {
      event.preventDefault();
      void onSubmit({});
      return;
    }
    void form.handleSubmit(onSubmit)(event);
  };

  return (
    <form
      key={`${entry.provider}-${environment}-${credentialMode}`}
      onSubmit={submitForm}
      className="mt-6 space-y-4"
    >
      <p className="text-sm text-muted">
        Environment: <span className="font-semibold text-foreground capitalize">{environment}</span>
      </p>
      {credentialMode === "APPWRITE_MANAGED" ? (
        <p className="rounded-lg border border-border bg-surface-2 p-4 text-sm text-muted">
          Appwright test keys are for development and preview. Provider credentials stay in Appwright’s server-side secret configuration.
        </p>
      ) : entry.fields.map((field) => (
        <label key={field.key} className="block text-sm text-muted">
          {field.label}{field.isRequired ? " *" : ""}
          <input
            {...form.register(field.key)}
            type={field.inputType}
            autoComplete="off"
            placeholder={field.placeholder}
            aria-invalid={Boolean(form.formState.errors[field.key])}
            aria-describedby={`${field.key}-help ${field.key}-error`}
            className="mt-1 block w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-foreground focus-visible:outline-2 focus-visible:outline-lime"
          />
          <span id={`${field.key}-help`} className="mt-1 block text-xs">{field.helpText}</span>
          <span id={`${field.key}-error`} role="alert" className="text-xs text-rose-400">
            {form.formState.errors[field.key]?.message}
          </span>
        </label>
      ))}
      {errorMessage && <p role="alert" className="text-sm text-rose-400">{errorMessage}</p>}
      {resultMessage && <p role="status" className="text-sm text-foreground">{resultMessage}</p>}
      <div className="flex gap-2">
        <button type="button" onClick={onBack} className="rounded-lg border border-border px-4 py-2 text-sm text-foreground">
          Back
        </button>
        <button type="submit" disabled={isPending} className="rounded-lg bg-lime px-4 py-2 text-sm font-semibold text-black disabled:opacity-50">
          {isPending ? "Testing…" : "Save and Test"}
        </button>
      </div>
    </form>
  );
}
