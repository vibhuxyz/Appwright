-- DropForeignKey
ALTER TABLE "ProjectDatabase" DROP CONSTRAINT "ProjectDatabase_projectId_fkey";

-- AlterTable
ALTER TABLE "Blueprint" ADD COLUMN     "dependencyManifest" JSONB;

-- AlterTable
ALTER TABLE "DatabaseDeletion" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "ProjectDatabase" ALTER COLUMN "projectId" SET DATA TYPE TEXT,
ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "ProjectIntegration" (
    "id" VARCHAR(30) NOT NULL,
    "projectId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'missing',
    "required" BOOLEAN NOT NULL DEFAULT false,
    "config" JSONB,
    "lastTestedAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectIntegration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectEnvironmentVariable" (
    "id" VARCHAR(30) NOT NULL,
    "projectId" TEXT NOT NULL,
    "environment" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT,
    "isSecret" BOOLEAN NOT NULL DEFAULT false,
    "secretRef" INTEGER,
    "required" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectEnvironmentVariable_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_project_integrations__project_id" ON "ProjectIntegration"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "uq_project_integrations__project_id_provider" ON "ProjectIntegration"("projectId", "provider");

-- CreateIndex
CREATE INDEX "idx_project_env_vars__project_id" ON "ProjectEnvironmentVariable"("projectId");

-- CreateIndex
CREATE INDEX "idx_project_env_vars__project_id_environment" ON "ProjectEnvironmentVariable"("projectId", "environment");

-- CreateIndex
CREATE UNIQUE INDEX "uq_project_env_vars__project_environment_key" ON "ProjectEnvironmentVariable"("projectId", "environment", "key");

-- AddForeignKey
ALTER TABLE "ProjectDatabase" ADD CONSTRAINT "ProjectDatabase_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectIntegration" ADD CONSTRAINT "ProjectIntegration_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectEnvironmentVariable" ADD CONSTRAINT "ProjectEnvironmentVariable_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
