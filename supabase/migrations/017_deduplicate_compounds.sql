-- Migration 017: Deduplicate compounds with similar names
--
-- Problem: The same drug was inserted multiple times with slightly different names
-- across pipeline runs, e.g.:
--   "GLP-1 Receptor Agonists"
--   "GLP-1 receptor agonists (Ozempic/Wegovy/Victoza/Semaglutide/Tirzepatide)"
--
-- Strategy:
--   1. Normalize names by stripping parentheticals and lowercasing
--   2. For each group of duplicates, keep the compound with the longest name
--      (most complete), using most recent updated_at as tiebreaker
--   3. Re-point all repurposing_signals from dropped compound IDs to the kept ID
--   4. Delete duplicate signals that now violate the (compound_id, condition_id) unique constraint
--   5. Delete the now-unused compound rows

BEGIN;

-- ── Step 1: Build a temp table of (keep_id, drop_id) pairs ─────────────────

CREATE TEMP TABLE _compound_merge AS
WITH normalized AS (
  SELECT
    id,
    name,
    -- base name: strip everything from first '(' onward, lowercase, trim
    lower(trim(regexp_replace(name, '\s*\(.*$', ''))) AS base_name,
    length(name) AS name_len,
    updated_at
  FROM compounds
),
ranked AS (
  SELECT
    id,
    name,
    base_name,
    name_len,
    -- rank within each base_name group: longest name first, then most recent
    ROW_NUMBER() OVER (
      PARTITION BY base_name
      ORDER BY name_len DESC, updated_at DESC
    ) AS rn
  FROM normalized
)
SELECT
  keep.id  AS keep_id,
  keep.name AS keep_name,
  drop_.id  AS drop_id,
  drop_.name AS drop_name
FROM ranked keep
JOIN ranked drop_ ON keep.base_name = drop_.base_name AND drop_.rn > 1
WHERE keep.rn = 1;

-- Preview what will be merged (read this output before committing)
SELECT keep_name, drop_name FROM _compound_merge ORDER BY keep_name;

-- ── Step 2: Re-point repurposing_signals to the kept compound ───────────────

UPDATE repurposing_signals rs
SET compound_id = m.keep_id
FROM _compound_merge m
WHERE rs.compound_id = m.drop_id;

-- ── Step 3: Delete signals that now duplicate (compound_id, condition_id) ───
-- After the update above, some (compound_id, condition_id) pairs will appear
-- twice. Keep the one with the stronger evidence or most recent updated_at.

DELETE FROM repurposing_signals
WHERE id IN (
  SELECT id FROM (
    SELECT
      id,
      ROW_NUMBER() OVER (
        PARTITION BY compound_id, condition_id
        ORDER BY
          CASE evidence_strength
            WHEN 'strong'      THEN 1
            WHEN 'moderate'    THEN 2
            WHEN 'preliminary' THEN 3
            ELSE 4
          END,
          updated_at DESC
      ) AS rn
    FROM repurposing_signals
  ) ranked
  WHERE rn > 1
);

-- ── Step 4: Delete the now-unused compound rows ─────────────────────────────

DELETE FROM compounds
WHERE id IN (SELECT drop_id FROM _compound_merge);

-- ── Cleanup ──────────────────────────────────────────────────────────────────

DROP TABLE _compound_merge;

COMMIT;
