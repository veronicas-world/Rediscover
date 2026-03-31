-- ================================================================
-- 012 — Rewrite condition text: concise, plain-language descriptions
-- ================================================================

BEGIN;

-- Endometriosis
UPDATE conditions SET
  description          = 'Endometriosis is a chronic inflammatory disease in which tissue similar to the uterine lining grows outside the uterus, on the ovaries, bowel, bladder, and peritoneum. These lesions bleed with every menstrual cycle, causing progressive scarring, adhesions, and infertility.',
  prevalence_summary   = 'Affects 10 to 15% of women of reproductive age, roughly 190 million people worldwide. Rises to 30 to 50% in women with infertility. Remains one of the most underdiagnosed gynecologic conditions globally.',
  treatment_gap_summary= 'No cure exists. Hormonal treatments suppress the disease while in use but symptoms return when stopped. Surgery has recurrence rates up to 50% within five years. No approved drug targets the underlying pathology.',
  biology_summary      = 'Estrogen-dependent and progesterone-resistant. Lesions produce their own estrogen locally and evade immune clearance. They recruit new nerve fibers and blood vessels, explaining the neuropathic pain. Epigenetic changes drive the progesterone resistance.',
  underfunding_notes   = 'Dismissed as normal period pain for decades. Average time to diagnosis is 7 to 10 years. NIH funding per patient is a fraction of comparably prevalent conditions. Surgical laparoscopy remains the only confirmed diagnostic method.'
WHERE slug = 'endometriosis';

-- PMDD
UPDATE conditions SET
  description          = 'PMDD is a severe cyclic disorder in which the brain responds abnormally to normal hormonal changes in the luteal phase. Symptoms include depression, anxiety, and irritability that appear reliably before menstruation and resolve within days of onset. It is distinct from PMS in severity and carries elevated suicide risk in the luteal phase.',
  prevalence_summary   = 'Affects 3 to 8% of menstruating women. Chronically underdiagnosed. Not recognized as a distinct DSM diagnosis until 2013.',
  treatment_gap_summary= 'FDA-approved options are limited to SSRIs and one oral contraceptive. GnRH agonists work but cause bone loss and are unsuitable long-term. No approved drug targets the underlying neurosteroid sensitivity mechanism.',
  biology_summary      = 'Not caused by abnormal hormone levels. The brain in PMDD responds to normal progesterone metabolites with a paradoxical anxiety response instead of the expected calming effect. This points to altered GABA-A receptor sensitivity, not a hormonal imbalance.',
  underfunding_notes   = 'Contested as a pharmaceutical construct for two decades, delaying research investment and clinical training. Receives roughly 1 to 2 million dollars in annual NIH funding despite affecting millions of women.'
WHERE slug = 'pmdd';

-- PCOS
UPDATE conditions SET
  description          = 'PCOS is the most common endocrine disorder in women of reproductive age. It involves elevated androgens, irregular or absent ovulation, and polycystic ovaries. Presentations range from lean women with menstrual irregularity to those with severe insulin resistance and metabolic syndrome. It is the leading cause of anovulatory infertility worldwide.',
  prevalence_summary   = 'Affects 6 to 12% of women by conservative criteria, up to 20% by broader criteria. Between 100 and 200 million people affected globally. Frequently missed in lean presentations.',
  treatment_gap_summary= 'No cure and no single drug addresses the full condition. Management is fragmented across specialists. Metformin is standard of care in most guidelines but has no FDA approval for PCOS. Symptoms return when oral contraceptives are stopped.',
  biology_summary      = 'Elevated LH drives excess androgen production in the ovaries, impairing ovulation. Insulin resistance, present in up to 70% of patients, amplifies androgen production and worsens the hormonal loop. Chronic low-grade inflammation and gut microbiome changes are increasingly recognized contributors.',
  underfunding_notes   = 'Costs the US healthcare system over 4 billion dollars annually. NIH funding for PCOS-specific research was approximately 5.8 million dollars in 2019. The condition''s heterogeneity has complicated both research design and clinical trial development.'
WHERE slug = 'pcos';

-- Adenomyosis
UPDATE conditions SET
  description          = 'Endometrial tissue invades the uterine muscle wall, causing an enlarged uterus, severe period pain, heavy bleeding, and chronic pelvic pain. It frequently coexists with endometriosis and is a major cause of iron deficiency anemia.',
  prevalence_summary   = 'Affects 10 to 25% of women. Prevalence rises to 40 to 50% among women with severe period pain. Often underdiagnosed because it historically required a hysterectomy to confirm.',
  treatment_gap_summary= 'Hysterectomy is the only definitive cure. Hormonal treatments reduce symptoms but do not eliminate the disease. No approved drug targets adenomyosis specifically.',
  biology_summary      = 'Estrogen-dependent and progesterone-resistant, like endometriosis. Invasive cells produce their own estrogen, drive inflammation and fibrosis, and cause abnormal uterine contractions. Epigenetic changes silence progesterone receptors, limiting how much hormonal treatment can help.',
  underfunding_notes   = 'Historically overlooked because diagnosis and treatment both required hysterectomy. Non-invasive diagnostic criteria only improved in the 2010s. No drugs are FDA-approved specifically for adenomyosis as of 2024.'
WHERE slug = 'adenomyosis';

-- Vulvodynia
UPDATE conditions SET
  description          = 'Vulvodynia is chronic vulvar pain lasting at least three months with no identifiable cause. The most common form is provoked vestibulodynia, where pain is triggered by touch at the vaginal opening. It is a leading cause of sexual dysfunction and gynecologic care avoidance.',
  prevalence_summary   = 'Affects 8 to 16% of women across the lifespan. Four in ten affected women never seek care. Average time to correct diagnosis is 3 to 5 years.',
  treatment_gap_summary= 'No FDA-approved treatment exists. Management is entirely off-label: topical anesthetics, neuromodulators, pelvic floor physical therapy, and surgery. The evidence base is weak and clinical guidelines are inconsistent.',
  biology_summary      = 'A pain sensitization disorder, not an infection or inflammatory condition. The vestibular tissue in affected women has 10 times the normal density of pain nerve fibers, with upregulated pain receptors. Brain imaging confirms that central pain processing is also altered.',
  underfunding_notes   = 'Classified as psychosomatic for decades. NIH funding is roughly 2.5 million dollars annually despite lifetime prevalence comparable to asthma. No pharmaceutical industry investment because no approved drug exists to build on.'
WHERE slug = 'vulvodynia';

-- Perimenopause & Menopause
UPDATE conditions SET
  description          = 'Perimenopause is the 4 to 10 year transition before menopause, during which hormones fluctuate and symptoms begin. Menopause is confirmed after 12 consecutive months without a period. Hot flashes and night sweats are the hallmark complaints. Genitourinary changes, mood disruption, and insomnia are common and frequently undertreated.',
  prevalence_summary   = 'Universal for all women with ovaries. 1.3 million US women reach menopause annually. Vasomotor symptoms affect 70 to 80% of women during the transition. One in four describes symptoms as severely disruptive to work and sleep. Symptoms persist for a median of 7 to 10 years.',
  treatment_gap_summary= 'Hormone therapy remains the most effective treatment but is contraindicated or declined by many women. Only two non-hormonal drugs are FDA-approved for hot flashes. All other options including gabapentin, clonidine, and SSRIs are used off-label.',
  biology_summary      = 'Hot flashes are driven by loss of estrogen''s suppression of neurokinin B signaling in the hypothalamus. Rising neurokinin B activity disrupts the thermoregulatory set point, triggering vasodilation and sweating. This pathway is the target of fezolinetant, the newest approved treatment. Serotonin and norepinephrine pathways are also involved, explaining why SSRIs and clonidine help.',
  underfunding_notes   = 'The 2002 WHI study was widely misinterpreted, causing a decade of hormone therapy under-prescribing that left millions of women undertreated. Risk-benefit data has since been substantially rehabilitated. Fewer than 20% of ob-gyn residents feel adequately trained in menopause management.'
WHERE slug = 'perimenopause-menopause';

COMMIT;
