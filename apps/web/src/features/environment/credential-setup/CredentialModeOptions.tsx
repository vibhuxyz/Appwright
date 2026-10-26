import { cn } from "@/shared/lib/cn";
import type { CredentialCopy } from "./credential-copy";
import type { CredentialChoice } from "./types";

interface CredentialModeOptionsProps {
  name: string;
  copy: CredentialCopy;
  choice: CredentialChoice | null;
  isTestKeyAvailable: boolean;
  isTestKeyExhausted: boolean;
  onChoose: (choice: CredentialChoice) => void;
}

interface OptionProps {
  label: string;
  hint: string;
  isSelected: boolean;
  isDisabled: boolean;
  onSelect: () => void;
}

function CredentialOption({ label, hint, isSelected, isDisabled, onSelect }: OptionProps) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-2.5 transition-colors",
        isSelected ? "border-lime/60 bg-lime/10" : "border-border hover:border-muted",
        isDisabled && "cursor-not-allowed opacity-50",
      )}
    >
      <input
        type="radio"
        name="credential-choice"
        checked={isSelected}
        disabled={isDisabled}
        onChange={onSelect}
        className="mt-0.5 accent-lime"
      />
      <span>
        <span className="block text-sm font-medium text-foreground">{label}</span>
        <span className="block text-xs text-muted">{hint}</span>
      </span>
    </label>
  );
}

export function CredentialModeOptions({
  name,
  copy,
  choice,
  isTestKeyAvailable,
  isTestKeyExhausted,
  onChoose,
}: CredentialModeOptionsProps) {
  return (
    <fieldset className="space-y-2">
      <legend className="sr-only">{copy.question}</legend>
      {isTestKeyAvailable ? (
        <CredentialOption
          label={copy.testKeyLabel}
          hint={isTestKeyExhausted ? "The Appwright test allowance is used up for this project." : copy.testKeyHint}
          isSelected={choice === "APPWRIGHT_TEST_KEY"}
          isDisabled={isTestKeyExhausted}
          onSelect={() => onChoose("APPWRIGHT_TEST_KEY")}
        />
      ) : (
        <p className="rounded-xl border border-dashed border-border px-3 py-2.5 text-xs text-muted">
          An Appwright test key isn't available for {name}. Connect your own account below.
        </p>
      )}
      <CredentialOption
        label={copy.ownKeyLabel}
        hint={copy.ownKeyHint}
        isSelected={choice === "YOUR_KEY"}
        isDisabled={false}
        onSelect={() => onChoose("YOUR_KEY")}
      />
    </fieldset>
  );
}
