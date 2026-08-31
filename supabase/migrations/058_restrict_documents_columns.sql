-- ============================================================
-- 058_restrict_documents_columns.sql
-- Restrict anon SELECT on documents to only the columns the app needs
-- ============================================================
--
-- The documents table stores raw_text (full post/article text) and meta
-- (JSONB metadata including subreddit, thread_id, condition). The public
-- application only needs source, external_id, url, and title (via the claims
-- → documents join in substrate-candidates.ts). Restricting the anon grant
-- to those columns follows least-privilege: even though the current Reddit
-- data doesn't contain usernames, future documents might, and the raw_text
-- of a medical post is personal health data that shouldn't be bulk-queryable.
--
-- The RLS policy (052) already gates which ROWS are visible; this migration
-- gates which COLUMNS are visible within those rows.

REVOKE SELECT ON documents FROM anon;
GRANT SELECT (id, source, external_id, url, title) ON documents TO anon;
