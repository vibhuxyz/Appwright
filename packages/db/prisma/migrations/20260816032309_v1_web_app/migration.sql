/*
  Warnings:

  - You are about to drop the column `initialPrompt` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the `ConversationHistory` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `name` to the `Project` table without a default value. This is not possible if the table is not empty.
  - Added the required column `workspacePath` to the `Project` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('IDLE', 'RUNNING', 'ERROR');

-- DropForeignKey
ALTER TABLE "ConversationHistory" DROP CONSTRAINT "ConversationHistory_projectId_fkey";

-- DropForeignKey
ALTER TABLE "Project" DROP CONSTRAINT "Project_userId_fkey";

-- AlterTable
ALTER TABLE "Project" DROP COLUMN "initialPrompt",
DROP COLUMN "title",
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "templateId" TEXT NOT NULL DEFAULT 'vite-react',
ADD COLUMN     "workspacePath" TEXT NOT NULL,
ALTER COLUMN "userId" DROP NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'READY';

-- DropTable
DROP TABLE "ConversationHistory";

-- DropEnum
DROP TYPE "ConversationType";

-- DropEnum
DROP TYPE "MessageFrom";

-- DropEnum
DROP TYPE "ToolCall";

-- CreateTable
CREATE TABLE "Session" (
    "id" VARCHAR(30) NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT,
    "model" TEXT NOT NULL DEFAULT 'gpt-4o-mini',
    "cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tokenIn" INTEGER NOT NULL DEFAULT 0,
    "tokenOut" INTEGER NOT NULL DEFAULT 0,
    "status" "SessionStatus" NOT NULL DEFAULT 'IDLE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" VARCHAR(30) NOT NULL,
    "sessionId" TEXT NOT NULL,
    "seq" INTEGER NOT NULL,
    "role" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "data" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Message_sessionId_seq_idx" ON "Message"("sessionId", "seq");

-- CreateIndex
CREATE UNIQUE INDEX "Message_sessionId_seq_key" ON "Message"("sessionId", "seq");

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
