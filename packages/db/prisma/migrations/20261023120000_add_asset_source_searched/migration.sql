-- Expand AssetSource so Google/stock images can be stored separately from
-- uploads and model generations. Postgres cannot drop enum values; reverse
-- by leaving SEARCHED unused.

ALTER TYPE "AssetSource" ADD VALUE IF NOT EXISTS 'SEARCHED';
