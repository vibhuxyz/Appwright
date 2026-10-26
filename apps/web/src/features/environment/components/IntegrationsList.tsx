import { RefreshCw } from "lucide-react";
import type {
  DatabaseSource,
  EnvironmentIntegrationView,
  IntegrationEnvironment,
  IntegrationProvider,
} from "@repo/contracts";
import { IntegrationLogo } from "@/shared/components/integration-logo";
import { cn } from "@/shared/lib/cn";
import {
  TONE_BADGE_CLASS,
  credentialSourceLabel,
  databaseSourcePresentation,
  integrationStatusPresentation,
} from "../presentation";

interface IntegrationsListProps {
  integrations: readonly EnvironmentIntegrationView[];
  database: DatabaseSource;
  environment: IntegrationEnvironment;
  testingProvider: IntegrationProvider | null;
  onTestIntegration: (provider: IntegrationProvider) => void;
}

const PROVIDER_META: Partial<Record<IntegrationProvider, { name: string; desc: string }>> = {
  mongodb: { name: "MongoDB Database", desc: "Application data storage & collections" },
  auth: { name: "Authentication (Auth.js)", desc: "Session security & user credentials" },
  cloudinary: { name: "Cloudinary CDN", desc: "Media asset storage & image delivery" },
  email: { name: "Transactional Email (Brevo)", desc: "Outbound notifications and verifications" },
  razorpay: { name: "Razorpay Payments", desc: "Checkout orders and payment verification" },
  "google-oauth": { name: "Google OAuth", desc: "Sign in with Google" },
  realtime: { name: "Realtime Messaging", desc: "Live events & WebSockets" },
};

interface IntegrationCardProps {
  item: EnvironmentIntegrationView;
  database: DatabaseSource;
  environment: IntegrationEnvironment;
  isTesting: boolean;
  onTest: () => void;
}

function IntegrationCard({ item, database, environment, isTesting, onTest }: IntegrationCardProps) {
  const meta = PROVIDER_META[item.provider] ?? { name: item.provider, desc: "Custom service provider" };
  const status = integrationStatusPresentation(item.status);
  const sourceLabel = credentialSourceLabel(item.provider, item.credentialSource);
  const databaseDetail = item.provider === "mongodb" ? databaseSourcePresentation(database, environment) : null;

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-border/70 bg-surface p-4 transition-colors hover:border-border">
      <div>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="grid size-8 place-items-center rounded-xl bg-surface-2 text-foreground">
              <IntegrationLogo provider={item.provider} className="size-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-foreground">{meta.name}</h3>
              <p className="text-[11px] text-muted">{meta.desc}</p>
            </div>
          </div>
          <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-semibold", TONE_BADGE_CLASS[status.tone])}>
            {status.label}
          </span>
        </div>
        {sourceLabel && (
          <p className="mt-3 text-[11px] text-foreground-secondary">
            Credentials: <span className="font-semibold text-foreground">{databaseDetail?.label ?? sourceLabel}</span>
            {databaseDetail?.detail ? <span className="font-mono text-muted"> · {databaseDetail.detail}</span> : null}
          </p>
        )}
        {item.lastError && (
          <p className="mt-3 rounded-lg bg-danger/10 p-2 font-mono text-[11px] text-danger">{item.lastError}</p>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-border/40 pt-3">
        <span className="text-[10px] text-muted">
          {item.lastTestedAt ? `Tested ${new Date(item.lastTestedAt).toLocaleTimeString()}` : "Not tested yet"}
        </span>
        {item.status !== "not_required" && (
          <button
            type="button"
            onClick={onTest}
            disabled={isTesting}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-surface-2 px-2.5 py-1 text-[11px] font-medium text-foreground transition-colors hover:bg-surface-3 disabled:opacity-50"
          >
            <RefreshCw className={cn("size-3", isTesting && "animate-spin text-lime")} />
            <span>{isTesting ? "Testing…" : "Test Connection"}</span>
          </button>
        )}
      </div>
    </div>
  );
}

export function IntegrationsList({
  integrations,
  database,
  environment,
  testingProvider,
  onTestIntegration,
}: IntegrationsListProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-sm font-bold text-foreground">Services & integrations in {environment}</h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {integrations.map((item) => (
          <IntegrationCard
            key={item.provider}
            item={item}
            database={database}
            environment={environment}
            isTesting={testingProvider === item.provider}
            onTest={() => onTestIntegration(item.provider)}
          />
        ))}
      </div>
    </div>
  );
}
