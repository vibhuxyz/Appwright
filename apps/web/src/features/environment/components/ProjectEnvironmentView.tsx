import { useState } from "react";
import type {
  DatabaseSource,
  IntegrationEnvironment,
  IntegrationProvider,
  PreflightCheckResponse,
} from "@repo/contracts";
import {
  useDeleteEnvironmentVariable,
  useEnvironmentOverview,
  useRunPreflight,
  useSetEnvironmentVariable,
  useSyncVercelEnv,
  useTestIntegration,
} from "../hooks/useEnvironment";
import { EnvironmentHeader } from "./EnvironmentHeader";
import { IntegrationsList } from "./IntegrationsList";
import { PreflightCheckCard } from "./PreflightCheckCard";
import { VariablesTable } from "./VariablesTable";
import { ConnectorCatalog } from "../catalog";

const NO_DATABASE: DatabaseSource = { source: "NOT_REQUIRED", databaseName: null };

interface ProjectEnvironmentViewProps {
  projectId?: string;
  projectName: string;
  section?: "environment" | "connectors" | "payments" | "secrets";
}

export function ProjectEnvironmentView({
  projectId,
  section = "environment",
}: ProjectEnvironmentViewProps) {
  const [selectedEnv, setSelectedEnv] = useState<IntegrationEnvironment>("development");
  const [preflightResult, setPreflightResult] = useState<PreflightCheckResponse | null>(null);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);
  const [testingProvider, setTestingProvider] = useState<IntegrationProvider | null>(null);

  const { data: overview, isLoading } = useEnvironmentOverview(projectId, selectedEnv);
  const database = overview?.database ?? NO_DATABASE;
  const setVarMutation = useSetEnvironmentVariable(projectId ?? "");
  const deleteVarMutation = useDeleteEnvironmentVariable(projectId ?? "");
  const testIntegrationMutation = useTestIntegration(projectId ?? "");
  const runPreflightMutation = useRunPreflight(projectId ?? "");
  const syncVercelMutation = useSyncVercelEnv(projectId ?? "");

  const handleRunPreflight = async () => {
    if (!projectId) return;
    const res = await runPreflightMutation.mutateAsync(selectedEnv);
    setPreflightResult(res);
  };

  const handleSyncVercel = async () => {
    if (!projectId) return;
    try {
      const res = await syncVercelMutation.mutateAsync(selectedEnv);
      setSyncNotice(`Successfully pushed ${res.syncedCount} variables to Vercel (${selectedEnv})`);
      setTimeout(() => setSyncNotice(null), 5000);
    } catch (err) {
      setSyncNotice(err instanceof Error ? err.message : "Sync to Vercel failed");
    }
  };

  const handleTestIntegration = async (provider: IntegrationProvider) => {
    setTestingProvider(provider);
    try {
      await testIntegrationMutation.mutateAsync({
        provider,
        environment: selectedEnv,
      });
    } finally {
      setTestingProvider(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-xs text-muted">
        Loading environment configuration…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <EnvironmentHeader
        selectedEnv={selectedEnv}
        onSelectEnv={setSelectedEnv}
        isPreflightPending={runPreflightMutation.isPending}
        isSyncPending={syncVercelMutation.isPending}
        onRunPreflight={handleRunPreflight}
        onSyncVercel={handleSyncVercel}
        vercelConnected={Boolean(overview?.vercel.connected)}
      />

      {section === "connectors" && projectId && (
        <ConnectorCatalog projectId={projectId} environment={selectedEnv} />
      )}

      {section === "payments" && projectId && (
        <ConnectorCatalog projectId={projectId} environment={selectedEnv} initialCategory="payments" />
      )}

      {section === "secrets" && (
        <VariablesTable
          variables={overview?.variables ?? []}
          database={database}
          selectedEnv={selectedEnv}
          onSetVariable={(input) => setVarMutation.mutate(input)}
          onDeleteVariable={(input) => deleteVarMutation.mutate(input)}
        />
      )}

      {section === "environment" && (
        <>

      {syncNotice && (
        <div className="rounded-xl border border-border/80 bg-surface/60 p-3 text-xs text-white">
          {syncNotice}
        </div>
      )}

      {preflightResult && (
        <PreflightCheckCard
          result={preflightResult}
          onClose={() => setPreflightResult(null)}
        />
      )}

      <IntegrationsList
        integrations={overview?.integrations ?? []}
        database={database}
        environment={selectedEnv}
        testingProvider={testingProvider}
        onTestIntegration={handleTestIntegration}
      />

      <VariablesTable
        variables={overview?.variables ?? []}
        database={database}
        selectedEnv={selectedEnv}
        onSetVariable={(input) => setVarMutation.mutate(input)}
        onDeleteVariable={(input) => deleteVarMutation.mutate(input)}
      />
        </>
      )}
    </div>
  );
}
