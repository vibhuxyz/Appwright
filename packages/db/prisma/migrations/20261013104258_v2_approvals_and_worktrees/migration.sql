-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'DENIED');

-- AlterEnum
ALTER TYPE "SessionStatus" ADD VALUE 'AWAITING_APPROVAL';

-- AlterTable
ALTER TABLE "Session" ADD COLUMN     "branch" TEXT,
ADD COLUMN     "devPort" INTEGER,
ADD COLUMN     "mode" TEXT NOT NULL DEFAULT 'default',
ADD COLUMN     "worktreePath" TEXT;

-- CreateTable
CREATE TABLE "Approval" (
    "id" VARCHAR(30) NOT NULL,
    "sessionId" TEXT NOT NULL,
    "messageId" TEXT,
    "toolCallId" TEXT,
    "toolName" TEXT NOT NULL,
    "args" JSONB NOT NULL,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "Approval_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Approval_sessionId_idx" ON "Approval"("sessionId");

-- CreateIndex
CREATE INDEX "Approval_sessionId_status_idx" ON "Approval"("sessionId", "status");

-- CreateIndex
CREATE INDEX "Session_projectId_idx" ON "Session"("projectId");

-- AddForeignKey
ALTER TABLE "Approval" ADD CONSTRAINT "Approval_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;
