import {
  CredentialFieldInput,
  CredentialModeOptions,
  EMPTY_CREDENTIAL_DRAFT,
  credentialCopy,
  type CredentialDraft,
} from "@/features/environment";
import { credentialErrorKey, credentialErrorsFor } from "../steps";
import type { DockStep } from "../types";

type IntegrationDockStep = Extract<DockStep, { kind: "integration-choice" | "integration-field" }>;

interface IntegrationStepProps {
  step: IntegrationDockStep;
  draft: CredentialDraft | undefined;
  errors: Readonly<Record<string, string>>;
  onChange: (draft: CredentialDraft, clearedErrorPrefix: string) => void;
}

export function IntegrationStep({ step, draft = EMPTY_CREDENTIAL_DRAFT, errors, onChange }: IntegrationStepProps) {
  const copy = credentialCopy(step.entry.provider, step.entry.name);
  if (step.kind === "integration-choice") {
    const error = errors[step.id];
    return (
      <div className="space-y-3">
        <div>
          <h3 className="text-[15px] leading-snug font-medium text-foreground">{step.entry.name} — {copy.question}</h3>
          <p className="mt-1 text-xs text-muted">{step.requirement.reason}</p>
        </div>
        <CredentialModeOptions
          name={step.entry.name}
          copy={copy}
          choice={draft.choice}
          isTestKeyAvailable={step.isTestKeyAvailable}
          isTestKeyExhausted={step.isTestKeyExhausted}
          onChoose={(choice) => onChange({ ...draft, choice }, step.id)}
        />
        {error && <p role="alert" className="text-xs text-danger">{error}</p>}
      </div>
    );
  }
  return (
    <div className="space-y-3">
      <h3 className="text-[15px] leading-snug font-medium text-foreground">
        {step.entry.name} — Please enter your {step.field.label}
      </h3>
      <CredentialFieldInput
        field={step.field}
        copy={copy}
        draft={draft}
        errors={credentialErrorsFor(errors, step.requirement.id)}
        onChange={(next) => onChange(next, credentialErrorKey(step.requirement.id, ""))}
      />
    </div>
  );
}
