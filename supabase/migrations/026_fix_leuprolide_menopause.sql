-- 026_fix_leuprolide_menopause.sql
-- Fix clinical contradiction: Leuprolide induces pharmacological menopause, it does not treat it.
-- Reclassify as cross_condition signal with corrected summary explaining its research context value.
-- Generated: 2026-04-15

UPDATE repurposing_signals SET
  signal_type = 'cross_condition',
  confidence_tier = 'Exploratory',
  summary = 'Leuprolide is a GnRH agonist that induces pharmacological menopause by suppressing ovarian estrogen production — it does not treat menopause, it causes it. Its inclusion here is as a cross-condition signal: studying the vasomotor symptoms (VMS), bone loss, and mood effects induced by leuprolide in premenopausal women has directly informed the understanding of menopausal biology and the development of VMS treatments. Leuprolide-induced menopause models have been used in clinical trials to test HRT protocols and non-hormonal interventions. This is a mechanistic and research context entry, not a treatment recommendation.',
  mechanism_hypothesis = 'GnRH agonist-induced downregulation of pituitary GnRH receptors leads to suppression of LH and FSH, causing a hypoestrogenic state that mimics menopause. The resulting vasomotor, skeletal, and neurological changes have been studied as a controlled model of menopausal biology, informing the pathophysiology of natural menopause and the evaluation of therapeutic interventions.'
WHERE compound_id IN (
  SELECT id FROM compounds WHERE name ILIKE '%leuprolide%'
)
AND condition_id IN (
  SELECT id FROM conditions WHERE name ILIKE '%menopause%' OR name ILIKE '%perimenopause%'
);
