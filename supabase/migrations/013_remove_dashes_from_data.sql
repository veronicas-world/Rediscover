-- ================================================================
-- 013  Remove em dashes, en dashes, and avoidable compound-word
--      hyphens from stored text in conditions and repurposing_signals.
--
-- Strategy
--   En dashes in numeric ranges  e.g. "3–5 months"  → "3 to 5 months"
--   Em dashes before a capital   e.g. "word — Word"  → "word. Word"
--   Em dashes before lowercase   e.g. "word — word"  → "word, word"
--   Compound-word hyphens        explicit REPLACE for common patterns
--
-- Scientific proper names (GABA-A, 5α-reductase, ERα, CYP17A1, etc.)
-- are NOT changed by this migration.
-- ================================================================

BEGIN;

-- ── Helper: chain of replacements applied to every long-text column ───────────
-- We use a nested series of regexp_replace / replace calls.
-- Postgres processes them left-to-right within each expression.

-- ── 1. conditions table ───────────────────────────────────────────────────────
-- (Migration 012 already rewrote these fields cleanly, but this migration
--  re-applies the rules as a safety net and covers any rows added since.)

UPDATE conditions SET
  description = (
    SELECT val FROM (
      SELECT
        replace(
          replace(
            replace(
              regexp_replace(
                regexp_replace(
                  regexp_replace(description,
                    '(\d[\d,.]*)\s*–\s*(\d)', '\1 to \2', 'g'),   -- en dash ranges
                  '\s*—\s*([A-Z])', '. \1', 'g'),                  -- em dash + capital
                '\s*—\s*', ', ', 'g'),                              -- em dash + lowercase
              'peer-reviewed', 'peer reviewed'),
            'off-label', 'off label'),
          'non-invasive', 'noninvasive')
      AS val
    ) t
  ),
  prevalence_summary = (
    SELECT val FROM (
      SELECT
        replace(
          replace(
            replace(
              regexp_replace(
                regexp_replace(
                  regexp_replace(prevalence_summary,
                    '(\d[\d,.]*)\s*–\s*(\d)', '\1 to \2', 'g'),
                  '\s*—\s*([A-Z])', '. \1', 'g'),
                '\s*—\s*', ', ', 'g'),
              'peer-reviewed', 'peer reviewed'),
            'off-label', 'off label'),
          'non-invasive', 'noninvasive')
      AS val
    ) t
  ),
  treatment_gap_summary = (
    SELECT val FROM (
      SELECT
        replace(
          replace(
            replace(
              regexp_replace(
                regexp_replace(
                  regexp_replace(treatment_gap_summary,
                    '(\d[\d,.]*)\s*–\s*(\d)', '\1 to \2', 'g'),
                  '\s*—\s*([A-Z])', '. \1', 'g'),
                '\s*—\s*', ', ', 'g'),
              'peer-reviewed', 'peer reviewed'),
            'off-label', 'off label'),
          'non-invasive', 'noninvasive')
      AS val
    ) t
  ),
  biology_summary = (
    SELECT val FROM (
      SELECT
        replace(
          replace(
            replace(
              regexp_replace(
                regexp_replace(
                  regexp_replace(biology_summary,
                    '(\d[\d,.]*)\s*–\s*(\d)', '\1 to \2', 'g'),
                  '\s*—\s*([A-Z])', '. \1', 'g'),
                '\s*—\s*', ', ', 'g'),
              'peer-reviewed', 'peer reviewed'),
            'off-label', 'off label'),
          'non-invasive', 'noninvasive')
      AS val
    ) t
  ),
  underfunding_notes = (
    SELECT val FROM (
      SELECT
        replace(
          replace(
            replace(
              regexp_replace(
                regexp_replace(
                  regexp_replace(underfunding_notes,
                    '(\d[\d,.]*)\s*–\s*(\d)', '\1 to \2', 'g'),
                  '\s*—\s*([A-Z])', '. \1', 'g'),
                '\s*—\s*', ', ', 'g'),
              'peer-reviewed', 'peer reviewed'),
            'off-label', 'off label'),
          'non-invasive', 'noninvasive')
      AS val
    ) t
  )
WHERE
  description          ~  '[–—]|peer-reviewed|off-label|non-invasive'
  OR prevalence_summary ~  '[–—]'
  OR treatment_gap_summary ~ '[–—]'
  OR biology_summary    ~  '[–—]'
  OR underfunding_notes ~  '[–—]|peer-reviewed|off-label';

-- ── 2. repurposing_signals table ─────────────────────────────────────────────

UPDATE repurposing_signals SET
  summary = (
    SELECT val FROM (
      SELECT
        replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(
          regexp_replace(
            regexp_replace(
              regexp_replace(summary,
                '(\d[\d,.]*)\s*–\s*(\d)', '\1 to \2', 'g'),
              '\s*—\s*([A-Z])', '. \1', 'g'),
            '\s*—\s*', ', ', 'g'),
          'peer-reviewed',      'peer reviewed'),
          'off-label',          'off label'),
          'double-blind',       'double blind'),
          'placebo-controlled', 'placebo controlled'),
          'long-term',          'long term'),
          'short-term',         'short term'),
          'first-line',         'first line'),
          'second-line',        'second line'),
          'well-established',   'well established'),
          'low-grade',          'low grade'),
          'high-dose',          'high dose'),
          'low-dose',           'low dose'),
          'pre-existing',       'preexisting'),
          'non-hormonal',       'nonhormonal')
      AS val
    ) t
  ),
  mechanism_hypothesis = (
    SELECT val FROM (
      SELECT
        replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(
          regexp_replace(
            regexp_replace(
              regexp_replace(mechanism_hypothesis,
                '(\d[\d,.]*)\s*–\s*(\d)', '\1 to \2', 'g'),
              '\s*—\s*([A-Z])', '. \1', 'g'),
            '\s*—\s*', ', ', 'g'),
          'peer-reviewed',      'peer reviewed'),
          'off-label',          'off label'),
          'double-blind',       'double blind'),
          'placebo-controlled', 'placebo controlled'),
          'long-term',          'long term'),
          'short-term',         'short term'),
          'first-line',         'first line'),
          'second-line',        'second line'),
          'well-established',   'well established'),
          'low-grade',          'low grade'),
          'high-dose',          'high dose'),
          'low-dose',           'low dose'),
          'pre-existing',       'preexisting'),
          'non-hormonal',       'nonhormonal')
      AS val
    ) t
  )
WHERE
  summary              ~ '[–—]|peer-reviewed|off-label|double-blind|placebo-controlled|long-term|short-term|first-line|second-line|well-established|low-grade|high-dose|low-dose|pre-existing|non-hormonal'
  OR mechanism_hypothesis ~ '[–—]|peer-reviewed|off-label|double-blind|placebo-controlled|long-term|short-term|first-line|second-line|well-established|low-grade|high-dose|low-dose|pre-existing|non-hormonal';

-- ── 3. sources table (title, key_finding_excerpt) ─────────────────────────────

UPDATE sources SET
  title = (
    SELECT val FROM (
      SELECT
        replace(replace(
          regexp_replace(
            regexp_replace(
              regexp_replace(title,
                '(\d[\d,.]*)\s*–\s*(\d)', '\1 to \2', 'g'),
              '\s*—\s*([A-Z])', '. \1', 'g'),
            '\s*—\s*', ', ', 'g'),
          'peer-reviewed', 'peer reviewed'),
          'off-label',     'off label')
      AS val
    ) t
  ),
  key_finding_excerpt = (
    SELECT val FROM (
      SELECT
        replace(replace(
          regexp_replace(
            regexp_replace(
              regexp_replace(key_finding_excerpt,
                '(\d[\d,.]*)\s*–\s*(\d)', '\1 to \2', 'g'),
              '\s*—\s*([A-Z])', '. \1', 'g'),
            '\s*—\s*', ', ', 'g'),
          'peer-reviewed', 'peer reviewed'),
          'off-label',     'off label')
      AS val
    ) t
  )
WHERE
  title               ~ '[–—]|peer-reviewed|off-label'
  OR key_finding_excerpt ~ '[–—]|peer-reviewed|off-label';

COMMIT;
