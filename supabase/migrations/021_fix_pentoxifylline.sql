-- 021_fix_pentoxifylline.sql
-- Fix pharmacology error: Pentoxifylline is NOT a PDE5 inhibitor
-- Correct classification: non-selective PDE3/4 inhibitor + TNF-alpha inhibitor (xanthine derivative)
-- Generated: 2026-04-15

-- Fix drug_class on compounds
UPDATE compounds SET
  drug_class = 'PDE3/4 inhibitor / TNF-alpha inhibitor (xanthine derivative)'
WHERE name ILIKE '%pentoxifylline%';

-- Fix any mechanism_hypothesis text that incorrectly references PDE5
UPDATE repurposing_signals SET
  mechanism_hypothesis = REPLACE(mechanism_hypothesis, 'PDE5', 'PDE3/4')
WHERE compound_id IN (
  SELECT id FROM compounds WHERE name ILIKE '%pentoxifylline%'
)
AND mechanism_hypothesis ILIKE '%PDE5%';

-- Fix any summary text that incorrectly references PDE5
UPDATE repurposing_signals SET
  summary = REPLACE(summary, 'PDE5', 'PDE3/4')
WHERE compound_id IN (
  SELECT id FROM compounds WHERE name ILIKE '%pentoxifylline%'
)
AND summary ILIKE '%PDE5%';
