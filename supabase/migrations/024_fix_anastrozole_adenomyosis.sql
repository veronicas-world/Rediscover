-- 024_fix_anastrozole_adenomyosis.sql
-- Fix copy-paste error: Anastrozole summary on Adenomyosis incorrectly referenced endometriosis
-- Generated: 2026-04-15

UPDATE repurposing_signals SET
  summary = 'Anastrozole, a third-generation aromatase inhibitor, targets the overexpression of aromatase (CYP19A1) documented in adenomyotic lesions. Adenomyotic tissue demonstrates significantly elevated local estrogen synthesis compared to normal myometrium, driven by aberrant aromatase activity. By suppressing local estrogen production, anastrozole reduces the estrogen-dependent proliferation, invasion, and inflammatory signaling that characterizes adenomyosis. Small clinical studies and case series have reported reductions in dysmenorrhea, uterine volume, and adenomyosis-associated heavy bleeding.',
  mechanism_hypothesis = 'Adenomyotic lesions overexpress aromatase, enabling autonomous local estrogen synthesis independent of ovarian production. This intratissue estrogen drives epithelial and stromal proliferation, myometrial invasion, and prostaglandin-mediated pain. Anastrozole inhibits CYP19A1, suppressing both systemic and local estrogen levels, thereby reducing the estrogenic drive for lesion growth and the inflammatory cascade responsible for dysmenorrhea and menorrhagia in adenomyosis.'
WHERE compound_id IN (
  SELECT id FROM compounds WHERE name ILIKE '%anastrozole%'
)
AND condition_id IN (
  SELECT id FROM conditions WHERE name ILIKE '%adenomyosis%'
);
