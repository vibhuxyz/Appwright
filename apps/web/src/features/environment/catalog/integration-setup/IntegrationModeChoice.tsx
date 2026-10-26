import {
  isManagedCredentialAllowed,
  type CredentialMode,
  type IntegrationCatalogEntry,
  type IntegrationConfigurationResponse,
  type IntegrationEnvironment,
  type IntegrationQuota,
} from "@repo/contracts";

interface IntegrationModeChoiceProps {
  entry: IntegrationCatalogEntry;
  configuration?: IntegrationConfigurationResponse;
  quota?: IntegrationQuota;
  environment: IntegrationEnvironment;
  credentialMode: CredentialMode | null;
  isQuotaExhausted: boolean;
  isDisconnecting: boolean;
  disconnectError: string | null;
  onSelectMode: (mode: CredentialMode) => void;
  onContinue: () => void;
  onDisconnect: () => Promise<void>;
}

export function IntegrationModeChoice({
  entry,
  configuration,
  quota,
  environment,
  credentialMode,
  isQuotaExhausted,
  isDisconnecting,
  disconnectError,
  onSelectMode,
  onContinue,
  onDisconnect,
}: IntegrationModeChoiceProps) {
  const isManagedAllowedHere = isManagedCredentialAllowed(entry.provider, environment);
  return (
    <div className="mt-6 space-y-4">
      {entry.canUseManagedCredentials && (
        <label className="block rounded-xl border border-border p-4 focus-within:border-lime">
          <input
            type="radio"
            name="credential-mode"
            checked={credentialMode === "APPWRITE_MANAGED"}
            disabled={isQuotaExhausted || !isManagedAllowedHere}
            onChange={() => onSelectMode("APPWRITE_MANAGED")}
          />
          <span className="ml-3 font-medium text-foreground">Use Appwright test credentials</span>
          <p className="mt-2 pl-6 text-sm text-muted">
            Use Appwright-managed credentials for supported development and testing operations. Usage is subject to your plan’s limits.
          </p>
          {!isManagedAllowedHere && (
            <p className="mt-2 pl-6 text-xs text-warning">Not available in {environment}. Switch to Development or Preview, or use your own provider account.</p>
          )}
          <p className="mt-2 pl-6 text-xs text-muted">Supported operations: {entry.managedCapabilities.join(", ")}</p>
          {quota && <p className="mt-2 pl-6 text-xs text-muted">
            {quota.used} of {quota.limit} Appwrite-managed {quota.operation.replaceAll("_", " ")} requests used. Failed provider attempts consume one request; retries with the same idempotency key do not consume another.
          </p>}
          {isQuotaExhausted && <p className="mt-2 pl-6 text-xs text-rose-300">
            The managed allowance is exhausted. Connect your own provider account to continue.
          </p>}
        </label>
      )}
      {!entry.canUseManagedCredentials && (
        <div className="rounded-xl border border-border p-4 text-muted">
          <p className="font-medium text-foreground">Appwright test credentials unavailable</p>
          <p className="mt-2 text-sm">
            Appwright does not have a managed test account configured for {entry.name}. Choose your own provider credentials below.
          </p>
        </div>
      )}
      <label className="block rounded-xl border border-border p-4 focus-within:border-lime">
        <input type="radio" name="credential-mode" checked={credentialMode === "BYOK"} onChange={() => onSelectMode("BYOK")} />
        <span className="ml-3 font-medium text-foreground">Use my own provider credentials</span>
        <p className="mt-2 pl-6 text-sm text-muted">Connect your own provider account. You control your credentials and provider usage.</p>
      </label>
      {configuration && <p className="text-xs text-muted">
        Current status: {configuration.status}. Saved secrets remain masked; enter replacement values to rotate them.
      </p>}
      <button
        type="button"
        disabled={!credentialMode || (credentialMode === "APPWRITE_MANAGED" && (isQuotaExhausted || !isManagedAllowedHere))}
        onClick={onContinue}
        className="rounded-lg bg-lime px-4 py-2 text-sm font-semibold text-black disabled:opacity-40"
      >Continue</button>
      {configuration?.status === "connected" && <button
        type="button"
        disabled={isDisconnecting}
        onClick={() => void onDisconnect()}
        className="ml-2 rounded-lg border border-rose-500/40 px-4 py-2 text-sm text-rose-300 disabled:opacity-50"
      >{isDisconnecting ? "Disconnecting…" : "Disconnect"}</button>}
      {disconnectError && <p role="alert" className="text-sm text-rose-400">{disconnectError}</p>}
    </div>
  );
}
