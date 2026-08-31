-- 049_retire_pelvicfloor_vulvodynia_signals.sql
--
-- Retires two vulvodynia signals whose only evidence came from r/PelvicFloor.
--
-- WHY
-- ---
-- An audit of condition filing (August 2026) checked, for every claim behind an
-- active signal, whether the condition it is filed under actually appears in its
-- source. It appears in the paper title for 91% of claims and in the abstract for
-- another 5%. The remaining 4% were all Reddit, where a post does not restate the
-- condition because the subreddit already establishes it.
--
-- Reading the subreddit back out of the stored URL surfaced two posts filed under
-- vulvodynia that were actually posted in r/PelvicFloor:
--
--   "Cymbalta made everything worse"
--     -> filed as: Cymbalta (duloxetine) made vulvodynia symptoms worse
--   "Lexapro made my tight pelvic floor issues completely disappear."
--     -> filed as: Lexapro caused the patient's tight pelvic floor issues to disappear
--
-- Pelvic floor dysfunction overlaps with vulvodynia clinically but is a separate
-- diagnosis, and it is not one of the six conditions this database covers. The
-- claims cannot support a vulvodynia signal.
--
-- Each of these signals was backed by exactly one claim, so removing the claim
-- leaves no evidence behind them at all. They are retired rather than edited.
-- Both were Exploratory tier, the weakest on the scale.
--
-- The claims themselves are left in the claims table. They are a true record of
-- what was extracted, and deleting them would erase the audit trail that found
-- this. They simply no longer back anything shown on the site.
--
-- NOTE: if `status` carries a CHECK constraint that rejects 'retired', the error
-- will name the constraint. Tell me and I will use whatever value it permits.

BEGIN;

-- duloxetine / vulvodynia  (Exploratory) — sole claim 65370cfe-bad9-40be-b1eb-c501a03d55f1
UPDATE substrate_signals SET
  status = 'retired',
  off_topic_reason = 'Sole supporting claim came from r/PelvicFloor, not a vulvodynia source. '
                     'Pelvic floor dysfunction is a distinct diagnosis and out of scope. '
                     'Retired by condition-filing audit, August 2026.',
  updated_at = now()
WHERE id = 'f6e6e8b7-d891-498a-8db6-fb5084e28c6e';

-- escitalopram / vulvodynia  (Exploratory) — sole claim ce88e8b8-a8ea-4627-bee3-cbd132c61cfa
UPDATE substrate_signals SET
  status = 'retired',
  off_topic_reason = 'Sole supporting claim came from r/PelvicFloor, not a vulvodynia source. '
                     'Pelvic floor dysfunction is a distinct diagnosis and out of scope. '
                     'Retired by condition-filing audit, August 2026.',
  updated_at = now()
WHERE id = '608feaaf-6540-472d-aece-2a1eb9e9de18';

COMMIT;

-- Verify (expect 2 rows, both status = 'retired'):
--   SELECT id, status, off_topic_reason
--   FROM substrate_signals
--   WHERE status <> 'active';
