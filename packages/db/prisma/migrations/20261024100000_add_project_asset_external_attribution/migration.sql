-- Hotlinked stock photos keep the provider photo id and photographer credit.
-- Both columns are nullable, so existing rows and writers are unaffected.
-- Reverse: ALTER TABLE "ProjectAsset" DROP COLUMN "attribution", DROP COLUMN "externalId";

ALTER TABLE "ProjectAsset" ADD COLUMN "externalId" TEXT;
ALTER TABLE "ProjectAsset" ADD COLUMN "attribution" JSONB;
