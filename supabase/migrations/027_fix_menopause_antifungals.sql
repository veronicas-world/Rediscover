-- 027_fix_menopause_antifungals.sql
-- Fix scope creep: Oteseconazole and Ibrexafungerp are antifungals approved for
-- vulvovaginal candidiasis, not menopausal symptom treatments.
-- Reframe as cross-condition signals with explicit clinical context explaining
-- the connection between menopausal physiology and elevated candidiasis risk.
-- Generated: 2026-04-19

UPDATE repurposing_signals SET
  signal_type = 'cross_condition',
  confidence_tier = 'Exploratory',
  summary = 'Oteseconazole is an FDA-approved antifungal for recurrent vulvovaginal candidiasis (RVVC). Its inclusion on the menopause page reflects an associated condition context: postmenopausal women experience significantly elevated rates of vulvovaginal atrophy and recurrent candidiasis due to estrogen-mediated changes in vaginal pH and microbiome. This is not a treatment for menopausal symptoms — it is included to surface the connection between menopausal physiology and increased candidiasis susceptibility, and to flag that managing RVVC is a clinically relevant consideration in menopausal care.'
WHERE compound_id IN (
  SELECT id FROM compounds WHERE name ILIKE '%oteseconazole%'
)
AND condition_id IN (
  SELECT id FROM conditions WHERE name ILIKE '%menopause%' OR name ILIKE '%perimenopause%'
);

UPDATE repurposing_signals SET
  signal_type = 'cross_condition',
  confidence_tier = 'Exploratory',
  summary = 'Ibrexafungerp is an FDA-approved antifungal for vulvovaginal candidiasis. Its inclusion on the menopause page reflects an associated condition context: the hypoestrogenic state of menopause alters vaginal epithelial integrity and microbiome composition, significantly increasing susceptibility to recurrent candidiasis. This is not a treatment for menopausal symptoms — it is included to surface the connection between menopausal physiology and elevated candidiasis risk as a clinically relevant associated condition.'
WHERE compound_id IN (
  SELECT id FROM compounds WHERE name ILIKE '%ibrexafungerp%'
)
AND condition_id IN (
  SELECT id FROM conditions WHERE name ILIKE '%menopause%' OR name ILIKE '%perimenopause%'
);
