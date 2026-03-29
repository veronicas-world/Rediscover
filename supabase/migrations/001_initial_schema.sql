-- ============================================================
-- ReDiscover — Initial Schema
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. conditions
-- ────────────────────────────────────────────────────────────
CREATE TABLE conditions (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                   text NOT NULL,
  slug                   text NOT NULL UNIQUE,
  description            text,
  prevalence_summary     text,
  treatment_gap_summary  text,
  biology_summary        text,
  underfunding_notes     text,
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now()
);

-- ────────────────────────────────────────────────────────────
-- 2. compounds
-- ────────────────────────────────────────────────────────────
CREATE TABLE compounds (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                 text NOT NULL,
  generic_name         text,
  brand_names          text[],
  original_indication  text,
  mechanism_of_action  text,
  drug_class           text,
  fda_status           text,
  created_at           timestamptz NOT NULL DEFAULT now()
);

-- ────────────────────────────────────────────────────────────
-- 3. repurposing_signals
-- ────────────────────────────────────────────────────────────
CREATE TABLE repurposing_signals (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  condition_id          uuid NOT NULL REFERENCES conditions(id) ON DELETE CASCADE,
  compound_id           uuid NOT NULL REFERENCES compounds(id) ON DELETE CASCADE,
  signal_type           text,
  evidence_strength     text,
  summary               text,
  mechanism_hypothesis  text,
  status                text,
  created_at            timestamptz NOT NULL DEFAULT now()
);

-- ────────────────────────────────────────────────────────────
-- 4. sources
-- ────────────────────────────────────────────────────────────
CREATE TABLE sources (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  signal_id            uuid NOT NULL REFERENCES repurposing_signals(id) ON DELETE CASCADE,
  source_type          text,
  external_id          text,
  title                text,
  authors              text,
  journal              text,
  publication_date     date,
  url                  text,
  key_finding_excerpt  text,
  created_at           timestamptz NOT NULL DEFAULT now()
);

-- ────────────────────────────────────────────────────────────
-- 5. cross_condition_patterns
-- ────────────────────────────────────────────────────────────
CREATE TABLE cross_condition_patterns (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern_description  text,
  compound_ids         uuid[],
  condition_ids        uuid[],
  shared_mechanism     text,
  significance_notes   text,
  created_at           timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE conditions               ENABLE ROW LEVEL SECURITY;
ALTER TABLE compounds                ENABLE ROW LEVEL SECURITY;
ALTER TABLE repurposing_signals      ENABLE ROW LEVEL SECURITY;
ALTER TABLE sources                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE cross_condition_patterns ENABLE ROW LEVEL SECURITY;

-- Anonymous read-only access (public research tool — no login required)

CREATE POLICY "anon_read_conditions"
  ON conditions FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "anon_read_compounds"
  ON compounds FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "anon_read_repurposing_signals"
  ON repurposing_signals FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "anon_read_sources"
  ON sources FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "anon_read_cross_condition_patterns"
  ON cross_condition_patterns FOR SELECT
  TO anon
  USING (true);

-- ============================================================
-- updated_at trigger for conditions
-- ============================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER conditions_set_updated_at
  BEFORE UPDATE ON conditions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
