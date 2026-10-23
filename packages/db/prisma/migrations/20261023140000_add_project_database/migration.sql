-- Expand: project-scoped MongoDB registry on the platform Postgres.
-- Reverse: DROP TABLE "DatabaseDeletion"; DROP TABLE "ProjectDatabase";
-- then DROP TYPE for the four enums below.

CREATE TYPE "ProjectDatabaseStatus" AS ENUM ('PENDING', 'PROVISIONING', 'READY', 'FAILED', 'PENDING_DELETE');
CREATE TYPE "ProjectDatabaseEnvironment" AS ENUM ('DEVELOPMENT', 'PREVIEW', 'PRODUCTION');
CREATE TYPE "ProjectDatabaseProvider" AS ENUM ('MONGODB');
CREATE TYPE "ProjectDatabaseIsolation" AS ENUM ('SCOPED_USER', 'SHARED_CLUSTER_USER');

CREATE TABLE "ProjectDatabase" (
    "id" VARCHAR(30) NOT NULL,
    "projectId" VARCHAR(30) NOT NULL,
    "environment" "ProjectDatabaseEnvironment" NOT NULL,
    "provider" "ProjectDatabaseProvider" NOT NULL DEFAULT 'MONGODB',
    "databaseName" TEXT NOT NULL,
    "isolationMode" "ProjectDatabaseIsolation" NOT NULL,
    "status" "ProjectDatabaseStatus" NOT NULL DEFAULT 'PENDING',
    "secretRef" TEXT,
    "migrationVersion" INTEGER NOT NULL DEFAULT 0,
    "lastErrorCode" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ProjectDatabase_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "uq_project_databases__project_id_environment" ON "ProjectDatabase"("projectId", "environment");
CREATE UNIQUE INDEX "uq_project_databases__database_name" ON "ProjectDatabase"("databaseName");
CREATE INDEX "idx_project_databases__project_id" ON "ProjectDatabase"("projectId");
CREATE INDEX "idx_project_databases__status" ON "ProjectDatabase"("status");

ALTER TABLE "ProjectDatabase" ADD CONSTRAINT "ProjectDatabase_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "DatabaseDeletion" (
    "id" VARCHAR(30) NOT NULL,
    "databaseName" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "provider" "ProjectDatabaseProvider" NOT NULL DEFAULT 'MONGODB',
    "projectId" TEXT NOT NULL,
    "environment" "ProjectDatabaseEnvironment" NOT NULL,
    "deleteAfter" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "lastErrorCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "DatabaseDeletion_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "uq_database_deletions__database_name" ON "DatabaseDeletion"("databaseName");
CREATE INDEX "idx_database_deletions__delete_after_status" ON "DatabaseDeletion"("deleteAfter", "status");
