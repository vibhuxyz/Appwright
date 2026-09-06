-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_sessionId_fkey";

-- DropForeignKey
ALTER TABLE "Secret" DROP CONSTRAINT "Secret_projectId_fkey";

-- DropForeignKey
ALTER TABLE "Session" DROP CONSTRAINT "Session_projectId_fkey";

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Secret" ADD CONSTRAINT "Secret_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
