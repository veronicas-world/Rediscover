-- Migration 017: Deduplicate compounds with similar names
--
-- Problem: The same drug was inserted multiple times with slightly different names
-- across pipeline runs, e.g.:
--   "GLP-1 Receptor Agonists"
--   "GLP-1 receptor agonists (Ozempic/Wegovy/Victoza/Semaglutide/Tirzepatide)"
--
-- Strategy:
--   1. Build a (keep_id, drop_id) merge table using normalized name matching
--   2. Delete all signals where compound_id = drop_id
--   3. Delete the now-unused compound rows

BEGIN;

-- ── Step 1: Build a temp table of (keep_id, drop_id) pairs ─────────────────

CREATE TEMP TABLE _compound_merge AS
WITH normalized AS (
  SELECT
    id,
    name,
    lower(trim(regexp_replace(name, '\s*\(.*$', ''))) AS base_name,
    length(name) AS name_len,
    created_at
  FROM compounds
),
ranked AS (
  SELECT
    id,
    name,
    base_name,
    name_len,
    ROW_NUMBER() OVER (
      PARTITION BY base_name
      ORDER BY name_len DESC, created_at DESC
    ) AS rn
  FROM normalized
)
SELECT
  keep.id   AS keep_id,
  keep.name AS keep_name,
  drop_.id  AS drop_id,
  drop_.name AS drop_name
FROM ranked keep
JOIN ranked drop_ ON keep.base_name = drop_.base_name AND drop_.rn > 1
WHERE keep.rn = 1;

-- Preview what will be deleted (read before committing)
SELECT keep_name, drop_name FROM _compound_merge ORDER BY keep_name;

-- ── Step 2: Delete all signals belonging to the duplicate compounds ─────────

DELETE FROM repurposing_signals
WHERE compound_id IN (SELECT drop_id FROM _compound_merge);

-- ── Step 3: Delete the now-unused compound rows ─────────────────────────────

DELETE FROM compounds
WHERE id IN (SELECT drop_id FROM _compound_merge);

-- ── Cleanup ──────────────────────────────────────────────────────────────────

DROP TABLE _compound_merge;

COMMIT;
