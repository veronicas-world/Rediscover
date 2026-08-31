-- ============================================================
-- 052_enable_substrate_rls.sql
-- Enable Row Level Security on every substrate + side table
-- ============================================================
--
-- SECURITY FIX. The substrate tables (046/050) and side tables were created
-- without RLS, under the mistaken belief that the legacy tables (001) also
-- lacked it. They do not — 001 enables RLS with anon-read SELECT policies.
-- Without RLS, the public anon key (NEXT_PUBLIC_SUPABASE_ANON_KEY, embedded in
-- the client bundle) held full SELECT/INSERT/UPDATE/DELETE/TRUNCATE grants on
-- every substrate table — the entire evidence database was read/write
-- exposed to the internet.
--
-- This migration closes that hole:
--   * anon can SELECT the tables the public site reads (substrate_signals,
--     entities, claims, documents, source_spans, contradictions, compound_pk,
--     compound_condition_phase) and nothing else.
--   * anon can INSERT into access_requests (the /access form) but cannot
--     SELECT, UPDATE, or DELETE it — the waitlist PII is no longer dumpable.
--   * extraction_runs, drug_targets, target_conditions, targets are
--     deny-all to anon (internal/audit tables).
--   * graph_support is a VIEW, not a table — RLS does not apply to views;
--     its underlying tables (drug_targets, target_conditions, targets) are
--     now RLS-protected, which gates the view's data.
--   * The legacy tables (conditions, compounds, repurposing_signals, sources)
--     already have RLS from 001 and are untouched.
--
-- The service_role bypasses RLS (BYPASSRLS) and is unaffected. There is no
-- service-role key in the project env, so all app reads go through anon —
-- which is now gated by these policies.
--
-- Applied 2026-08-30 via the Supabase management API. Verified: all 17 tables
-- show relrowsecurity = true; the live site (whel.bio) loads with full data.
--
-- Reversible: DROP the policies + ALTER TABLE ... DISABLE ROW LEVEL SECURITY.
-- NOTE: CREATE POLICY does not support IF NOT EXISTS in PostgreSQL; these are
-- one-shot statements. Re-running requires DROP POLICY first.

-- ── Enable RLS on every substrate + side table ───────────────────────────
ALTER TABLE entities                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE source_spans              ENABLE ROW LEVEL SECURITY;
ALTER TABLE claims                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE contradictions            ENABLE ROW LEVEL SECURITY;
ALTER TABLE extraction_runs           ENABLE ROW LEVEL SECURITY;
ALTER TABLE substrate_signals         ENABLE ROW LEVEL SECURITY;
ALTER TABLE compound_pk               ENABLE ROW LEVEL SECURITY;
ALTER TABLE compound_condition_phase  ENABLE ROW LEVEL SECURITY;
ALTER TABLE drug_targets              ENABLE ROW LEVEL SECURITY;
ALTER TABLE target_conditions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE targets                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_requests           ENABLE ROW LEVEL SECURITY;
-- graph_support is a VIEW; RLS is not applicable. Its underlying tables above
-- are now RLS-protected, which gates the view.

-- ── anon SELECT on the tables the public site reads ────────────────────
CREATE POLICY anon_read_substrate_signals
  ON substrate_signals FOR SELECT TO anon USING (true);
CREATE POLICY anon_read_entities
  ON entities FOR SELECT TO anon USING (true);
CREATE POLICY anon_read_claims
  ON claims FOR SELECT TO anon USING (true);
CREATE POLICY anon_read_documents
  ON documents FOR SELECT TO anon USING (true);
CREATE POLICY anon_read_source_spans
  ON source_spans FOR SELECT TO anon USING (true);
CREATE POLICY anon_read_contradictions
  ON contradictions FOR SELECT TO anon USING (true);
CREATE POLICY anon_read_compound_pk
  ON compound_pk FOR SELECT TO anon USING (true);
CREATE POLICY anon_read_compound_condition_phase
  ON compound_condition_phase FOR SELECT TO anon USING (true);

-- ── access_requests: insert-only for anon (the /access form) ────────────
-- No SELECT/UPDATE/DELETE policy → anon cannot read or modify the waitlist.
CREATE POLICY anon_insert_access_requests
  ON access_requests FOR INSERT TO anon WITH CHECK (true);

-- No policy on extraction_runs, drug_targets, target_conditions, targets
-- → anon deny-all (internal tables, admin-only via service_role/dashboard).

-- ── Verify ──────────────────────────────────────────────────────────────
-- Every table should show relrowsecurity = true:
--   SELECT relname, relrowsecurity FROM pg_class c
--   JOIN pg_namespace n ON n.oid = c.relnamespace
--   WHERE n.nspname = 'public' AND c.relkind = 'r' ORDER BY relname;
-- anon policies in place, writes blocked:
--   SELECT c.relname, string_agg(p.polname, ', ') FROM pg_class c
--   JOIN pg_policy p ON p.polrelid = c.oid
--   JOIN pg_namespace n ON n.oid = c.relnamespace
--   WHERE n.nspname = 'public' AND c.relkind = 'r'
--   GROUP BY c.relname ORDER BY c.relname;
