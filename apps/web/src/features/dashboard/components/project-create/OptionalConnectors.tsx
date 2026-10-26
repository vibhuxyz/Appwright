import type { IntegrationProvider } from "@repo/contracts";
import { IntegrationLogo } from "@/shared/components/integration-logo";
import { cn } from "@/shared/lib/cn";

const CONNECTOR_CHOICES: readonly {
  provider: IntegrationProvider;
  label: string;
  detail: string;
}[] = [
  { provider: "mongodb", label: "Database", detail: "MongoDB" },
  { provider: "razorpay", label: "Payments", detail: "Razorpay" },
  { provider: "email", label: "Email", detail: "Brevo" },
  { provider: "google-oauth", label: "Login", detail: "Google OAuth" },
  { provider: "cloudinary", label: "Media", detail: "Cloudinary" },
];

export function OptionalConnectors({
  selectedProviders,
  onToggle,
}: {
  selectedProviders: readonly IntegrationProvider[];
  onToggle: (provider: IntegrationProvider) => void;
}) {
  return (
    <fieldset>
      <legend className="text-xs font-bold tracking-wide text-muted uppercase">Optional connectors</legend>
      <p className="mt-1 text-[11px] text-muted">Selected services will be added to this project for setup.</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {CONNECTOR_CHOICES.map((choice) => (
          <ConnectorChoice
            key={choice.provider}
            choice={choice}
            isSelected={selectedProviders.includes(choice.provider)}
            onToggle={onToggle}
          />
        ))}
      </div>
      <p className="mt-2 text-[11px] text-muted">You can add or remove connectors later from the workspace or AI chat.</p>
    </fieldset>
  );
}

function ConnectorChoice({
  choice,
  isSelected,
  onToggle,
}: {
  choice: (typeof CONNECTOR_CHOICES)[number];
  isSelected: boolean;
  onToggle: (provider: IntegrationProvider) => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={isSelected}
      onClick={() => onToggle(choice.provider)}
      className={cn(
        "flex min-h-16 items-center justify-between rounded-xl border px-3 py-2 text-left transition-colors focus-visible:outline-2 focus-visible:outline-lime",
        isSelected ? "border-lime bg-lime/10" : "border-border/70 bg-surface/60 hover:border-border hover:bg-surface-2",
      )}
    >
      <span className="flex min-w-0 items-center gap-2">
        <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-border/70 bg-surface-2">
          <IntegrationLogo provider={choice.provider} className="size-5" />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-xs font-semibold text-foreground">{choice.label}</span>
          <span className="block truncate text-[10px] text-muted">{choice.detail}</span>
        </span>
      </span>
      {isSelected && <span aria-hidden className="ml-2 size-2 shrink-0 rounded-full bg-lime" />}
    </button>
  );
}
