-- ================================================================
-- 009 — Deduplicate repurposing_signals
-- ================================================================
-- Removes duplicate signals where the same compound_id + condition_id
-- pair appears more than once. For each duplicate group, the signal
-- with the most associated sources is kept; ties go to the oldest row
-- (lowest created_at). All sources and any other FK references to the
-- deleted signals are CASCADE-deleted automatically.
-- ================================================================

BEGIN;

-- ── 1. Identify survivors (one per compound_id + condition_id pair) ──────────

CREATE TEMP TABLE _signal_survivors AS
WITH ranked AS (
  SELECT
    rs.id,
    rs.compound_id,
    rs.condition_id,
    rs.created_at,
    COUNT(src.id) AS source_count,
    ROW_NUMBER() OVER (
      PARTITION BY rs.compound_id, rs.condition_id
      ORDER BY
        COUNT(src.id) DESC,   -- prefer the signal with more sources
        rs.created_at ASC     -- tiebreak: keep the oldest entry
    ) AS rn
  FROM repurposing_signals rs
  LEFT JOIN sources src ON src.signal_id = rs.id
  GROUP BY rs.id, rs.compound_id, rs.condition_id, rs.created_at
)
SELECT
  r_dup.id   AS duplicate_id,
  r_sur.id   AS survivor_id
FROM ranked r_dup
JOIN ranked r_sur
  ON  r_sur.compound_id  = r_dup.compound_id
  AND r_sur.condition_id = r_dup.condition_id
  AND r_sur.rn = 1
WHERE r_dup.rn > 1;

-- Show what will be removed (visible when run interactively)
SELECT
  c.name  AS compound,
  cond.name AS condition,
  s.duplicate_id,
  s.survivor_id
FROM _signal_survivors s
JOIN repurposing_signals rs  ON rs.id  = s.survivor_id
JOIN compounds c             ON c.id   = rs.compound_id
JOIN conditions cond         ON cond.id = rs.condition_id
ORDER BY c.name, cond.name;

-- ── 2. Delete duplicates (sources CASCADE via FK) ─────────────────────────────

DELETE FROM repurposing_signals
WHERE id IN (SELECT duplicate_id FROM _signal_survivors);

-- ── 3. Add a unique constraint to prevent recurrence ─────────────────────────

CREATE UNIQUE INDEX IF NOT EXISTS repurposing_signals_compound_condition_unique
  ON repurposing_signals (compound_id, condition_id);

COMMIT;
