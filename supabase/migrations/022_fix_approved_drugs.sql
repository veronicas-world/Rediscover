-- 022_fix_approved_drugs.sql
-- Fix approved drug misclassifications in compounds and repurposing_signals
-- Generated: 2026-04-15

-- ============================================================
-- 1. ELAGOLIX
-- ============================================================
-- Delete the standalone Elagolix exploratory 0/10 signal and its sources.
-- GnRH Antagonists compound (Strong 10/10) correctly represents this class.

DELETE FROM sources
WHERE signal_id IN (
  SELECT rs.id FROM repurposing_signals rs
  JOIN compounds c ON c.id = rs.compound_id
  WHERE c.name ILIKE '%elagolix%'
    AND rs.confidence_tier = 'Exploratory'
    AND rs.replication_score = 0
    AND rs.source_quality_score = 0
);

DELETE FROM repurposing_signals
WHERE compound_id IN (
  SELECT id FROM compounds WHERE name ILIKE '%elagolix%'
)
AND confidence_tier = 'Exploratory'
AND replication_score = 0
AND source_quality_score = 0;

UPDATE compounds SET
  fda_status = 'FDA-Approved (2018) — Endometriosis'
WHERE name ILIKE '%elagolix%';

-- ============================================================
-- 2. FEZOLINETANT
-- ============================================================
-- FDA-approved May 2023. Reclassify as approved_treatment, not a repurposing signal.

UPDATE compounds SET
  fda_status = 'FDA-Approved (2023) — Menopausal Vasomotor Symptoms'
WHERE name ILIKE '%fezolinetant%';

UPDATE repurposing_signals SET
  signal_type    = 'approved_treatment',
  confidence_tier = 'Strong',
  replication_score   = 2,
  source_quality_score = 2,
  specificity_score   = 2,
  plausibility_score  = 2,
  direction_score     = 2,
  summary = 'FDA-approved May 2023 for menopausal vasomotor symptoms (hot flashes). Selective NK3 receptor antagonist targeting the KNDy neuron pathway in the hypothalamus. This is an approved treatment, not a repurposing candidate — the signal was included for completeness but should not be interpreted as exploratory evidence.'
WHERE compound_id IN (
  SELECT id FROM compounds WHERE name ILIKE '%fezolinetant%'
);

-- ============================================================
-- 3. TRANSDERMAL ESTRADIOL
-- ============================================================
-- Gold-standard FDA-approved HRT for menopause. Reclassify as approved_treatment.

UPDATE compounds SET
  fda_status = 'FDA-Approved — Hormone Replacement Therapy (Menopause)'
WHERE name ILIKE '%transdermal estradiol%';

UPDATE repurposing_signals SET
  signal_type    = 'approved_treatment',
  confidence_tier = 'Strong',
  replication_score   = 2,
  source_quality_score = 2,
  specificity_score   = 2,
  plausibility_score  = 2,
  direction_score     = 2,
  summary = 'FDA-approved standard of care for menopausal hormone replacement therapy. Transdermal delivery provides stable estradiol levels while minimizing first-pass hepatic metabolism. Extensive RCT evidence supports efficacy for vasomotor symptoms, genitourinary syndrome, and bone density preservation. This is a primary approved treatment, not a repurposing signal.'
WHERE compound_id IN (
  SELECT id FROM compounds WHERE name ILIKE '%transdermal estradiol%'
);

-- ============================================================
-- 4. DIENOGEST
-- ============================================================
-- Endometriosis: EU/Japan approved — elevate to Strong (9/10)

UPDATE repurposing_signals SET
  confidence_tier      = 'Strong',
  replication_score    = 2,
  source_quality_score = 2,
  specificity_score    = 2,
  plausibility_score   = 2,
  direction_score      = 1,
  summary = 'Approved for endometriosis in the EU (2009) and Japan. Progestin with anti-proliferative and anti-inflammatory effects on ectopic endometrial tissue via downregulation of estrogen receptor expression. Multiple RCTs demonstrate efficacy comparable to GnRH analogues with a more favorable tolerability profile. Not FDA-approved in the US; available off-label.'
WHERE compound_id IN (
  SELECT id FROM compounds WHERE name ILIKE '%dienogest%'
)
AND condition_id IN (
  SELECT id FROM conditions WHERE name ILIKE '%endometriosis%'
);

UPDATE compounds SET
  fda_status = 'Approved (EU/Japan) — Endometriosis'
WHERE name ILIKE '%dienogest%';

-- Adenomyosis: off-label use, keep as repurposing signal.
-- Append off-label clarification to summary if not already present.
UPDATE repurposing_signals SET
  summary = summary || ' Off-label use for adenomyosis; not formally approved for this indication but supported by observational studies and small RCTs.'
WHERE compound_id IN (
  SELECT id FROM compounds WHERE name ILIKE '%dienogest%'
)
AND condition_id IN (
  SELECT id FROM conditions WHERE name ILIKE '%adenomyosis%'
)
AND summary NOT ILIKE '%off-label%'
AND summary NOT ILIKE '%off label%';
