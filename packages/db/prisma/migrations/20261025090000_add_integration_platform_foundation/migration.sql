CREATE TABLE "ProjectIntegrationEnvironment" (
    "id" VARCHAR(30) NOT NULL,
    "integrationId" VARCHAR(30) NOT NULL,
    "environment" TEXT NOT NULL,
    "credentialMode" TEXT NOT NULL DEFAULT 'BYOK',
    "status" TEXT NOT NULL DEFAULT 'configuration_required',
    "lastTestedAt" TIMESTAMPTZ(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProjectIntegrationEnvironment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "IntegrationUsage" (
    "id" VARCHAR(30) NOT NULL,
    "projectId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "credentialMode" TEXT NOT NULL,
    "environment" TEXT NOT NULL,
    "operation" TEXT NOT NULL,
    "idempotencyKey" VARCHAR(128) NOT NULL,
    "requestFingerprint" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "units" INTEGER NOT NULL DEFAULT 1,
    "providerRequestId" TEXT,
    "resultJson" JSONB,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "IntegrationUsage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "IntegrationPayment" (
    "id" VARCHAR(30) NOT NULL,
    "projectId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "environment" TEXT NOT NULL,
    "credentialMode" TEXT NOT NULL,
    "providerOrderId" TEXT NOT NULL,
    "paymentId" TEXT,
    "amountMinor" BIGINT NOT NULL,
    "currency" VARCHAR(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'created',
    "idempotencyKey" VARCHAR(128) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "IntegrationPayment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "IntegrationWebhookEvent" (
    "id" VARCHAR(30) NOT NULL,
    "projectId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "payloadHash" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "IntegrationWebhookEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProjectIntegrationAccessToken" (
    "id" VARCHAR(30) NOT NULL,
    "projectId" TEXT NOT NULL,
    "environment" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "encryptedToken" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProjectIntegrationAccessToken_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "IntegrationAuditEvent" (
    "id" VARCHAR(30) NOT NULL,
    "projectId" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "environment" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "IntegrationAuditEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "uq_project_integration_env__integration_environment"
    ON "ProjectIntegrationEnvironment"("integrationId", "environment");
CREATE INDEX "idx_project_integration_env__integration_id"
    ON "ProjectIntegrationEnvironment"("integrationId");
CREATE UNIQUE INDEX "uq_integration_usage__project_provider_operation_key"
    ON "IntegrationUsage"("projectId", "provider", "operation", "environment", "idempotencyKey");
CREATE INDEX "idx_integration_usage__quota_lookup"
    ON "IntegrationUsage"("projectId", "provider", "credentialMode", "status");
CREATE UNIQUE INDEX "uq_integration_payments__project_environment_key"
    ON "IntegrationPayment"("projectId", "environment", "idempotencyKey");
CREATE UNIQUE INDEX "uq_integration_payments__project_provider_order"
    ON "IntegrationPayment"("projectId", "providerOrderId");
CREATE INDEX "idx_integration_payments__project_env_status"
    ON "IntegrationPayment"("projectId", "environment", "status");
CREATE UNIQUE INDEX "uq_integration_webhooks__project_provider_event"
    ON "IntegrationWebhookEvent"("projectId", "provider", "eventId");
CREATE INDEX "idx_integration_webhooks__project_provider"
    ON "IntegrationWebhookEvent"("projectId", "provider");
CREATE UNIQUE INDEX "uq_project_integration_tokens__project_environment"
    ON "ProjectIntegrationAccessToken"("projectId", "environment");
CREATE UNIQUE INDEX "ProjectIntegrationAccessToken_tokenHash_key"
    ON "ProjectIntegrationAccessToken"("tokenHash");
CREATE INDEX "idx_integration_audit_events__project_created"
    ON "IntegrationAuditEvent"("projectId", "createdAt");
CREATE INDEX "idx_integration_audit_events__actor"
    ON "IntegrationAuditEvent"("actorUserId");

ALTER TABLE "ProjectIntegrationEnvironment"
    ADD CONSTRAINT "ProjectIntegrationEnvironment_integrationId_fkey"
    FOREIGN KEY ("integrationId") REFERENCES "ProjectIntegration"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "IntegrationUsage"
    ADD CONSTRAINT "IntegrationUsage_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "Project"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "IntegrationPayment"
    ADD CONSTRAINT "IntegrationPayment_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "Project"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "IntegrationWebhookEvent"
    ADD CONSTRAINT "IntegrationWebhookEvent_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "Project"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProjectIntegrationAccessToken"
    ADD CONSTRAINT "ProjectIntegrationAccessToken_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "Project"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "IntegrationAuditEvent"
    ADD CONSTRAINT "IntegrationAuditEvent_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "Project"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "IntegrationAuditEvent"
    ADD CONSTRAINT "IntegrationAuditEvent_actorUserId_fkey"
    FOREIGN KEY ("actorUserId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
