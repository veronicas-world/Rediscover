-- ================================================================
-- 010 — Fix misplaced signal_type values
-- ================================================================
-- Ensures every signal lands in the correct UI tab:
--
--   Direct Research tab  → clinical_trial_finding | case_report |
--                          mechanism_overlap | review_article
--
--   Cross-Condition tab  → cross_condition_signal | population_study |
--                          observational_study | side_effect_signal |
--                          drug_label_signal | claims_data_analysis
--
--   Pathways tab         → pathway_signal | caution_signal
--
-- Rules applied:
--   1. Signals whose ONLY sources are FAERS must not sit in Direct Research
--      (FAERS is pharmacovigilance data, not a clinical study).
--      → Recategorise to side_effect_signal.
--
--   2. Signals whose ONLY sources are SIDER must not sit in Direct Research
--      or Pathways (drug labels are population-level label data, not RCTs
--      or clinical observations).
--      → Recategorise to drug_label_signal.
--
--   3. Signals whose ONLY sources are clinical_trial but whose signal_type
--      is not a Direct Research type → recategorise to clinical_trial_finding.
--
-- Each UPDATE is wrapped in a diagnostic SELECT so you can see what will
-- change before committing.
-- ================================================================

BEGIN;

-- ── 1. Diagnose: FAERS-only signals in Direct Research types ─────────────────

SELECT
  rs.id,
  c.name  AS compound,
  cond.name AS condition,
  rs.signal_type AS current_type,
  'side_effect_signal' AS will_become
FROM repurposing_signals rs
JOIN compounds  c    ON c.id    = rs.compound_id
JOIN conditions cond ON cond.id = rs.condition_id
WHERE rs.signal_type IN (
    'clinical_trial_finding', 'case_report', 'mechanism_overlap', 'review_article'
  )
  -- has at least one faers source
  AND EXISTS (
    SELECT 1 FROM sources s
    WHERE s.signal_id = rs.id AND s.source_type = 'faers'
  )
  -- has NO non-faers sources (i.e. faers is the sole evidence)
  AND NOT EXISTS (
    SELECT 1 FROM sources s
    WHERE s.signal_id = rs.id AND s.source_type <> 'faers'
  )
ORDER BY c.name, cond.name;

-- ── 1. Fix: FAERS-only signals → side_effect_signal ──────────────────────────

UPDATE repurposing_signals rs
SET signal_type = 'side_effect_signal'
WHERE rs.signal_type IN (
    'clinical_trial_finding', 'case_report', 'mechanism_overlap', 'review_article'
  )
  AND EXISTS (
    SELECT 1 FROM sources s
    WHERE s.signal_id = rs.id AND s.source_type = 'faers'
  )
  AND NOT EXISTS (
    SELECT 1 FROM sources s
    WHERE s.signal_id = rs.id AND s.source_type <> 'faers'
  );

-- ── 2. Diagnose: SIDER-only signals in wrong categories ──────────────────────

SELECT
  rs.id,
  c.name  AS compound,
  cond.name AS condition,
  rs.signal_type AS current_type,
  'drug_label_signal' AS will_become
FROM repurposing_signals rs
JOIN compounds  c    ON c.id    = rs.compound_id
JOIN conditions cond ON cond.id = rs.condition_id
WHERE rs.signal_type NOT IN ('drug_label_signal')
  AND EXISTS (
    SELECT 1 FROM sources s
    WHERE s.signal_id = rs.id AND s.source_type = 'sider'
  )
  AND NOT EXISTS (
    SELECT 1 FROM sources s
    WHERE s.signal_id = rs.id AND s.source_type <> 'sider'
  )
ORDER BY c.name, cond.name;

-- ── 2. Fix: SIDER-only signals → drug_label_signal ───────────────────────────

UPDATE repurposing_signals rs
SET signal_type = 'drug_label_signal'
WHERE rs.signal_type <> 'drug_label_signal'
  AND EXISTS (
    SELECT 1 FROM sources s
    WHERE s.signal_id = rs.id AND s.source_type = 'sider'
  )
  AND NOT EXISTS (
    SELECT 1 FROM sources s
    WHERE s.signal_id = rs.id AND s.source_type <> 'sider'
  );

-- ── 3. Diagnose: clinical_trial-only signals with wrong type ─────────────────

SELECT
  rs.id,
  c.name  AS compound,
  cond.name AS condition,
  rs.signal_type AS current_type,
  'clinical_trial_finding' AS will_become
FROM repurposing_signals rs
JOIN compounds  c    ON c.id    = rs.compound_id
JOIN conditions cond ON cond.id = rs.condition_id
WHERE rs.signal_type NOT IN (
    'clinical_trial_finding', 'case_report', 'mechanism_overlap', 'review_article'
  )
  AND EXISTS (
    SELECT 1 FROM sources s
    WHERE s.signal_id = rs.id AND s.source_type = 'clinical_trial'
  )
  AND NOT EXISTS (
    SELECT 1 FROM sources s
    WHERE s.signal_id = rs.id AND s.source_type <> 'clinical_trial'
  )
ORDER BY c.name, cond.name;

-- ── 3. Fix: clinical_trial-only signals → clinical_trial_finding ─────────────

UPDATE repurposing_signals rs
SET signal_type = 'clinical_trial_finding'
WHERE rs.signal_type NOT IN (
    'clinical_trial_finding', 'case_report', 'mechanism_overlap', 'review_article'
  )
  AND EXISTS (
    SELECT 1 FROM sources s
    WHERE s.signal_id = rs.id AND s.source_type = 'clinical_trial'
  )
  AND NOT EXISTS (
    SELECT 1 FROM sources s
    WHERE s.signal_id = rs.id AND s.source_type <> 'clinical_trial'
  );

-- ── 4. Audit: any remaining unrecognised signal_types ────────────────────────
-- These will fall into Cross-Condition by the UI fallback; log them for review.

SELECT
  rs.signal_type,
  COUNT(*) AS signal_count
FROM repurposing_signals rs
WHERE rs.signal_type NOT IN (
  -- Direct Research
  'clinical_trial_finding', 'case_report', 'mechanism_overlap', 'review_article',
  -- Cross-Condition
  'cross_condition_signal', 'population_study', 'observational_study',
  'side_effect_signal', 'drug_label_signal', 'claims_data_analysis',
  -- Pathways
  'pathway_signal', 'caution_signal'
)
GROUP BY rs.signal_type
ORDER BY signal_count DESC;

COMMIT;
