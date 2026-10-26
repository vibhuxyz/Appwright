-- CreateTable
CREATE TABLE "integration_requests" (
    "id" UUID NOT NULL,
    "session_id" VARCHAR(30) NOT NULL,
    "project_id" VARCHAR(30) NOT NULL,
    "provider" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "expires_at" TIMESTAMPTZ(3) NOT NULL,
    "resolved_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "integration_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_integration_requests__project_id_provider_status" ON "integration_requests"("project_id", "provider", "status");

-- CreateIndex
CREATE UNIQUE INDEX "uq_integration_requests__session_id_provider" ON "integration_requests"("session_id", "provider");

-- AddForeignKey
ALTER TABLE "integration_requests" ADD CONSTRAINT "integration_requests_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integration_requests" ADD CONSTRAINT "integration_requests_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddCheckConstraint
ALTER TABLE "integration_requests" ADD CONSTRAINT "chk_integration_requests__status"
    CHECK ("status" IN ('PENDING', 'CONNECTED', 'DISMISSED', 'EXPIRED'));
