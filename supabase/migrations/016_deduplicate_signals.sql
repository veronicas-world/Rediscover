-- ================================================================
-- 016  Remove duplicate repurposing_signals rows where the same
--      compound appears more than once for the same condition.
--
--      The unique constraint on (compound_id, condition_id) should
--      prevent this, but this migration cleans up any rows that
--      pre-date the constraint or slipped through.
--
--      For each duplicate group, keep the row with the most
--      recently updated evidence_strength (preferring strong >
--      moderate > preliminary), breaking ties by keeping the
--      row with the smallest id.
-- ================================================================

BEGIN;

DELETE FROM repurposing_signals
WHERE id IN (
  SELECT id FROM (
    SELECT id,
           ROW_NUMBER() OVER (
             PARTITION BY compound_id, condition_id
             ORDER BY
               CASE evidence_strength
                 WHEN 'strong'      THEN 1
                 WHEN 'moderate'    THEN 2
                 WHEN 'preliminary' THEN 3
                 ELSE 4
               END,
               id
           ) AS rn
    FROM repurposing_signals
  ) ranked
  WHERE rn > 1
);

COMMIT;
