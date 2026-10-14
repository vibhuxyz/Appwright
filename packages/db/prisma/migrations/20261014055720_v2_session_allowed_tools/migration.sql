-- AlterTable
ALTER TABLE "Session" ADD COLUMN     "allowedTools" TEXT[] DEFAULT ARRAY[]::TEXT[];
