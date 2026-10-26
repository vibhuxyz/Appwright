import { ContactFieldCard } from "./ContactFieldCard";
import { decodeContactAnswer, encodeContactAnswer, fieldsToShow } from "./contact-field-config";

interface ContactFieldsProps {
  fields: readonly string[];
  value: string;
  isSubmitting: boolean;
  onChange: (value: string) => void;
}

export function ContactFields({ fields, value, isSubmitting, onChange }: ContactFieldsProps) {
  const values = decodeContactAnswer(value);
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {fieldsToShow(fields).map((field) => (
        <ContactFieldCard
          key={field.label}
          field={field}
          value={values[field.label] ?? ""}
          isSubmitting={isSubmitting}
          onChange={(next) => onChange(encodeContactAnswer({ ...values, [field.label]: next }))}
        />
      ))}
    </div>
  );
}
