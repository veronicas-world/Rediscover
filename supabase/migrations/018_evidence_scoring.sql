-- Evidence Scoring Framework
-- Adds multi-dimension scoring columns to repurposing_signals
-- Generated: 2026-04-13

ALTER TABLE repurposing_signals
  ADD COLUMN IF NOT EXISTS confidence_tier text CHECK (confidence_tier IN ('Exploratory','Emerging','Moderate','Strong')),
  ADD COLUMN IF NOT EXISTS replication_score integer CHECK (replication_score BETWEEN 0 AND 2),
  ADD COLUMN IF NOT EXISTS source_quality_score integer CHECK (source_quality_score BETWEEN 0 AND 2),
  ADD COLUMN IF NOT EXISTS specificity_score integer CHECK (specificity_score BETWEEN 0 AND 2),
  ADD COLUMN IF NOT EXISTS plausibility_score integer CHECK (plausibility_score BETWEEN 0 AND 2),
  ADD COLUMN IF NOT EXISTS direction_score integer CHECK (direction_score BETWEEN 0 AND 2),
  ADD COLUMN IF NOT EXISTS total_evidence_score integer GENERATED ALWAYS AS (
    COALESCE(replication_score, 0) + COALESCE(source_quality_score, 0) +
    COALESCE(specificity_score, 0) + COALESCE(plausibility_score, 0) +
    COALESCE(direction_score, 0)
  ) STORED,
  ADD COLUMN IF NOT EXISTS effect_direction text CHECK (effect_direction IN ('improves','worsens','mixed','unclear')),
  ADD COLUMN IF NOT EXISTS replication_level text CHECK (replication_level IN ('Low','Medium','High')),
  ADD COLUMN IF NOT EXISTS plausibility_level text CHECK (plausibility_level IN ('Low','Medium','High'));

-- Backfill confidence_tier for existing rows based on evidence_strength
-- (evidence_strength is the legacy text field set by pipelines)
UPDATE repurposing_signals
SET confidence_tier = CASE evidence_strength
  WHEN 'Strong'      THEN 'Strong'
  WHEN 'Moderate'    THEN 'Moderate'
  WHEN 'Preliminary' THEN 'Emerging'
  WHEN 'Theoretical' THEN 'Exploratory'
  ELSE 'Exploratory'
END
WHERE confidence_tier IS NULL;
