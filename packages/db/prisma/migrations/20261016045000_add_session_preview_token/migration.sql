-- AlterTable
ALTER TABLE "Session" ADD COLUMN "previewToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Session_previewToken_key" ON "Session"("previewToken");
