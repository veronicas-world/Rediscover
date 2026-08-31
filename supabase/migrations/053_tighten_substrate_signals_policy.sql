-- ============================================================
-- 053_tighten_substrate_signals_policy.sql
-- Restrict anon to active signals only
-- ============================================================
--
-- Follow-up to 052. The anon_read_substrate_signals policy was USING (true),
-- which let the public anon key read off_topic, off_scope, retired, and draft
-- signals — internal rows the site deliberately filters out. The site always
-- queries substrate_signals with status = 'active', so restricting anon to
-- active rows hides the internal data without breaking the site.
--
-- Applied 2026-08-30. Verified: live site still loads with full data.

DROP POLICY IF EXISTS anon_read_substrate_signals ON substrate_signals;
CREATE POLICY anon_read_substrate_signals
  ON substrate_signals FOR SELECT TO anon USING (status = 'active');

-- Verify:
--   SELECT polname, polqual FROM pg_policy
--   WHERE polrelid = 'substrate_signals'::regclass;
