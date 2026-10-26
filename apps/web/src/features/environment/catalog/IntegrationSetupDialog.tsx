import { useRef, useState } from "react";
import type {
  CredentialMode,
  IntegrationCatalogEntry,
  IntegrationConfigurationResponse,
  IntegrationEnvironment,
  IntegrationQuota,
} from "@repo/contracts";
import { IntegrationLogo } from "@/shared/components/integration-logo";
import { useConfigureIntegration, useDisconnectIntegration } from "../hooks";
import {
  IntegrationConfigurationForm,
  IntegrationDialogFrame,
  IntegrationModeChoice,
} from "./integration-setup";

interface IntegrationSetupDialogProps {
  projectId: string;
  entry: IntegrationCatalogEntry;
  environment: IntegrationEnvironment;
  configuration?: IntegrationConfigurationResponse;
  quota?: IntegrationQuota;
  onClose: () => void;
  onConfigured?: (result: IntegrationConfigurationResponse) => void;
}

export function IntegrationSetupDialog({
  projectId,
  entry,
  environment,
  configuration,
  quota,
  onClose,
  onConfigured,
}: IntegrationSetupDialogProps) {
  const [step, setStep] = useState<"mode" | "configure">("mode");
  const [credentialMode, setCredentialMode] = useState<CredentialMode | null>(configuration?.credentialMode ?? null);
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const configure = useConfigureIntegration(projectId);
  const disconnect = useDisconnectIntegration(projectId);
  const isManagedQuotaExhausted = quota?.remaining === 0;

  const submitConfiguration = async (values: Record<string, string>) => {
    if (!credentialMode) return;
    const result = await configure.mutateAsync({
      provider: entry.provider,
      credentialMode,
      environment,
      values: credentialMode === "BYOK" ? values : {},
    });
    setResultMessage(result.message ?? result.status);
    onConfigured?.(result);
  };

  const disconnectIntegration = async () => {
    await disconnect.mutateAsync({ provider: entry.provider, environment });
    onClose();
  };

  return (
    <IntegrationDialogFrame
      title={<span className="flex items-center gap-2"><IntegrationLogo provider={entry.provider} className="size-6" />Configure {entry.name}</span>}
      description={entry.description}
      instructions={entry.setupInstructions}
      dialogRef={dialogRef}
      onClose={onClose}
    >
      {step === "mode" ? (
        <IntegrationModeChoice
          entry={entry}
          configuration={configuration}
          quota={quota}
          credentialMode={credentialMode}
          isQuotaExhausted={isManagedQuotaExhausted}
          isDisconnecting={disconnect.isPending}
          disconnectError={disconnect.error?.message ?? null}
          environment={environment}
          onSelectMode={setCredentialMode}
          onContinue={() => setStep("configure")}
          onDisconnect={disconnectIntegration}
        />
      ) : (
        <IntegrationConfigurationForm
          entry={entry}
          environment={environment}
          credentialMode={credentialMode ?? "BYOK"}
          isPending={configure.isPending}
          errorMessage={configure.error?.message ?? null}
          resultMessage={resultMessage}
          onBack={() => setStep("mode")}
          onSubmit={submitConfiguration}
        />
      )}
    </IntegrationDialogFrame>
  );
}
