-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "vercelProjectId" TEXT;

-- AlterTable
ALTER TABLE "Session" ALTER COLUMN "model" SET DEFAULT 'gpt-4o';

-- CreateTable
CREATE TABLE "VercelConnection" (
    "id" VARCHAR(30) NOT NULL,
    "userId" TEXT NOT NULL,
    "encryptedToken" TEXT NOT NULL,
    "teamId" TEXT,
    "configurationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VercelConnection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VercelConnection_userId_key" ON "VercelConnection"("userId");

-- AddForeignKey
ALTER TABLE "VercelConnection" ADD CONSTRAINT "VercelConnection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
