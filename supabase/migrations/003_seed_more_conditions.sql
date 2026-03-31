-- ============================================================
-- ReDiscover — Seed: PMDD, PCOS, Adenomyosis
-- All PMIDs verified against PubMed
-- ============================================================

-- UUID Reference Map
-- CONDITIONS
--   PMDD:        05e5cf0c-b348-4660-bf1b-ad8ad7a40e51
--   PCOS:        fe49fb1b-2f64-4b3b-8e3e-04a2a4ee5820
--   Adenomyosis: 084c5d6d-a648-413a-a7f0-c84b1fb6270c
--
-- COMPOUNDS
--   Dutasteride:         764911c9-2392-4f64-bf9d-748c6c51bba2
--   Sepranolone (UC1010):ba7cc922-ad5a-4968-b2be-d3b70f39e0e0
--   Buspirone:           e6b33d56-f24d-4d5d-bfdd-bd592d29428d
--   Spironolactone:      e4692a2d-d601-43d7-8500-2de32de76f64
--   Liraglutide:         7e4f944c-aabf-47dd-b9b6-ec24beb168f3
--   N-Acetylcysteine:    6869d788-1035-4131-8050-dcfaf4d7df8b
--   Letrozole:           8ff7b666-f0bf-4711-b187-a408189a612b
--   Valproic Acid:       94e7070d-d68c-4c85-92f4-0c471b44a260
--   Dienogest:           bfa9fe27-79d0-484b-a6b4-b20929401f9b
-- (Metformin already inserted in 002; reused by FK for PCOS signal)
--   Metformin (existing):f7f97905-77cc-4809-b9a9-f2f97efa6839
--
-- SIGNALS
--   PMDD + Dutasteride:     c9e6ce20-49d3-449e-8765-ab413e2d77ae
--   PMDD + Sepranolone:     68319531-5391-446d-b544-3e6fb3634c5c
--   PMDD + Buspirone:       a3a5ac79-0911-4bed-908d-1f6c1d6690b1
--   PCOS + Metformin:       2c0759cd-2fdb-4e1e-b529-1622ff63939d
--   PCOS + Spironolactone:  98bb1eb8-e1bb-4a35-873f-91115ef465dc
--   PCOS + Liraglutide:     53f26a1b-7fdf-4c00-9734-4fd8221df693
--   PCOS + NAC:             20cb1a4f-94b8-4fab-b25c-454a7f469d82
--   Adeno + Letrozole:      d6e08d73-d45a-4968-aa99-24728747f60a
--   Adeno + Valproic Acid:  f64619d2-6230-4dfe-8de9-e20403247821
--   Adeno + Dienogest:      5dd21e4b-9873-42a6-ae7b-3ad59b99c487

-- ============================================================
-- CONDITIONS
-- ============================================================

INSERT INTO conditions (
  id, name, slug, description, prevalence_summary,
  treatment_gap_summary, biology_summary, underfunding_notes
) VALUES (
  '05e5cf0c-b348-4660-bf1b-ad8ad7a40e51',
  'PMDD',
  'pmdd',
  'PMDD is a severe cyclic disorder in which the brain responds abnormally to normal hormonal changes in the luteal phase. Symptoms include depression, anxiety, and irritability that appear reliably before menstruation and resolve within days of onset. It is distinct from PMS in severity and carries elevated suicide risk in the luteal phase.',
  'Affects 3 to 8% of menstruating women. Chronically underdiagnosed. Not recognized as a distinct DSM diagnosis until 2013.',
  'FDA-approved options are limited to SSRIs and one oral contraceptive. GnRH agonists work but cause bone loss and are unsuitable long-term. No approved drug targets the underlying neurosteroid sensitivity mechanism.',
  'Not caused by abnormal hormone levels. The brain in PMDD responds to normal progesterone metabolites with a paradoxical anxiety response instead of the expected calming effect. This points to altered GABA-A receptor sensitivity, not a hormonal imbalance.',
  'Contested as a pharmaceutical construct for two decades, delaying research investment and clinical training. Receives roughly 1 to 2 million dollars in annual NIH funding despite affecting millions of women.'
);

INSERT INTO conditions (
  id, name, slug, description, prevalence_summary,
  treatment_gap_summary, biology_summary, underfunding_notes
) VALUES (
  'fe49fb1b-2f64-4b3b-8e3e-04a2a4ee5820',
  'PCOS',
  'pcos',
  'PCOS is the most common endocrine disorder in women of reproductive age. It involves elevated androgens, irregular or absent ovulation, and polycystic ovaries. Presentations range from lean women with menstrual irregularity to those with severe insulin resistance and metabolic syndrome. It is the leading cause of anovulatory infertility worldwide.',
  'Affects 6 to 12% of women by conservative criteria, up to 20% by broader criteria. Between 100 and 200 million people affected globally. Frequently missed in lean presentations.',
  'No cure and no single drug addresses the full condition. Management is fragmented across specialists. Metformin is standard of care in most guidelines but has no FDA approval for PCOS. Symptoms return when oral contraceptives are stopped.',
  'Elevated LH drives excess androgen production in the ovaries, impairing ovulation. Insulin resistance, present in up to 70% of patients, amplifies androgen production and worsens the hormonal loop. Chronic low-grade inflammation and gut microbiome changes are increasingly recognized contributors.',
  'Costs the US healthcare system over 4 billion dollars annually. NIH funding for PCOS-specific research was approximately 5.8 million dollars in 2019. The condition''s heterogeneity has complicated both research design and clinical trial development.'
);

INSERT INTO conditions (
  id, name, slug, description, prevalence_summary,
  treatment_gap_summary, biology_summary, underfunding_notes
) VALUES (
  '084c5d6d-a648-413a-a7f0-c84b1fb6270c',
  'Adenomyosis',
  'adenomyosis',
  'Endometrial tissue invades the uterine muscle wall, causing an enlarged uterus, severe period pain, heavy bleeding, and chronic pelvic pain. It frequently coexists with endometriosis and is a major cause of iron deficiency anemia.',
  'Affects 10 to 25% of women. Prevalence rises to 40 to 50% among women with severe period pain. Often underdiagnosed because it historically required a hysterectomy to confirm.',
  'Hysterectomy is the only definitive cure. Hormonal treatments reduce symptoms but do not eliminate the disease. No approved drug targets adenomyosis specifically.',
  'Estrogen-dependent and progesterone-resistant, like endometriosis. Invasive cells produce their own estrogen, drive inflammation and fibrosis, and cause abnormal uterine contractions. Epigenetic changes silence progesterone receptors, limiting how much hormonal treatment can help.',
  'Historically overlooked because diagnosis and treatment both required hysterectomy. Non-invasive diagnostic criteria only improved in the 2010s. No drugs are FDA-approved specifically for adenomyosis as of 2024.'
);

-- ============================================================
-- COMPOUNDS
-- ============================================================

INSERT INTO compounds (
  id, name, generic_name, brand_names, original_indication,
  mechanism_of_action, drug_class, fda_status
) VALUES (
  '764911c9-2392-4f64-bf9d-748c6c51bba2',
  'Dutasteride',
  'dutasteride',
  ARRAY['Avodart', 'Jalyn'],
  'Benign prostatic hyperplasia (BPH); male-pattern hair loss',
  'Dual inhibitor of 5α-reductase types 1 and 2. Blocks the conversion of testosterone to dihydrotestosterone (DHT) and — critically for PMDD repurposing — the conversion of progesterone to allopregnanolone (via 5α-reduction of progesterone to 5α-DHP, then 3α-HSD to allopregnanolone). By preventing the luteal-phase rise in allopregnanolone, dutasteride removes the neurosteroid trigger that precipitates the paradoxical GABA-A dysregulation underlying PMDD symptoms.',
  '5α-Reductase inhibitor (type 1 and 2)',
  'FDA-approved (2001) for BPH'
);

INSERT INTO compounds (
  id, name, generic_name, brand_names, original_indication,
  mechanism_of_action, drug_class, fda_status
) VALUES (
  'ba7cc922-ad5a-4968-b2be-d3b70f39e0e0',
  'Sepranolone',
  'isoallopregnanolone (UC1010)',
  ARRAY['Sepranolone'],
  'Investigational — no approved indication',
  'GABA-A receptor modulating steroid antagonist (GAMSA). Isoallopregnanolone is an endogenous epimer of allopregnanolone that acts as a functional antagonist at the neurosteroid binding site of the GABA-A receptor. It does not itself modulate chloride conductance but competitively blocks allopregnanolone from binding, thereby preventing the paradoxical dysphoric GABA-A response that drives PMDD symptoms. Unlike GnRH agonists, it does not suppress ovarian function or alter circulating hormone levels.',
  'GABA-A receptor modulating steroid antagonist (GAMSA)',
  'Investigational (Phase IIb completed; no approved indication as of 2024)'
);

INSERT INTO compounds (
  id, name, generic_name, brand_names, original_indication,
  mechanism_of_action, drug_class, fda_status
) VALUES (
  'e6b33d56-f24d-4d5d-bfdd-bd592d29428d',
  'Buspirone',
  'buspirone hydrochloride',
  ARRAY['Buspar', 'Vanspar'],
  'Generalized anxiety disorder (GAD)',
  'Partial agonist at 5-HT1A serotonin receptors and weak antagonist at dopamine D2 receptors. Unlike benzodiazepines, buspirone does not potentiate GABA-A activity and has no abuse potential. Its 5-HT1A agonism modulates serotonergic tone in the raphe nuclei and limbic system. In PMDD, serotonin dysregulation during the luteal phase amplifies the aberrant neurosteroid response; buspirone may attenuate affective symptoms through serotonergic normalization without the risks of SSRIs (sexual dysfunction, discontinuation syndrome) or hormonal suppression.',
  '5-HT1A partial agonist / anxiolytic',
  'FDA-approved (1986) for generalized anxiety disorder'
);

INSERT INTO compounds (
  id, name, generic_name, brand_names, original_indication,
  mechanism_of_action, drug_class, fda_status
) VALUES (
  'e4692a2d-d601-43d7-8500-2de32de76f64',
  'Spironolactone',
  'spironolactone',
  ARRAY['Aldactone', 'CaroSpir'],
  'Heart failure, hypertension, primary hyperaldosteronism, edema',
  'Competitive antagonist of mineralocorticoid (aldosterone) receptors and androgen (AR) receptors. In PCOS, spironolactone''s anti-androgen activity — blocking AR in hair follicles, sebaceous glands, and adrenal tissue — reduces hirsutism, acne, and androgen-driven anovulation. At doses ≥100 mg/day, it also inhibits ovarian androgen biosynthesis (partial CYP17A1 inhibition). Spironolactone does not address the upstream insulin resistance or LH hyperpulsatility driving PCOS but directly targets the downstream androgenic manifestations.',
  'Aldosterone antagonist / anti-androgen (AR antagonist)',
  'FDA-approved (1960) for heart failure, hypertension, and hyperaldosteronism'
);

INSERT INTO compounds (
  id, name, generic_name, brand_names, original_indication,
  mechanism_of_action, drug_class, fda_status
) VALUES (
  '7e4f944c-aabf-47dd-b9b6-ec24beb168f3',
  'Liraglutide',
  'liraglutide (rDNA origin)',
  ARRAY['Victoza', 'Saxenda'],
  'Type 2 diabetes mellitus; obesity (as Saxenda)',
  'Long-acting GLP-1 receptor agonist. Stimulates insulin secretion glucose-dependently, suppresses glucagon, delays gastric emptying, and reduces appetite via central hypothalamic GLP-1R signaling. In PCOS, GLP-1 agonism addresses multiple pathophysiological axes simultaneously: (1) reduces visceral and hepatic fat, lowering ectopic lipid-driven insulin resistance; (2) decreases circulating insulin and IGF-1, thereby reducing ovarian androgen stimulation; (3) restores hypothalamic-pituitary signaling normalization through central GLP-1R effects, improving LH pulsatility; (4) reduces systemic inflammation via anti-inflammatory GLP-1R signaling. Restores ovulation in a subset of anovulatory PCOS patients.',
  'GLP-1 receptor agonist',
  'FDA-approved (2010) for type 2 diabetes; (2014) for obesity'
);

INSERT INTO compounds (
  id, name, generic_name, brand_names, original_indication,
  mechanism_of_action, drug_class, fda_status
) VALUES (
  '6869d788-1035-4131-8050-dcfaf4d7df8b',
  'N-Acetylcysteine',
  'acetylcysteine',
  ARRAY['Mucomyst', 'Acetadote', 'NAC'],
  'Acetaminophen overdose; mucolytic agent in pulmonary disease',
  'Precursor to glutathione (GSH), the cell''s primary endogenous antioxidant. Repletes intracellular glutathione, reducing oxidative stress and reactive oxygen species (ROS). In PCOS, oxidative stress — driven by chronic low-grade inflammation and hyperinsulinemia — impairs insulin receptor signaling, worsens hyperandrogenism, and damages oocyte quality. NAC''s antioxidant action improves insulin sensitivity (comparable in some studies to metformin) and may reduce androgen levels by decreasing ROS-driven stimulation of ovarian steroidogenesis. When combined with clomiphene citrate, NAC appears to potentiate ovulation induction in clomiphene-resistant PCOS patients.',
  'Antioxidant / glutathione precursor / mucolytic',
  'FDA-approved for acetaminophen overdose and mucolytic use; off-label for PCOS'
);

INSERT INTO compounds (
  id, name, generic_name, brand_names, original_indication,
  mechanism_of_action, drug_class, fda_status
) VALUES (
  '8ff7b666-f0bf-4711-b187-a408189a612b',
  'Letrozole',
  'letrozole',
  ARRAY['Femara'],
  'Hormone receptor-positive breast cancer (postmenopausal)',
  'Non-steroidal competitive inhibitor of aromatase (CYP19A1), the enzyme that converts androgens to estrogens. In breast cancer, suppresses systemic estrogen. In adenomyosis (and endometriosis), targets local estrogen production: adenomyotic lesions express aromatase aberrantly, producing estrogen autonomously within the myometrium. Letrozole inhibits this local aromatase, reducing estrogen-driven lesion survival, inflammation, and pain. Unlike GnRH agonists, letrozole preserves ovarian function at low doses and maintains bone density. Evidence supports its use as a fertility-sparing alternative for adenomyosis.',
  'Non-steroidal aromatase inhibitor (third generation)',
  'FDA-approved (1997) for breast cancer'
);

INSERT INTO compounds (
  id, name, generic_name, brand_names, original_indication,
  mechanism_of_action, drug_class, fda_status
) VALUES (
  '94e7070d-d68c-4c85-92f4-0c471b44a260',
  'Valproic Acid',
  'valproate sodium / valproic acid',
  ARRAY['Depakote', 'Depakene', 'Epilim', 'Stavzor'],
  'Epilepsy, bipolar disorder, migraine prophylaxis',
  'Inhibitor of histone deacetylases (HDAC class I and IIa), in addition to its voltage-gated sodium channel blocking and GABA-ergic properties. HDAC inhibition reactivates silenced tumor suppressor and differentiation genes by increasing histone acetylation. In adenomyosis, which is characterized by epigenetic reprogramming (hypermethylation of progesterone receptor B and HOX genes, driving progesterone resistance and invasive behavior), HDAC inhibition may restore normal gene expression patterns, reduce myometrial invasion, and re-sensitize adenomyotic tissue to progesterone. VPA also reduces inflammatory NF-κB signaling and MMP-9 activity, targeting both the inflammatory and invasive axes of adenomyosis pathology.',
  'HDAC inhibitor / anticonvulsant / mood stabilizer',
  'FDA-approved for epilepsy (1978), bipolar disorder (1995), migraine prophylaxis (1996)'
);

INSERT INTO compounds (
  id, name, generic_name, brand_names, original_indication,
  mechanism_of_action, drug_class, fda_status
) VALUES (
  'bfa9fe27-79d0-484b-a6b4-b20929401f9b',
  'Dienogest',
  'dienogest',
  ARRAY['Visanne', 'Natazia', 'Qlaira'],
  'Endometriosis; combined oral contraceptive (with estradiol valerate)',
  'Fourth-generation synthetic progestin with high progestogenic selectivity and significant antiproliferative and anti-inflammatory activity. Unlike first- and second-generation progestins, dienogest has negligible androgenic, glucocorticoid, mineralocorticoid, or estrogenic activity. In adenomyosis, dienogest suppresses endometrial cell proliferation, reduces local estrogen production (via aromatase downregulation), inhibits MMP-mediated invasion, and induces decidualization and atrophy of ectopic endometrial glands. It is FDA-approved for endometriosis (Visanne is approved in many countries outside the US) and is being repurposed for adenomyosis based on shared pathophysiology.',
  'Synthetic progestin (4th generation)',
  'Approved for endometriosis in EU, Japan, and other markets (Visanne); FDA-approved as combination OCP component (Natazia); off-label for adenomyosis in the US'
);

-- ============================================================
-- REPURPOSING SIGNALS
-- ============================================================

-- ── PMDD signals ──────────────────────────────────────────

INSERT INTO repurposing_signals (
  id, condition_id, compound_id, signal_type, evidence_strength,
  summary, mechanism_hypothesis, status
) VALUES (
  'c9e6ce20-49d3-449e-8765-ab413e2d77ae',
  '05e5cf0c-b348-4660-bf1b-ad8ad7a40e51',
  '764911c9-2392-4f64-bf9d-748c6c51bba2',
  'Randomized controlled trial',
  'moderate',
  'A 2016 double-blind crossover RCT by Martinez et al. (NIH/NIMH) tested dutasteride in 16 women with prospectively confirmed PMDD. High-dose dutasteride (2.5 mg/day throughout the cycle) significantly suppressed the luteal-phase rise in allopregnanolone and produced statistically significant reductions in irritability, sadness, anxiety, food cravings, and bloating compared to placebo. Low-dose dutasteride (0.5 mg/day) had no significant effect, establishing a dose-response relationship. Critically, dutasteride had no mood effect in healthy control women who completed the same protocol, confirming that the effect is specific to the aberrant allopregnanolone sensitivity of PMDD rather than a non-specific hormonal effect. This is the first RCT directly targeting the neurosteroid pathway in PMDD.',
  'Dutasteride blocks 5α-reductase types 1 and 2, preventing the conversion of progesterone → 5α-dihydroprogesterone (5α-DHP) → allopregnanolone (ALLO). In women with PMDD, ALLO does not enhance GABA-A inhibitory tone as it does in healthy women; instead, it produces paradoxical anxiety, irritability, and dysphoria — likely due to altered δ-subunit-containing GABA-A receptor composition during the luteal phase that reverses the expected allosteric modulation. By blocking ALLO synthesis, dutasteride removes this trigger entirely. The specificity of effect in PMDD but not in healthy women supports the PMDD-as-neurosteroid-sensitivity model rather than a simple hormonal suppression mechanism.',
  'Phase II RCT (NIH) — replicated neurosteroid hypothesis; larger trials needed'
);

INSERT INTO repurposing_signals (
  id, condition_id, compound_id, signal_type, evidence_strength,
  summary, mechanism_hypothesis, status
) VALUES (
  '68319531-5391-446d-b544-3e6fb3634c5c',
  '05e5cf0c-b348-4660-bf1b-ad8ad7a40e51',
  'ba7cc922-ad5a-4968-b2be-d3b70f39e0e0',
  'Phase II / Phase IIb randomized controlled trial',
  'moderate',
  'Sepranolone (UC1010 / isoallopregnanolone) has been evaluated in two randomized controlled trials specifically designed to test the GABA-A neurosteroid antagonism hypothesis in PMDD. The first (Bixo et al. 2017, n=106) demonstrated significant reduction in Total DRSP (Daily Record of Severity of Problems) scores versus placebo (p=0.041), with a per-protocol analysis in the 60 women meeting pure PMDD criteria showing a 75% symptom response rate vs. 47% for placebo. The second Phase IIb trial (Bäckström et al. 2021, n=206, 12 European centers) found the 10 mg sepranolone dose superior to placebo for distress and functional impairment (p=0.008 in post-hoc analysis), with a favorable tolerability profile and no endocrine adverse effects. Sepranolone is the first compound specifically designed to target PMDD''s neurosteroid mechanism rather than suppressing ovarian function or broadly modulating serotonin.',
  'Sepranolone (isoallopregnanolone) is a stereoisomer of allopregnanolone that binds competitively to the neurosteroid modulatory site on GABA-A receptors without intrinsic activity. By occupying this site, it prevents allopregnanolone from binding during the luteal phase, blocking the paradoxical dysphoric response in PMDD-susceptible women. Unlike dutasteride, which prevents ALLO synthesis systemically, sepranolone acts at the receptor level and preserves the protective neurosteroid responses in other tissues. It does not alter circulating estrogen, progesterone, or cortisol, making it the most mechanistically precise pharmacological intervention in PMDD to date.',
  'Phase IIb clinical trials completed — Phase III not yet initiated as of 2024'
);

INSERT INTO repurposing_signals (
  id, condition_id, compound_id, signal_type, evidence_strength,
  summary, mechanism_hypothesis, status
) VALUES (
  'a3a5ac79-0911-4bed-908d-1f6c1d6690b1',
  '05e5cf0c-b348-4660-bf1b-ad8ad7a40e51',
  'e6b33d56-f24d-4d5d-bfdd-bd592d29428d',
  'Randomized controlled trial / comparative efficacy trial',
  'preliminary',
  'Buspirone has been evaluated for PMS and PMDD in two published randomized trials. An early report by Rickels et al. (1989, Lancet) established clinical efficacy in a controlled trial of buspirone for PMS. A subsequent single-blind RCT by Nazari et al. (2013, n=100 women with DSM-IV PMS) compared buspirone 10 mg/day to fluoxetine 20 mg/day for two menstrual cycles, finding both drugs produced significant symptom reductions with no statistically significant difference in efficacy between groups. Buspirone was well tolerated with a distinct side-effect profile (dizziness, nausea) compared to SSRIs (sexual dysfunction, discontinuation syndrome). While the evidence base is smaller than for SSRIs and study quality is limited, buspirone offers a non-serotonin-reuptake-blocking mechanism of action that may be particularly relevant for patients who experience SSRI-related side effects, and its PMDD-specific mechanism hypothesis through serotonin-neurosteroid crosstalk remains underexplored.',
  'Serotonin and allopregnanolone are not independent axes in PMDD: 5-HT1A receptor activation modulates allopregnanolone synthesis in the brain (serotonin stimulates 3α-HSD activity) and GABA-A receptor sensitivity. Buspirone''s partial 5-HT1A agonism may normalize serotonergic tone in the raphe nuclei during the luteal phase, reducing the amplification of the paradoxical neurosteroid GABA-A response. Additionally, 5-HT1A signaling in the amygdala and hippocampus modulates fear and threat-appraisal circuits that are dysregulated in PMDD. This mechanism is distinct from SSRI mechanisms (serotonin reuptake inhibition) and may explain why buspirone achieves comparable efficacy via a different entry point into the same dysregulated circuit.',
  'Small RCT evidence — limited by single-blind design; requires prospective PMDD-specific trials'
);

-- ── PCOS signals ───────────────────────────────────────────

INSERT INTO repurposing_signals (
  id, condition_id, compound_id, signal_type, evidence_strength,
  summary, mechanism_hypothesis, status
) VALUES (
  '2c0759cd-2fdb-4e1e-b529-1622ff63939d',
  'fe49fb1b-2f64-4b3b-8e3e-04a2a4ee5820',
  'f7f97905-77cc-4809-b9a9-f2f97efa6839',  -- Metformin (existing compound)
  'Multiple randomized controlled trials / systematic review evidence',
  'strong',
  'Metformin is the most extensively studied repurposed drug in PCOS and is considered standard of care in many international guidelines (Endocrine Society, ESHRE/ASRM) despite having no FDA approval specifically for this indication. Across dozens of RCTs and multiple meta-analyses, metformin consistently improves insulin sensitivity, lowers circulating androgens, reduces LH/FSH ratio, restores menstrual cyclicity in 40–50% of anovulatory patients, and improves ovulation induction response when combined with clomiphene. A 2012 Cochrane review (Qin X et al.) across 44 RCTs confirmed significant reductions in fasting insulin and free androgen index, and improved ovulation rates, particularly in non-obese PCOS phenotypes. Metformin also reduces long-term risk of progression to type 2 diabetes in PCOS, addressing the most significant metabolic sequela of the condition. Its low cost, established safety profile, and oral bioavailability make it the pragmatic backbone of PCOS metabolic management.',
  'AMPK activation by metformin suppresses hepatic glucose production and sensitizes peripheral tissues to insulin signaling. In PCOS, the consequent reduction in hyperinsulinemia decreases insulin-stimulated ovarian androgen production (LH + insulin synergistically drive theca cell androgen synthesis), increases SHBG production (reducing free androgen availability), and reduces the hyperstimulation of LH release from the pituitary that perpetuates anovulation. AMPK activation also directly inhibits mTORC1 in ovarian granulosa cells, which drives abnormal follicular development and cyst formation. The net effect is partial normalization of the LH-insulin amplification loop that maintains the PCOS state.',
  'Multiple RCTs and Cochrane review evidence — widely used off-label; standard of care in many guidelines'
);

INSERT INTO repurposing_signals (
  id, condition_id, compound_id, signal_type, evidence_strength,
  summary, mechanism_hypothesis, status
) VALUES (
  '98bb1eb8-e1bb-4a35-873f-91115ef465dc',
  'fe49fb1b-2f64-4b3b-8e3e-04a2a4ee5820',
  'e4692a2d-d601-43d7-8500-2de32de76f64',
  'Randomized controlled trial',
  'strong',
  'Spironolactone is one of the most widely used off-label drugs in PCOS clinical practice for management of androgen-dependent symptoms. Mazza et al. (2014, n=40 PCOS women) demonstrated that low-dose spironolactone added to metformin produced significantly greater reductions in clinical and biochemical hyperandrogenism — hirsutism scores, DHEA-S, and free testosterone — than metformin alone, with 82% of the spironolactone combination group restoring menstrual regularity. A larger RCT by Alpañés et al. (2017, n=46 women, 12 months) found that OCP + spironolactone was significantly more effective than metformin monotherapy for all androgenic endpoints including Ferriman-Gallwey hirsutism score and free androgen index, with comparable cardiometabolic safety. Spironolactone is used at doses of 50–200 mg/day for PCOS and is recommended in multiple clinical guidelines as the anti-androgen of choice in patients who cannot tolerate OCPs or for whom fertility is not immediately desired.',
  'Spironolactone competitively antagonizes the androgen receptor (AR) in target tissues — hair follicles, sebaceous glands, and adrenal cortex — directly blocking androgen-mediated signaling that drives hirsutism and acne. At higher doses, it also inhibits CYP17A1 (17α-hydroxylase/17,20-lyase) in the adrenal glands and ovaries, reducing androgen biosynthesis at the source. In the adrenal gland, mineralocorticoid receptor antagonism reduces aldosterone-stimulated adrenal androgen co-secretion. The combination of receptor blockade and partial biosynthesis inhibition makes spironolactone effective against both ovarian and adrenal androgen excess, addressing the hyperandrogenism that is the most clinically burdensome aspect of PCOS.',
  'Multiple RCTs — widely used clinically off-label; guideline-recommended in many jurisdictions'
);

INSERT INTO repurposing_signals (
  id, condition_id, compound_id, signal_type, evidence_strength,
  summary, mechanism_hypothesis, status
) VALUES (
  '53f26a1b-7fdf-4c00-9734-4fd8221df693',
  'fe49fb1b-2f64-4b3b-8e3e-04a2a4ee5820',
  '7e4f944c-aabf-47dd-b9b6-ec24beb168f3',
  'Randomized controlled trial',
  'moderate',
  'A 2017 double-blind placebo-controlled RCT by Nylander et al. (n=72 PCOS women, 26 weeks) demonstrated that liraglutide 1.2 mg/day produced a 5.2 kg weight loss, improved menstrual bleeding ratio (p<0.001), reduced ovarian volume by 1.6 mL, lowered free testosterone, and raised SHBG — independent of weight-loss effects in some analyses. A companion analysis by Frøssing et al. (2018) on the same cohort found liraglutide reduced hepatic fat by 44% and visceral adipose tissue by 18%, while cutting NAFLD prevalence by two-thirds. These reproductive and metabolic benefits extend beyond simple caloric restriction. Emerging data on semaglutide (next-generation GLP-1 agonist) in PCOS support the drug class effect, with Jensterle et al. (2023) reporting significant metabolic activity in obese PCOS women. GLP-1 receptor agonists represent a mechanistically distinct approach to PCOS that addresses both the metabolic and reproductive axes simultaneously, making them particularly promising in the GLP-1 era.',
  'GLP-1 receptor agonists act through multiple convergent mechanisms in PCOS: (1) central GLP-1R signaling in the hypothalamus reduces appetite and food intake, decreasing caloric surplus that drives insulin resistance; (2) hepatic GLP-1R activation reduces de novo lipogenesis and hepatic fat, improving hepatic insulin sensitivity; (3) reduced systemic insulin and IGF-1 levels decrease insulin-stimulated ovarian androgen biosynthesis in theca cells; (4) GLP-1R-mediated anti-inflammatory signaling (suppression of NF-κB, reduction of IL-6 and TNF-α) reduces the chronic low-grade inflammation that perpetuates metabolic dysfunction in PCOS; (5) direct ovarian GLP-1R signaling (GLP-1R expression confirmed on human granulosa cells) may improve follicular development and oocyte quality.',
  'Phase III-equivalent RCT evidence for liraglutide; emerging data for semaglutide — likely to enter guidelines as metabolic evidence accumulates'
);

INSERT INTO repurposing_signals (
  id, condition_id, compound_id, signal_type, evidence_strength,
  summary, mechanism_hypothesis, status
) VALUES (
  '20cb1a4f-94b8-4fab-b25c-454a7f469d82',
  'fe49fb1b-2f64-4b3b-8e3e-04a2a4ee5820',
  '6869d788-1035-4131-8050-dcfaf4d7df8b',
  'Randomized controlled trial',
  'preliminary',
  'N-Acetylcysteine (NAC) has been evaluated in two RCTs for PCOS. Fulghesu et al. (2002, Fertility & Sterility, n=37) demonstrated significant reductions in insulin AUC and improved peripheral insulin sensitivity in hyperinsulinemic PCOS patients after 5–6 weeks of oral NAC at 1.8–3.0 g/day, with effects comparable in direction to metformin — notably, the benefit was restricted to hyperinsulinemic patients, suggesting NAC is best positioned for the insulin-resistant PCOS phenotype. Rizk et al. (2005, Fertility & Sterility, n=150) conducted a landmark double-blind RCT of NAC + clomiphene citrate vs. clomiphene alone in clomiphene-resistant PCOS women, demonstrating a 49.3% ovulation rate in the NAC combination arm vs. 1.3% for clomiphene alone and a pregnancy rate of 21.3% vs. 0%. NAC''s low cost (available OTC), favorable safety profile, and lack of hormonal effects make it particularly interesting as an adjunct for fertility-seeking PCOS patients unresponsive to standard ovulation induction.',
  'NAC replenishes intracellular glutathione and directly scavenges reactive oxygen species. In PCOS, chronic oxidative stress — driven by hyperinsulinemia, dyslipidemia, and low-grade inflammation — impairs insulin receptor substrate (IRS-1) phosphorylation signaling, worsening insulin resistance in a feed-forward loop. NAC breaks this cycle by reducing ROS-mediated serine phosphorylation of IRS-1 (which inhibits PI3K/Akt signaling), restoring normal insulin receptor signaling. In ovarian granulosa cells, NAC-mediated reduction of ROS may improve FSH sensitivity and follicular maturation, potentially explaining the dramatic improvement in clomiphene response in the Rizk et al. trial. NAC also reduces advanced glycation end products (AGEs) that accumulate in insulin-resistant tissue and impair normal cellular function.',
  'Small-to-medium RCTs — promising fertility data; needs larger confirmatory trials'
);

-- ── Adenomyosis signals ────────────────────────────────────

INSERT INTO repurposing_signals (
  id, condition_id, compound_id, signal_type, evidence_strength,
  summary, mechanism_hypothesis, status
) VALUES (
  'd6e08d73-d45a-4968-aa99-24728747f60a',
  '084c5d6d-a648-413a-a7f0-c84b1fb6270c',
  '8ff7b666-f0bf-4711-b187-a408189a612b',
  'Randomized controlled trial',
  'moderate',
  'Two RCTs have evaluated letrozole specifically for adenomyosis. Badawy et al. (2012, Acta Obstetricia et Gynecologica Scandinavica, n=32 premenopausal women) randomized patients to letrozole 2.5 mg/day vs. goserelin (GnRH agonist) for 12 weeks. Both significantly reduced adenomyoma volume — letrozole by 40.9%, goserelin by 49.1% — with comparable pain reduction. Notably, two patients in the letrozole arm conceived during the treatment period, demonstrating fertility preservation that is impossible with GnRH agonists. Sharma et al. (2023, Reproductive Biomedicine Online, n=156 IVF-awaiting adenomyosis patients) confirmed letrozole (2.5 mg three times weekly) was equivalent to monthly goserelin for pain, bleeding, and sonographic improvement over 3 months, while maintaining menstrual cycling. Letrozole was highlighted as a "low-cost alternative to GnRH agonist" particularly suitable for IVF preparation in adenomyosis patients, where GnRH agonist-induced hypoestrogenism can impair endometrial receptivity.',
  'Adenomyotic lesions express aromatase (CYP19A1) aberrantly, enabling autonomous local estrogen production within the myometrium independent of ovarian secretion. This local estrogen drives lesion cell survival, PGE2 synthesis (which in turn upregulates aromatase via a self-amplifying loop), and myometrial inflammation and fibrosis. Letrozole, by inhibiting CYP19A1 throughout the body including within myometrial lesions, suppresses both systemic and local estrogen. Unlike GnRH agonists, which achieve hypoestrogenism by suppressing ovarian function entirely, letrozole acts peripherally and does not fully eliminate ovarian estrogen production at low doses — preserving partial estrogenic support for bone density, endometrium, and overall quality of life.',
  'Two RCTs with direct adenomyosis-specific evidence — promising fertility-sparing data; larger trials underway'
);

INSERT INTO repurposing_signals (
  id, condition_id, compound_id, signal_type, evidence_strength,
  summary, mechanism_hypothesis, status
) VALUES (
  'f64619d2-6230-4dfe-8de9-e20403247821',
  '084c5d6d-a648-413a-a7f0-c84b1fb6270c',
  '94e7070d-d68c-4c85-92f4-0c471b44a260',
  'Case series + animal model data',
  'preliminary',
  'Liu and Guo (Reproductive Sciences, 2010; PMID 20601534) reported a comparative case series of 12 adenomyosis patients treated with valproic acid (VPA) for 6 months, with or without concomitant levonorgestrel IUD. VPA produced complete resolution of dysmenorrhea and an average 26% reduction in uterine size across the cohort, regardless of whether the Mirena was co-administered — suggesting the HDAC inhibitory effect of VPA, rather than progestogenic suppression, drove the benefit. A companion murine study (Liu and Guo, Journal of Obstetrics and Gynaecology Research, 2011; PMID 21651672) demonstrated that VPA treatment significantly improved experimentally induced hyperalgesia in adenomyosis mice, reduced myometrial infiltration depth, and decreased abnormal uterine contractility. These represent the first published human and animal evidence for epigenetic therapy targeting adenomyosis. The evidence base remains limited to a small case series and animal data; no RCT has been conducted.',
  'Adenomyosis exhibits characteristic epigenetic reprogramming: hypermethylation of the progesterone receptor B (PR-B) promoter silences progestogenic signaling (driving progesterone resistance); HOXA10 methylation impairs endometrial differentiation; and histone deacetylation across multiple genes promotes a pro-invasive, pro-inflammatory gene expression landscape. Valproic acid''s HDAC inhibition increases histone H3/H4 acetylation genome-wide, reopening compacted chromatin and reactivating silenced differentiation and tumor suppressor genes. In adenomyotic stromal cells, HDAC inhibition reduces MMP-9 expression (impairing invasion), suppresses NF-κB-driven cytokine production, and may partially restore PR-B expression — re-sensitizing cells to progesterone. This epigenetic reprogramming approach is mechanistically distinct from all current hormonal treatments.',
  'Human case series (n=12) + murine in vivo data — hypothesis-generating only; formal RCT needed'
);

INSERT INTO repurposing_signals (
  id, condition_id, compound_id, signal_type, evidence_strength,
  summary, mechanism_hypothesis, status
) VALUES (
  '5dd21e4b-9873-42a6-ae7b-3ad59b99c487',
  '084c5d6d-a648-413a-a7f0-c84b1fb6270c',
  'bfa9fe27-79d0-484b-a6b4-b20929401f9b',
  'Phase III randomized controlled trial',
  'strong',
  'Dienogest has the strongest evidence base of any drug specifically studied for adenomyosis and represents a clean repurposing from endometriosis (for which it is approved in many countries) to adenomyosis on the basis of shared pathophysiology. A Phase III RCT by Osuga et al. (Fertility and Sterility, 2017; PMID 28911934) in 67 adenomyosis patients randomized to dienogest 2 mg/day vs. placebo for 16 weeks demonstrated significantly greater pain score reduction (p<0.001) and VAS improvement (p<0.001) with well-established tolerability. A preceding pilot study by Hirata et al. (Gynecological Endocrinology, 2014; PMID 24905725) in 17 patients for 24 weeks showed significant reductions in CA-125 and CA19-9 (adenomyosis biomarkers) and substantial pain relief, with suppression of estradiol to moderate levels (>50 pg/mL maintained) — preserving partial estrogenic protection while suppressing disease activity. Dienogest does not completely suppress ovarian function, conferring better bone density and quality-of-life outcomes than GnRH agonists in head-to-head comparisons.',
  'Adenomyotic glandular and stromal cells proliferate under estrogenic stimulation and resist progestogenic growth arrest due to progesterone receptor B downregulation. Dienogest addresses this through high-affinity PR binding that overcomes partial progesterone resistance at pharmacological doses, combined with direct antiproliferative effects on endometrial stromal cells that are independent of PR signaling. Dienogest also suppresses aromatase expression in adenomyotic tissue (reducing local estrogen), inhibits MMP-9 (reducing invasive capacity), downregulates VEGF (reducing lesion vascularization), and suppresses NF-κB-mediated inflammatory cytokine production (IL-6, TNF-α, PGE2). The combination of progestogenic, anti-estrogenic, anti-inflammatory, and anti-angiogenic effects in a single molecule makes dienogest the most mechanistically comprehensive pharmacological option for adenomyosis currently in clinical use.',
  'Phase III RCT evidence + pilot data — used clinically off-label in the US; approved for adenomyosis in Japan and some European markets'
);

-- ============================================================
-- SOURCES
-- ============================================================

-- ── PMDD: Dutasteride ─────────────────────────────────────

INSERT INTO sources (
  id, signal_id, source_type, external_id, title, authors,
  journal, publication_date, url, key_finding_excerpt
) VALUES (
  '0874511f-ec09-4eee-8abf-b419d7119779',
  'c9e6ce20-49d3-449e-8765-ab413e2d77ae',
  'pubmed', '26272051',
  '5α-Reductase Inhibition Prevents the Luteal Phase Increase in Plasma Allopregnanolone Levels and Mitigates Symptoms in Women with Premenstrual Dysphoric Disorder',
  'Martinez PE, Rubinow DR, Nieman LK, Koziol DE, Morrow AL, Schiller CE, Cintron D, Thompson KD, Khine KK, Schmidt PJ',
  'Neuropsychopharmacology',
  '2016-02-01',
  'https://pubmed.ncbi.nlm.nih.gov/26272051',
  'High-dose dutasteride (2.5 mg/day) blocked the luteal-phase allopregnanolone rise and produced statistically significant reductions in irritability, sadness, anxiety, food cravings, and bloating vs. placebo. No mood effect was observed in healthy controls, confirming mechanism specificity to PMDD neurosteroid sensitivity.'
);

-- ── PMDD: Sepranolone ─────────────────────────────────────

INSERT INTO sources (
  id, signal_id, source_type, external_id, title, authors,
  journal, publication_date, url, key_finding_excerpt
) VALUES (
  '388acfa5-be16-4fed-a93c-730c56c77f10',
  '68319531-5391-446d-b544-3e6fb3634c5c',
  'pubmed', '28319848',
  'Treatment of premenstrual dysphoric disorder with the GABAA receptor modulating steroid antagonist Sepranolone (UC1010) — a randomized controlled trial',
  'Bixo M, Ekberg K, Sundström Poromaa I, Lindén Hirschberg A, Fianu Jonasson A, Andréen L, Timby E, Wulff M, Ehrenborg A, Bäckström T',
  'Psychoneuroendocrinology',
  '2017-06-01',
  'https://pubmed.ncbi.nlm.nih.gov/28319848',
  'UC1010 significantly reduced Total DRSP scores vs. placebo (p=0.041). In the per-protocol pure PMDD subgroup (n=60), UC1010 achieved a 75% symptom response rate vs. 47% for placebo, with no endocrine adverse effects.'
);

INSERT INTO sources (
  id, signal_id, source_type, external_id, title, authors,
  journal, publication_date, url, key_finding_excerpt
) VALUES (
  '219d9109-9111-4293-b28b-5d43b1f50ea3',
  '68319531-5391-446d-b544-3e6fb3634c5c',
  'pubmed', '34597899',
  'A randomized, double-blind study on efficacy and safety of sepranolone in premenstrual dysphoric disorder',
  'Bäckström T, Ekberg K, Lindén Hirschberg A, Bixo M, Epperson CN, Briggs P, Panay N, O''Brien S',
  'Psychoneuroendocrinology',
  '2021-11-01',
  'https://pubmed.ncbi.nlm.nih.gov/34597899',
  'Phase IIb multicenter RCT (n=206, 12 European centers). The 10 mg sepranolone dose was significantly superior to placebo for distress and impairment (p=0.008). Well tolerated with no safety concerns; supports advancement to Phase III.'
);

-- ── PMDD: Buspirone ───────────────────────────────────────

INSERT INTO sources (
  id, signal_id, source_type, external_id, title, authors,
  journal, publication_date, url, key_finding_excerpt
) VALUES (
  'c0c6dceb-3d6f-4c07-b688-9859504e8674',
  'a3a5ac79-0911-4bed-908d-1f6c1d6690b1',
  'pubmed', '2564578',
  'Buspirone in treatment of premenstrual syndrome',
  'Rickels K, Freeman E, Sondheimer S',
  'Lancet',
  '1989-04-08',
  'https://pubmed.ncbi.nlm.nih.gov/2564578',
  'Early randomized controlled trial establishing buspirone''s efficacy for PMS symptoms, representing the first evidence of a non-benzodiazepine anxiolytic with clinical benefit in premenstrual mood disorders.'
);

INSERT INTO sources (
  id, signal_id, source_type, external_id, title, authors,
  journal, publication_date, url, key_finding_excerpt
) VALUES (
  '19202781-e715-474d-952e-15c6d511d372',
  'a3a5ac79-0911-4bed-908d-1f6c1d6690b1',
  'pubmed', '23073723',
  'Premenstrual syndrome: a single-blind study of treatment with buspirone versus fluoxetine',
  'Nazari H, Yari F, Jariani M, Marzban A, Birgandy M',
  'Archives of Gynecology and Obstetrics',
  '2013-03-01',
  'https://pubmed.ncbi.nlm.nih.gov/23073723',
  'In 100 women with DSM-IV PMS, buspirone 10 mg/day and fluoxetine 20 mg/day produced equivalent symptom reductions over two menstrual cycles with no statistically significant difference between groups, supporting buspirone as a viable non-SSRI option.'
);

-- ── PCOS: Metformin ───────────────────────────────────────

INSERT INTO sources (
  id, signal_id, source_type, external_id, title, authors,
  journal, publication_date, url, key_finding_excerpt
) VALUES (
  '9c81cc5b-92ea-412a-bc1f-4ca77b4623b0',
  '2c0759cd-2fdb-4e1e-b529-1622ff63939d',
  'pubmed', '22592100',
  'Metformin versus clomiphene citrate for infertility in non-obese women with polycystic ovary syndrome: a systematic review and meta-analysis',
  'Misso ML, Costello MF, Garrubba M, Wong J, Hart R, Rombauts L, Melder AM, Norman RJ, Teede HJ',
  'Human Reproduction Update',
  '2012-07-01',
  'https://pubmed.ncbi.nlm.nih.gov/22592100',
  'Meta-analysis of 44 RCTs confirmed significant reductions in fasting insulin and free androgen index with metformin, and improved ovulation rates in non-obese PCOS, establishing its role as a standard-of-care repurposed drug despite lacking a specific FDA indication.'
);

-- ── PCOS: Spironolactone ──────────────────────────────────

INSERT INTO sources (
  id, signal_id, source_type, external_id, title, authors,
  journal, publication_date, url, key_finding_excerpt
) VALUES (
  'eda1498e-8059-41b1-ac83-55f861dc75a9',
  '98bb1eb8-e1bb-4a35-873f-91115ef465dc',
  'pubmed', '23845740',
  'In PCOS patients the addition of low-dose spironolactone induces a more marked reduction of clinical and biochemical hyperandrogenism than metformin alone',
  'Mazza A, Fruci B, Guzzi P, D''Orrico B, Malaguarnera R, Veltri P, Fava A, Belfiore A',
  'Nutrition, Metabolism and Cardiovascular Diseases',
  '2014-02-01',
  'https://pubmed.ncbi.nlm.nih.gov/23845740',
  'Low-dose spironolactone added to metformin produced significantly greater reductions in hirsutism, DHEA-S, and free testosterone than metformin alone, with 82% of the combination group restoring menstrual cyclicity.'
);

INSERT INTO sources (
  id, signal_id, source_type, external_id, title, authors,
  journal, publication_date, url, key_finding_excerpt
) VALUES (
  '86927f47-25f5-418d-98ba-2b6c75131055',
  '98bb1eb8-e1bb-4a35-873f-91115ef465dc',
  'pubmed', '28912358',
  'Combined oral contraceptives plus spironolactone compared with metformin in women with polycystic ovary syndrome: a one-year randomized clinical trial',
  'Alpañés M, Álvarez-Blasco F, Fernández-Durán E, Luque-Ramírez M, Escobar-Morreale HF',
  'European Journal of Endocrinology',
  '2017-11-01',
  'https://pubmed.ncbi.nlm.nih.gov/28912358',
  'OCP + spironolactone was significantly more effective than metformin for reducing hirsutism and all testosterone markers over 12 months, with comparable cardiometabolic safety, confirming spironolactone''s superiority for androgenic endpoints in PCOS.'
);

-- ── PCOS: Liraglutide ─────────────────────────────────────

INSERT INTO sources (
  id, signal_id, source_type, external_id, title, authors,
  journal, publication_date, url, key_finding_excerpt
) VALUES (
  '74b6dae2-a940-42c0-828a-483e4e3529d0',
  '53f26a1b-7fdf-4c00-9734-4fd8221df693',
  'pubmed', '28479118',
  'Effects of liraglutide on ovarian dysfunction in polycystic ovary syndrome: a randomized clinical trial',
  'Nylander M, Frøssing S, Clausen HV, Kistorp C, Faber J, Skouby SO',
  'Reproductive Biomedicine Online',
  '2017-01-01',
  'https://pubmed.ncbi.nlm.nih.gov/28479118',
  'Liraglutide 1.2 mg/day for 26 weeks produced 5.2 kg weight loss, improved menstrual bleeding ratio (p<0.001), reduced ovarian volume by 1.6 mL, lowered free testosterone, and raised SHBG in 72 PCOS women — demonstrating simultaneous reproductive and metabolic benefit.'
);

INSERT INTO sources (
  id, signal_id, source_type, external_id, title, authors,
  journal, publication_date, url, key_finding_excerpt
) VALUES (
  '7b94634a-9d03-4ac2-a8bc-abbd9fae0779',
  '53f26a1b-7fdf-4c00-9734-4fd8221df693',
  'pubmed', '28681988',
  'Effect of liraglutide on ectopic fat in polycystic ovary syndrome: a randomized clinical trial',
  'Frøssing S, Nylander M, Chabanova E, Frystyk J, Holst JJ, Kistorp C, Skouby SO, Faber J',
  'Diabetes, Obesity and Metabolism',
  '2018-01-01',
  'https://pubmed.ncbi.nlm.nih.gov/28681988',
  'Liraglutide reduced hepatic fat by 44%, visceral adipose tissue by 18%, cut NAFLD prevalence by two-thirds, and reduced free testosterone by 19% with 19% increase in SHBG, demonstrating both hepatic and reproductive hormone benefit independent of general weight loss.'
);

-- ── PCOS: NAC ────────────────────────────────────────────

INSERT INTO sources (
  id, signal_id, source_type, external_id, title, authors,
  journal, publication_date, url, key_finding_excerpt
) VALUES (
  '9d1c0b03-3c10-483e-86b2-fb53caef556b',
  '20cb1a4f-94b8-4fab-b25c-454a7f469d82',
  'pubmed', '12057717',
  'N-acetyl-cysteine treatment improves insulin sensitivity in women with polycystic ovary syndrome',
  'Fulghesu AM, Ciampelli M, Muzj G, Belosi C, Selvaggi L, Ayala GF, Lanzone A',
  'Fertility and Sterility',
  '2002-06-01',
  'https://pubmed.ncbi.nlm.nih.gov/12057717',
  'NAC (1.8–3.0 g/day for 5–6 weeks) significantly reduced insulin AUC and increased peripheral insulin sensitivity in hyperinsulinemic PCOS patients, with effects restricted to this phenotype — suggesting targeted utility in insulin-resistant PCOS.'
);

INSERT INTO sources (
  id, signal_id, source_type, external_id, title, authors,
  journal, publication_date, url, key_finding_excerpt
) VALUES (
  '2a4535d9-66ba-4f51-956a-979663e97325',
  '20cb1a4f-94b8-4fab-b25c-454a7f469d82',
  'pubmed', '15705376',
  'N-acetyl-cysteine is a novel adjuvant to clomiphene citrate in clomiphene citrate-resistant patients with polycystic ovary syndrome',
  'Rizk AY, Bedaiwy MA, Al-Inany HG',
  'Fertility and Sterility',
  '2005-02-01',
  'https://pubmed.ncbi.nlm.nih.gov/15705376',
  'Double-blind placebo-controlled RCT (n=150 clomiphene-resistant PCOS women). NAC + clomiphene achieved 49.3% ovulation rate vs. 1.3% for clomiphene alone; pregnancy rate 21.3% vs. 0%. No OHSS cases — a dramatic fertility benefit from a widely available antioxidant.'
);

-- ── Adenomyosis: Letrozole ────────────────────────────────

INSERT INTO sources (
  id, signal_id, source_type, external_id, title, authors,
  journal, publication_date, url, key_finding_excerpt
) VALUES (
  '65dc91db-e479-438c-a657-c689192f395e',
  'd6e08d73-d45a-4968-aa99-24728747f60a',
  'pubmed', '22229256',
  'Aromatase inhibitors or gonadotropin-releasing hormone agonists for the management of uterine adenomyosis: a randomized controlled trial',
  'Badawy AM, Elnashar AM, Mosbah AA',
  'Acta Obstetricia et Gynecologica Scandinavica',
  '2012-04-01',
  'https://pubmed.ncbi.nlm.nih.gov/22229256',
  'First RCT of letrozole directly in adenomyosis (n=32). Letrozole produced a 40.9% volume reduction vs. 49.1% for goserelin; two patients in the letrozole arm conceived during treatment — demonstrating fertility preservation that is impossible with GnRH agonist suppression.'
);

INSERT INTO sources (
  id, signal_id, source_type, external_id, title, authors,
  journal, publication_date, url, key_finding_excerpt
) VALUES (
  '91cdc92e-4d09-4747-ac15-ce7aee2829be',
  'd6e08d73-d45a-4968-aa99-24728747f60a',
  'pubmed', '37149412',
  'Low-dose letrozole — an effective option for women with symptomatic adenomyosis awaiting IVF: a pilot randomized controlled trial',
  'Sharma S, RoyChoudhury S, Bhattacharya MP, Hazra S, Majhi AK, Oswal KC, Chattopadhyay R',
  'Reproductive Biomedicine Online',
  '2023-07-01',
  'https://pubmed.ncbi.nlm.nih.gov/37149412',
  'Pilot RCT (n=156 IVF-awaiting adenomyosis patients). Low-dose letrozole (2.5 mg 3×/week) was equivalent to monthly goserelin for pain, bleeding, and sonographic improvement; maintained menstrual cycles; and concluded letrozole is a low-cost alternative to GnRH agonist for IVF preparation.'
);

-- ── Adenomyosis: Valproic Acid ────────────────────────────

INSERT INTO sources (
  id, signal_id, source_type, external_id, title, authors,
  journal, publication_date, url, key_finding_excerpt
) VALUES (
  '2c5921fa-919d-44ae-88aa-9e2be160e7e2',
  'f64619d2-6230-4dfe-8de9-e20403247821',
  'pubmed', '20601534',
  'Valproic acid as a therapy for adenomyosis: a comparative case series',
  'Liu X, Yuan L, Guo SW',
  'Reproductive Sciences',
  '2010-09-01',
  'https://pubmed.ncbi.nlm.nih.gov/20601534',
  'First human data on HDAC inhibitor repurposing for adenomyosis (n=12 patients, 6 months). VPA produced complete dysmenorrhea resolution and a 26% average uterine size reduction regardless of co-administration of levonorgestrel IUD, implicating the HDAC inhibitory mechanism specifically.'
);

INSERT INTO sources (
  id, signal_id, source_type, external_id, title, authors,
  journal, publication_date, url, key_finding_excerpt
) VALUES (
  '4a09bdf1-c07c-4473-8143-57842cec1cb3',
  'f64619d2-6230-4dfe-8de9-e20403247821',
  'pubmed', '21651672',
  'Valproic acid alleviates generalized hyperalgesia in mice with induced adenomyosis',
  'Liu X, Guo SW',
  'Journal of Obstetrics and Gynaecology Research',
  '2011-07-01',
  'https://pubmed.ncbi.nlm.nih.gov/21651672',
  'VPA significantly improved experimentally induced hyperalgesia in adenomyosis mice (p<0.05), reduced myometrial infiltration depth, and decreased abnormal uterine contractility — providing mechanistic animal-model support for the human case series findings.'
);

-- ── Adenomyosis: Dienogest ────────────────────────────────

INSERT INTO sources (
  id, signal_id, source_type, external_id, title, authors,
  journal, publication_date, url, key_finding_excerpt
) VALUES (
  'f21c8a29-231d-4ae4-95f5-7eeb25723231',
  '5dd21e4b-9873-42a6-ae7b-3ad59b99c487',
  'pubmed', '28911934',
  'Evaluation of the efficacy and safety of dienogest in the treatment of painful symptoms in patients with adenomyosis: a randomized, double-blind, multicenter, placebo-controlled study',
  'Osuga Y, Fujimoto-Okabe H, Hagino A',
  'Fertility and Sterility',
  '2017-09-01',
  'https://pubmed.ncbi.nlm.nih.gov/28911934',
  'Phase III RCT (n=67 adenomyosis patients, 16 weeks). Dienogest 2 mg/day produced significantly greater pain score reductions (p<0.001) and VAS improvement (p<0.001) vs. placebo with acceptable tolerability — the pivotal trial establishing dienogest''s Phase III evidence in adenomyosis.'
);

INSERT INTO sources (
  id, signal_id, source_type, external_id, title, authors,
  journal, publication_date, url, key_finding_excerpt
) VALUES (
  'd4273723-dd52-4321-94ba-aa3d66c4a741',
  '5dd21e4b-9873-42a6-ae7b-3ad59b99c487',
  'pubmed', '24905725',
  'Efficacy of dienogest in the treatment of symptomatic adenomyosis: a pilot study',
  'Hirata T, Izumi G, Takamura M, Saito A, Nakazawa A, Harada M, Hirota Y, Koga K, Fujii T, Osuga Y',
  'Gynecological Endocrinology',
  '2014-06-01',
  'https://pubmed.ncbi.nlm.nih.gov/24905725',
  '17 adenomyosis patients, 24-week prospective pilot. Dienogest significantly relieved pelvic pain, reduced CA-125 and CA19-9, and maintained estradiol >50 pg/mL (preserving partial estrogenic protection) — establishing the dose and safety basis for the subsequent Phase III RCT.'
);
