-- Migration 017: Deduplicate compounds with similar names
--
-- Problem: The same drug was inserted multiple times with slightly different names
-- across pipeline runs, e.g.:
--   "GLP-1 Receptor Agonists"
--   "GLP-1 receptor agonists (Ozempic/Wegovy/Victoza/Semaglutide/Tirzepatide)"
--
-- Strategy:
--   1.  Build a (keep_id, drop_id) merge table
--   1b. Pre-resolve conflicts: for every condition where BOTH compounds already
--       have a signal, delete the weaker one so Step 2 never hits a unique violation
--   2.  Re-point remaining drop_id signals to keep_id
--   3.  Safety-net dedup (catches any stragglers)
--   4.  Delete the now-unused compound rows

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
    created_at
  FROM compounds
),
ranked AS (
  SELECT
    id,
    name,
    base_name,
    name_len,
    -- rank within each base_name group: longest name first, then most recently created
    ROW_NUMBER() OVER (
      PARTITION BY base_name
      ORDER BY name_len DESC, created_at DESC
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

-- ── Step 1b: Pre-resolve unique-constraint conflicts ────────────────────────
-- For every condition where BOTH keep_id and drop_id already have a signal,
-- delete the weaker one now so Step 2's UPDATE cannot violate the constraint.
-- When keep_id's signal is stronger (or equal), delete drop_id's signal.
-- When drop_id's signal is stronger, delete keep_id's signal so it can be
-- replaced by the re-pointed drop signal in Step 2.

DELETE FROM repurposing_signals
WHERE id IN (
  SELECT
    CASE
      WHEN
        CASE s_keep.evidence_strength
          WHEN 'strong'      THEN 1
          WHEN 'moderate'    THEN 2
          WHEN 'preliminary' THEN 3
          ELSE 4
        END
        <=
        CASE s_drop.evidence_strength
          WHEN 'strong'      THEN 1
          WHEN 'moderate'    THEN 2
          WHEN 'preliminary' THEN 3
          ELSE 4
        END
      -- keep_id signal is at least as strong: discard the drop_id signal
      THEN s_drop.id
      -- drop_id signal is stronger: discard the keep_id signal so the
      -- re-pointed drop signal can take its place
      ELSE s_keep.id
    END AS id_to_delete
  FROM _compound_merge m
  JOIN repurposing_signals s_keep
    ON s_keep.compound_id = m.keep_id
  JOIN repurposing_signals s_drop
    ON s_drop.compound_id = m.drop_id
   AND s_drop.condition_id = s_keep.condition_id
);

-- ── Step 2: Re-point remaining drop_id signals to the kept compound ─────────

UPDATE repurposing_signals rs
SET compound_id = m.keep_id
FROM _compound_merge m
WHERE rs.compound_id = m.drop_id;

-- ── Step 3: Safety-net dedup ─────────────────────────────────────────────────
-- Catches any remaining (compound_id, condition_id) duplicates.

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
