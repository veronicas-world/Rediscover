-- ================================================================
-- 011 — Source-type audit
-- ================================================================
-- This is a read-only diagnostic migration. It does not change any
-- data. Run it to understand the current distribution of source_type
-- and signal_type values so the frontend tab-routing logic can be
-- verified against real data.
--
-- Tab routing rules (implemented in ResearchSignalsTabs.tsx):
--   signal_type IN ('pathway_signal','caution_signal') → Pathways (override)
--   source_type IN ('faers','sider')                   → Cross-Condition
--   source_type IN ('pubmed','clinical_trial')          → Direct Research
--   no sources / unknown source_type                   → Direct Research (default)
-- ================================================================

-- 1. All distinct source_type values with counts
SELECT
  source_type,
  COUNT(*) AS source_rows
FROM sources
GROUP BY source_type
ORDER BY source_rows DESC;

-- 2. All distinct signal_type values with counts
SELECT
  signal_type,
  COUNT(*) AS signal_count
FROM repurposing_signals
GROUP BY signal_type
ORDER BY signal_count DESC;

-- 3. Tab routing preview: which tab each signal resolves to
SELECT
  rs.id,
  c.name   AS compound,
  cond.name AS condition,
  rs.signal_type,
  -- Determine which tab this signal will land in
  CASE
    WHEN rs.signal_type IN ('pathway_signal', 'caution_signal')
      THEN 'Pathways'
    WHEN EXISTS (
      SELECT 1 FROM sources s
      WHERE s.signal_id = rs.id AND s.source_type IN ('faers', 'sider')
    )
      THEN 'Cross-Condition'
    WHEN EXISTS (
      SELECT 1 FROM sources s
      WHERE s.signal_id = rs.id AND s.source_type IN ('pubmed', 'clinical_trial')
    )
      THEN 'Direct Research'
    ELSE 'Direct Research (no sources)'
  END AS resolved_tab,
  -- Summary of source types attached to this signal
  COALESCE(
    STRING_AGG(DISTINCT s.source_type, ', ' ORDER BY s.source_type),
    '(none)'
  ) AS source_types
FROM repurposing_signals rs
JOIN compounds  c    ON c.id    = rs.compound_id
JOIN conditions cond ON cond.id = rs.condition_id
LEFT JOIN sources s ON s.signal_id = rs.id
WHERE rs.status = 'active'
GROUP BY rs.id, c.name, cond.name, rs.signal_type
ORDER BY resolved_tab, cond.name, c.name;

-- 4. Signals with NO sources (will default to Direct Research)
SELECT
  rs.id,
  c.name    AS compound,
  cond.name AS condition,
  rs.signal_type
FROM repurposing_signals rs
JOIN compounds  c    ON c.id    = rs.compound_id
JOIN conditions cond ON cond.id = rs.condition_id
WHERE NOT EXISTS (
  SELECT 1 FROM sources s WHERE s.signal_id = rs.id
)
ORDER BY cond.name, c.name;
