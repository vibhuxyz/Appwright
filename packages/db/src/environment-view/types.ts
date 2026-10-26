export interface IntegrationEnvironmentRecord {
  environment: string;
  credentialMode: string;
  status: string;
  lastTestedAt: Date | null;
  lastError: string | null;
}

export interface IntegrationRecord {
  provider: string;
  required: boolean;
  environments: readonly IntegrationEnvironmentRecord[];
}

export interface ProjectDatabaseRecord {
  status: string;
  databaseName: string;
}

export interface SkippedIntegration {
  provider: string;
  reason: string;
}
