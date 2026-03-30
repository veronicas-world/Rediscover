-- ================================================================
-- 008 — Fix duplicate compounds (case-insensitive deduplication)
-- ================================================================
-- Merges compound rows that differ only by capitalisation.
-- For each group of duplicates, the row with the title-cased name
-- (or alphabetically first if none qualifies) is kept as the survivor.
-- All repurposing_signals are re-pointed to the survivor, then the
-- duplicate rows are deleted.
-- Finally adds a case-insensitive unique index to prevent recurrence.
-- ================================================================

BEGIN;

-- ── 1. Build a temp table mapping every duplicate id → survivor id ──────────

CREATE TEMP TABLE _compound_survivors AS
WITH ranked AS (
  SELECT
    id,
    name,
    LOWER(name) AS name_lower,
    -- Prefer the row whose name matches initcap (title case).
    -- Among equals, prefer the one created first (oldest id wins).
    ROW_NUMBER() OVER (
      PARTITION BY LOWER(name)
      ORDER BY
        CASE WHEN name = INITCAP(name) THEN 0 ELSE 1 END,
        created_at
    ) AS rn
  FROM compounds
)
SELECT
  r_dup.id   AS duplicate_id,
  r_sur.id   AS survivor_id,
  r_sur.name AS survivor_name
FROM ranked r_dup
JOIN ranked r_sur
  ON r_sur.name_lower = r_dup.name_lower
  AND r_sur.rn = 1
WHERE r_dup.rn > 1;   -- only the non-survivors

-- Show what will be merged (visible when run interactively)
SELECT
  survivor_name,
  survivor_id,
  duplicate_id
FROM _compound_survivors
ORDER BY survivor_name;

-- ── 2. Re-point repurposing_signals to the survivor ──────────────────────────

UPDATE repurposing_signals rs
SET compound_id = cs.survivor_id
FROM _compound_survivors cs
WHERE rs.compound_id = cs.duplicate_id;

-- ── 3. Delete the duplicate compound rows ────────────────────────────────────

DELETE FROM compounds
WHERE id IN (SELECT duplicate_id FROM _compound_survivors);

-- ── 4. Normalise surviving names to title case ───────────────────────────────
-- INITCAP handles simple cases (e.g. "atorvastatin" → "Atorvastatin").
-- Drugs with complex capitalisation (e.g. "mTOR inhibitor") should be
-- reviewed manually after this migration.

UPDATE compounds
SET name = INITCAP(name)
WHERE name <> INITCAP(name);

-- ── 5. Add a case-insensitive unique index to prevent future duplicates ───────
-- Uses a functional index on LOWER(name) rather than a column constraint
-- so it catches any combination of upper/lowercase.

CREATE UNIQUE INDEX IF NOT EXISTS compounds_name_lower_unique
  ON compounds (LOWER(name));

COMMIT;
