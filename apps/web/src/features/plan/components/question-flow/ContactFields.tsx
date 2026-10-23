import { useState } from "react";
import { Button } from "@/shared/components/ui/Button";
import { ContactFieldCard } from "./ContactFieldCard";
import {
  encodeContactAnswer,
  fieldsToShow,
  type ContactFieldConfig,
} from "./contact-field-config";

interface ContactFieldsProps {
  fields: readonly string[];
  prefill?: Readonly<Record<string, string>>;
  isSubmitting: boolean;
  onContinue: (value: string) => void;
}

const GROUPS: readonly { id: ContactFieldConfig["group"]; title: string }[] = [
  { id: "social", title: "Social links" },
  { id: "contact", title: "Contact" },
];

export function ContactFields({
  fields,
  prefill = {},
  isSubmitting,
  onContinue,
}: ContactFieldsProps) {
  const visible = fieldsToShow(fields);
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(visible.map((field) => [field.label, prefill[field.label] ?? ""])),
  );
  const missingRequired = visible.some(
    (field) => field.required && (values[field.label] ?? "").trim().length === 0,
  );

  return (
    <div className="flex flex-col gap-4 border-t border-border-soft p-3">
      <p className="text-xs text-muted">
        Each social profile and contact method has its own box. Phone, email, and address are
        required; the rest can stay empty.
      </p>
      {GROUPS.map((group) => {
        const groupFields = visible.filter((field) => field.group === group.id);
        if (groupFields.length === 0) return null;
        return (
          <fieldset key={group.id} className="flex flex-col gap-2">
            <legend className="text-xs font-medium tracking-wide text-foreground-secondary uppercase">
              {group.title}
            </legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {groupFields.map((field) => (
                <ContactFieldCard
                  key={field.label}
                  field={field}
                  value={values[field.label] ?? ""}
                  isSubmitting={isSubmitting}
                  onChange={(value) =>
                    setValues((current) => ({ ...current, [field.label]: value }))
                  }
                />
              ))}
            </div>
          </fieldset>
        );
      })}
      <Button
        type="button"
        size="sm"
        disabled={isSubmitting || missingRequired}
        onClick={() => onContinue(encodeContactAnswer(values))}
      >
        Continue
      </Button>
    </div>
  );
}
