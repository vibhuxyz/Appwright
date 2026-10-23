import type { ProjectType } from "@repo/contracts";
import type { SectionFilter } from "@repo/ui-system/sections";

const BUSINESSES: readonly (ProjectType | "all")[] = ["all", "business-site", "saas", "portfolio", "marketplace", "wallet", "other"];

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-xs text-muted">
      {label}
      <select
        className="rounded-md border border-border bg-background px-2 py-1 text-foreground"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

export function CatalogFilters({
  filter,
  layouts,
  styles,
  onChange,
}: {
  filter: SectionFilter;
  layouts: readonly string[];
  styles: readonly string[];
  onChange: (filter: SectionFilter) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <label className="flex flex-col gap-1 text-xs text-muted sm:col-span-2">
        Search purpose
        <input
          className="rounded-md border border-border bg-background px-2 py-1 text-foreground"
          value={filter.text}
          onChange={(event) => onChange({ ...filter, text: event.target.value })}
        />
      </label>
      <SelectField label="Business" value={filter.business} options={BUSINESSES} onChange={(business) => onChange({ ...filter, business: business as SectionFilter["business"] })} />
      <SelectField label="Layout" value={filter.layout} options={["all", ...layouts]} onChange={(layout) => onChange({ ...filter, layout: layout as SectionFilter["layout"] })} />
      <SelectField label="Style" value={filter.style} options={["all", ...styles]} onChange={(style) => onChange({ ...filter, style: style as SectionFilter["style"] })} />
      <SelectField label="License" value={filter.license} options={["all", "commercial"]} onChange={(license) => onChange({ ...filter, license: license as SectionFilter["license"] })} />
      <SelectField label="Quality" value={filter.quality} options={["all", "accepted"]} onChange={(quality) => onChange({ ...filter, quality: quality as SectionFilter["quality"] })} />
      <SelectField label="Review" value={filter.review} options={["all", "approved", "rejected", "unreviewed"]} onChange={(review) => onChange({ ...filter, review: review as SectionFilter["review"] })} />
    </div>
  );
}
