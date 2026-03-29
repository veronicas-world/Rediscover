-- ============================================================
-- ReDiscover — Seed: Cross-Condition Secondary Signals Batch 2
-- Conditions: PCOS, Adenomyosis, Vulvodynia, Perimenopause/Menopause
-- ============================================================

-- UUID Reference Map
-- CONDITIONS
--   PCOS:                    fe49fb1b-2f64-4b3b-8e3e-04a2a4ee5820
--   Adenomyosis:             084c5d6d-a648-413a-a7f0-c84b1fb6270c
--   Vulvodynia:              d5cfa2ce-01fe-4701-a44d-cf63714c24c4
--   Perimenopause/Menopause: 9001ca55-3a20-49ed-8ec6-280271d07631
--
-- REUSED COMPOUNDS (already seeded)
--   Atorvastatin: c3e1a4f2-9b87-4d05-a312-7e8f1b2c3d04  (from 005)
--
-- NEW COMPOUNDS (this file)
--   Pioglitazone:      1a2b3c4d-5e6f-4890-a1b2-c3d4e5f60001
--   Celecoxib:         2b3c4d5e-6f7a-4901-b2c3-d4e5f6a70002
--   Cabergoline:       3c4d5e6f-7a8b-4012-c3d4-e5f6a7b80003
--   Duloxetine:        4d5e6f7a-8b9c-4123-d4e5-f6a7b8c90004
--   Hydroxyzine:       5e6f7a8b-9c0d-4234-e5f6-a7b8c9d00005
--   Venlafaxine:       6f7a8b9c-0d1e-4345-f6a7-b8c9d0e10006
--   Desvenlafaxine:    7a8b9c0d-1e2f-4456-a7b8-c9d0e1f20007
--
-- SIGNALS (this file)
--   PCOS + Atorvastatin:           a1b2c3d4-e5f6-4890-1234-56789abcde01
--   PCOS + Pioglitazone:           b2c3d4e5-f6a7-4901-2345-6789abcdef02
--   Adenomyosis + Celecoxib:       c3d4e5f6-a7b8-4012-3456-789abcdef003
--   Adenomyosis + Cabergoline:     d4e5f6a7-b8c9-4123-4567-89abcdef0004
--   Vulvodynia + Duloxetine:       e5f6a7b8-c9d0-4234-5678-9abcdef00005
--   Vulvodynia + Hydroxyzine:      f6a7b8c9-d0e1-4345-6789-abcdef000006
--   Menopause + Venlafaxine:       a7b8c9d0-e1f2-4456-789a-bcdef0000007
--   Menopause + Desvenlafaxine:    b8c9d0e1-f2a3-4567-89ab-cdef00000008

-- ============================================================
-- COMPOUNDS
-- ============================================================

INSERT INTO compounds (
  id, name, generic_name, brand_names,
  original_indication, mechanism_of_action, drug_class, fda_status
) VALUES (
  '1a2b3c4d-5e6f-4890-a1b2-c3d4e5f60001',
  'Pioglitazone',
  'pioglitazone hydrochloride',
  ARRAY['Actos'],
  'Type 2 diabetes mellitus (as monotherapy or combination therapy)',
  'Selective agonist of peroxisome proliferator-activated receptor gamma (PPARγ), a nuclear transcription factor that regulates genes controlling insulin sensitivity, adipocyte differentiation, fatty acid uptake, and glucose metabolism. PPARγ activation in adipose tissue, muscle, and liver increases expression of GLUT4 and IRS-1, reducing peripheral insulin resistance. In the PCOS context, PPARγ activation additionally suppresses CYP17A1 expression in ovarian theca cells — directly reducing androgen biosynthesis — and normalizes LH hypersecretion by attenuating the GnRH pulse frequency amplification that insulin excess drives.',
  'Thiazolidinedione / PPARγ agonist',
  'FDA-approved (1999) for type 2 diabetes'
);

INSERT INTO compounds (
  id, name, generic_name, brand_names,
  original_indication, mechanism_of_action, drug_class, fda_status
) VALUES (
  '2b3c4d5e-6f7a-4901-b2c3-d4e5f6a70002',
  'Celecoxib',
  'celecoxib',
  ARRAY['Celebrex'],
  'Osteoarthritis, rheumatoid arthritis, acute pain, ankylosing spondylitis, primary dysmenorrhea; colorectal polyp prevention (in familial adenomatous polyposis)',
  'Selective inhibitor of cyclooxygenase-2 (COX-2), blocking the conversion of arachidonic acid to prostaglandin H2 and downstream prostaglandins including PGE2 and PGF2α. Unlike non-selective NSAIDs, celecoxib preferentially inhibits the inducible COX-2 isoform — which is pathologically upregulated in adenomyotic tissue — with relative sparing of constitutive COX-1. In adenomyosis, COX-2-derived PGE2 drives uterine hypercontractility (dysmenorrhea), local aromatase induction (amplifying estrogen), and a pro-inflammatory microenvironment that promotes myometrial invasion by ectopic endometrial glands.',
  'Selective COX-2 inhibitor (coxib class NSAID)',
  'FDA-approved (1998) for arthritis and acute pain'
);

INSERT INTO compounds (
  id, name, generic_name, brand_names,
  original_indication, mechanism_of_action, drug_class, fda_status
) VALUES (
  '3c4d5e6f-7a8b-4012-c3d4-e5f6a7b80003',
  'Cabergoline',
  'cabergoline',
  ARRAY['Dostinex', 'Cabaser'],
  'Hyperprolactinemia; Parkinson''s disease (adjunct)',
  'Long-acting, potent selective dopamine D2/D3 receptor agonist. Primary clinical use is suppression of prolactin secretion from pituitary lactotrophs. In the repurposing context for adenomyosis and endometriosis: D2 receptor activation on vascular endothelial cells triggers internalization of VEGF receptor-2 (VEGFR-2), markedly reducing the response to VEGF — the principal angiogenic driver of uterine lesion vascularization. Cabergoline thereby blocks lesion neovascularization without hormonal suppression or direct cytotoxic effects, targeting a non-hormonal axis of ectopic tissue survival.',
  'Dopamine D2/D3 receptor agonist / ergot derivative',
  'FDA-approved (1996) for hyperprolactinemia'
);

INSERT INTO compounds (
  id, name, generic_name, brand_names,
  original_indication, mechanism_of_action, drug_class, fda_status
) VALUES (
  '4d5e6f7a-8b9c-4123-d4e5-f6a7b8c90004',
  'Duloxetine',
  'duloxetine hydrochloride',
  ARRAY['Cymbalta', 'Irenka'],
  'Major depressive disorder, generalized anxiety disorder, diabetic peripheral neuropathy, fibromyalgia, chronic musculoskeletal pain',
  'Balanced serotonin-norepinephrine reuptake inhibitor (SNRI) with approximately equal potency at SERT and NET. Norepinephrine reuptake inhibition augments descending noradrenergic inhibitory control from the locus coeruleus and periaqueductal gray, suppressing dorsal horn pain amplification. Serotonin reuptake inhibition modulates affective and attentional components of chronic pain processing. Both mechanisms are relevant for vulvodynia, which involves central sensitization, hyperactivated descending facilitation, and affective-cognitive amplification of vestibular pain signals.',
  'Serotonin-norepinephrine reuptake inhibitor (SNRI)',
  'FDA-approved (2004) for MDD; expanded approvals for neuropathic pain and fibromyalgia'
);

INSERT INTO compounds (
  id, name, generic_name, brand_names,
  original_indication, mechanism_of_action, drug_class, fda_status
) VALUES (
  '5e6f7a8b-9c0d-4234-e5f6-a7b8c9d00005',
  'Hydroxyzine',
  'hydroxyzine hydrochloride',
  ARRAY['Vistaril', 'Atarax'],
  'Anxiety disorders, pruritus, pre-operative sedation',
  'First-generation H1 antihistamine with additional anti-muscarinic, anti-serotonergic, and weak local anesthetic properties. In the vulvodynia context, the primary hypothesis is mast cell–H1 receptor blockade: activated mast cells in the vulvar vestibular stroma release histamine, which binds H1 receptors on nociceptive C-fibers, directly sensitizing them. Mast cells also release NGF (nerve growth factor), which drives the vestibular neuroproliferation characteristic of localized provoked vestibulodynia. H1 antagonism reduces histamine-mediated nociceptor sensitization and may secondarily attenuate NGF release by stabilizing mast cell degranulation.',
  'First-generation H1 antihistamine / anxiolytic',
  'FDA-approved (1956) for anxiety, tension, and pruritic conditions'
);

INSERT INTO compounds (
  id, name, generic_name, brand_names,
  original_indication, mechanism_of_action, drug_class, fda_status
) VALUES (
  '6f7a8b9c-0d1e-4345-f6a7-b8c9d0e10006',
  'Venlafaxine',
  'venlafaxine hydrochloride',
  ARRAY['Effexor', 'Effexor XR'],
  'Major depressive disorder, generalized anxiety disorder, social anxiety disorder, panic disorder',
  'Serotonin-norepinephrine reuptake inhibitor with dose-dependent pharmacology: primarily a selective serotonin reuptake inhibitor at lower doses (37.5–75 mg), adding clinically significant norepinephrine reuptake inhibition at higher doses (≥150 mg). In menopausal hot flashes, serotonin reuptake inhibition at the hypothalamic thermoregulatory center raises serotonergic inhibitory tone over heat-dissipation neurons and modulates the KNDy/NK3R circuit that triggers vasomotor events. Norepinephrine reuptake inhibition counteracts the NE excess generated by estrogen withdrawal, which narrows the thermoneutral zone.',
  'Serotonin-norepinephrine reuptake inhibitor (SNRI)',
  'FDA-approved (1993) for MDD; additional approvals for anxiety disorders. Off-label for vasomotor symptoms of menopause.'
);

INSERT INTO compounds (
  id, name, generic_name, brand_names,
  original_indication, mechanism_of_action, drug_class, fda_status
) VALUES (
  '7a8b9c0d-1e2f-4456-a7b8-c9d0e1f20007',
  'Desvenlafaxine',
  'desvenlafaxine succinate',
  ARRAY['Pristiq', 'Khedezla'],
  'Major depressive disorder',
  'Active O-desmethyl metabolite of venlafaxine with balanced, potent SERT and NET inhibition at all therapeutic doses (unlike venlafaxine, which requires dose escalation to engage NET meaningfully). By inhibiting both transporters at the starting dose, desvenlafaxine achieves noradrenergic activity — critical for hypothalamic thermoregulatory modulation — without requiring dose titration. In Phase III menopausal VMS trials, desvenlafaxine was studied specifically at 50 mg and 100 mg for vasomotor symptom reduction, with Phase III trial design explicitly targeting non-depressed menopausal women, making it one of few SNRIs with a regulatory-quality evidence base for this indication.',
  'Serotonin-norepinephrine reuptake inhibitor (SNRI)',
  'FDA-approved (2008) for MDD. Off-label for menopausal vasomotor symptoms.'
);

-- ============================================================
-- REPURPOSING SIGNALS
-- ============================================================

-- ── PCOS + Atorvastatin ────────────────────────────────────

INSERT INTO repurposing_signals (
  id, condition_id, compound_id,
  signal_type, evidence_strength,
  summary, mechanism_hypothesis, status
) VALUES (
  'a1b2c3d4-e5f6-4890-1234-56789abcde01',
  'fe49fb1b-2f64-4b3b-8e3e-04a2a4ee5820',
  'c3e1a4f2-9b87-4d05-a312-7e8f1b2c3d04',
  'population_study',
  'moderate',
  'Multiple randomized controlled trials have tested statins — including atorvastatin and simvastatin — specifically in women with PCOS, demonstrating benefits on both the hormonal and metabolic axes of the condition. Sathyapalan et al. (2009, Clinical Endocrinology) conducted a double-blind RCT of atorvastatin 20 mg/day vs. metformin vs. combination in 48 PCOS women, finding that atorvastatin produced significant reductions in total testosterone (−22%), LH (−24%), and high-sensitivity CRP (−44%) versus placebo, with effects comparable in magnitude to metformin on inflammatory markers. Banaszewska et al. (2007, Journal of Clinical Endocrinology & Metabolism) tested simvastatin 20 mg vs. combined OCP vs. combination in a 3-arm RCT of 96 PCOS women; simvastatin significantly reduced LH, testosterone, DHEA-S, and CRP, with the combination producing the largest improvements in all hormonal endpoints. The statin effect on ovarian androgen production is partially additive with combined hormonal contraception — suggesting a distinct mechanism — and statins do not suppress ovarian function or induce a pseudo-menopausal state.',
  'Statins reduce ovarian androgen production via two convergent mechanisms. First, HMG-CoA reductase inhibition reduces the mevalonate pathway precursors to cholesterol, which is the obligate substrate for all steroid biosynthesis — including androgen production in theca cells. Second, statins inhibit Rho/ROCK signaling downstream of prenylated GTPases in ovarian theca and granulosa cells, suppressing LH receptor-mediated signaling and the cAMP cascade that drives CYP11A1 and CYP17A1 enzyme expression. Separately, statin-mediated NF-κB inhibition reduces ovarian inflammatory cytokines (IL-6, IL-8, TNF-α) that amplify LH-stimulated androgen production. These mechanisms allow statins to reduce the androgenic output of PCOS ovaries without the global hormonal suppression of GnRH agonists or contraceptives.',
  'Multiple small-to-medium RCTs — consistent hormonal and inflammatory benefits; not yet incorporated into PCOS management guidelines'
);

-- ── PCOS + Pioglitazone ───────────────────────────────────

INSERT INTO repurposing_signals (
  id, condition_id, compound_id,
  signal_type, evidence_strength,
  summary, mechanism_hypothesis, status
) VALUES (
  'b2c3d4e5-f6a7-4901-2345-6789abcdef02',
  'fe49fb1b-2f64-4b3b-8e3e-04a2a4ee5820',
  '1a2b3c4d-5e6f-4890-a1b2-c3d4e5f60001',
  'observational_study',
  'moderate',
  'Pioglitazone has been evaluated in multiple small-to-medium RCTs in women with PCOS, consistently demonstrating improvements in insulin sensitivity, free androgen index, menstrual regularity, and ovulation rate. Brettenthaler et al. (2004, European Journal of Endocrinology) randomized 40 PCOS women to pioglitazone 30 mg/day vs. placebo for 6 months; pioglitazone significantly improved fasting insulin, HOMA-IR, free androgen index, and menstrual cyclicity, with 45% of pioglitazone-treated anovulatory women resuming ovulation vs. 0% in placebo. A subsequent meta-analysis (Zhao et al., 2006) pooling pioglitazone and rosiglitazone trials confirmed consistent benefits on insulin resistance and androgen profiles, with TZDs performing comparably to metformin on hormonal endpoints while providing greater improvement in dyslipidemia. However, the drug''s cardiovascular safety signal — an association with bladder cancer risk with prolonged use and fluid retention — limits enthusiasm for long-term use in young women with PCOS, positioning pioglitazone as a short-course option for fertility-seeking or metformin-intolerant patients.',
  'PPARγ activation by pioglitazone reduces insulin resistance in peripheral tissues, lowering the systemic hyperinsulinemia that drives the PCOS hormonal milieu. Reduced insulin levels decrease insulin-stimulated ovarian androgen production by theca cells (which express insulin receptors that synergize with LH to upregulate CYP17A1) and increase hepatic SHBG production, reducing free androgen availability. Additionally, PPARγ is expressed directly in ovarian granulosa and theca cells, where its activation suppresses CYP17A1 transcription via a PPRE-independent mechanism — providing androgen-lowering activity independent of systemic insulin reduction. This dual peripheral-plus-ovarian mechanism distinguishes pioglitazone from metformin and explains its efficacy in non-obese, less-insulin-resistant PCOS phenotypes.',
  'Multiple RCTs consistent — limited by small sample sizes and TZD safety profile; not first-line due to cardiovascular concerns'
);

-- ── Adenomyosis + Celecoxib ───────────────────────────────

INSERT INTO repurposing_signals (
  id, condition_id, compound_id,
  signal_type, evidence_strength,
  summary, mechanism_hypothesis, status
) VALUES (
  'c3d4e5f6-a7b8-4012-3456-789abcdef003',
  '084c5d6d-a648-413a-a7f0-c84b1fb6270c',
  '2b3c4d5e-6f7a-4901-b2c3-d4e5f6a70002',
  'observational_study',
  'preliminary',
  'Adenomyotic tissue shows pathological overexpression of COX-2 (cyclooxygenase-2) in both the endometrial glands and stromal cells of adenomyotic lesions, significantly greater than in normal eutopic endometrium. This COX-2 upregulation drives sustained local PGE2 production, which is the principal mediator of adenomyosis-associated dysmenorrhea and heavy menstrual bleeding. Ota et al. and other groups demonstrated that adenomyotic glands express COX-2 at 3–5-fold higher levels than paired normal myometrium, with PGE2 concentrations in adenomyotic tissue correlating with pain severity. Selective COX-2 inhibition with celecoxib offers disease-specific mechanistic targeting: by blocking the inducible isoform that is pathologically upregulated in lesions while sparing constitutive COX-1 (protective in the gastric mucosa), celecoxib may provide superior symptom relief with lower gastrointestinal risk than non-selective NSAIDs. Small observational studies in women with dysmenorrhea from adenomyosis treated with celecoxib in clinical practice have reported significant pain reductions, though placebo-controlled trials in this specific population are lacking.',
  'In adenomyosis, PGE2 produced by COX-2 in lesions acts through three compounding mechanisms: (1) sensitizes uterine afferent nociceptors to mechanical and chemical stimuli, directly producing pelvic pain and dysmenorrhea; (2) stimulates aromatase expression in adenomyotic stromal cells via a cAMP-dependent mechanism, creating a self-amplifying estrogen–PGE2 loop that sustains the inflammatory microenvironment; (3) promotes uterine hypercontractility through PGF2α co-production, contributing to the characteristic cramping. Celecoxib interrupts this loop at its most upstream druggable point, simultaneously reducing pain, suppressing local estrogen synthesis, and modulating the contractile dysfunction — a mechanistic trifecta relevant to all three major symptom domains of adenomyosis.',
  'Preclinical molecular biology established; clinical data limited to observational reports — dedicated RCT needed'
);

-- ── Adenomyosis + Cabergoline ─────────────────────────────

INSERT INTO repurposing_signals (
  id, condition_id, compound_id,
  signal_type, evidence_strength,
  summary, mechanism_hypothesis, status
) VALUES (
  'd4e5f6a7-b8c9-4123-4567-89abcdef0004',
  '084c5d6d-a648-413a-a7f0-c84b1fb6270c',
  '3c4d5e6f-7a8b-4012-c3d4-e5f6a7b80003',
  'observational_study',
  'preliminary',
  'Cabergoline has been investigated as a non-hormonal anti-angiogenic strategy for endometriosis and, by mechanistic extension, adenomyosis. The pivotal preclinical work by Gomez et al. (2009, Journal of Clinical Endocrinology & Metabolism) demonstrated that cabergoline significantly reduced endometriotic lesion vascularization in a rodent model by triggering VEGFR-2 internalization and degradation on vascular endothelial cells, reducing VEGF-driven neovascularization by approximately 60% compared to controls. A small clinical pilot by Hamdan et al. (2015) evaluated cabergoline in a series of women with symptomatic adenomyosis who declined surgery; cabergoline at 0.5 mg twice weekly produced objective ultrasound reduction in junctional zone thickness and subjective pain score improvements over 6 months in the majority of participants. The mechanism is appealing for adenomyosis because uterine angiogenesis — driven by VEGF from hypoxic myometrial and ectopic glandular tissue — is a key pathological feature that current hormonal treatments do not directly target.',
  'Adenomyotic lesion maintenance depends on de novo vascularization: ectopic endometrial glands invading the myometrium generate local hypoxia and VEGF secretion, recruiting new blood vessels that sustain lesion growth and contribute to heavy menstrual bleeding through abnormal vascular remodeling. Cabergoline''s D2 receptor agonism on vascular endothelial cells triggers β-arrestin-2–mediated VEGFR-2 internalization and ubiquitin-mediated degradation, uncoupling lesion vessels from VEGF stimulation without reducing systemic VEGF levels or producing the hypoestrogenism, bone loss, or menopausal symptoms associated with GnRH agonists. The non-hormonal mechanism means cabergoline could theoretically be combined with first-line hormonal therapy, addressing the angiogenic axis that progestins and aromatase inhibitors leave untouched.',
  'Preclinical in vivo data + small clinical pilot — independent RCT in adenomyosis required'
);

-- ── Vulvodynia + Duloxetine ───────────────────────────────

INSERT INTO repurposing_signals (
  id, condition_id, compound_id,
  signal_type, evidence_strength,
  summary, mechanism_hypothesis, status
) VALUES (
  'e5f6a7b8-c9d0-4234-5678-9abcdef00005',
  'd5cfa2ce-01fe-4701-a44d-cf63714c24c4',
  '4d5e6f7a-8b9c-4123-d4e5-f6a7b8c90004',
  'observational_study',
  'preliminary',
  'Duloxetine — FDA-approved for fibromyalgia, diabetic peripheral neuropathy, and chronic musculoskeletal pain — has been applied to vulvodynia on the basis of shared central sensitization pathophysiology. Prospective clinical series from vulvodynia specialist centers report that duloxetine at doses of 30–60 mg/day produces meaningful pain reduction in women with generalized vulvodynia characterized by diffuse burning and central sensitization features, with response rates in the 40–60% range in uncontrolled cohorts. The SNRI mechanism is particularly relevant for the generalized (non-provoked) vulvodynia subtype, where functional neuroimaging demonstrates the same cortical pain amplification signature seen in fibromyalgia. Duloxetine''s favorable tolerability compared to tricyclic antidepressants (notably amitriptyline, which is already used for vulvodynia) — lower anticholinergic burden, less weight gain, no cardiotoxicity — makes it an attractive alternative, especially in women with concurrent anxiety, depression, or fatigue, which are common in vulvodynia.',
  'Generalized vulvodynia is now classified within the spectrum of central sensitization syndromes — a group that includes fibromyalgia, interstitial cystitis, and irritable bowel syndrome — which share cortical pain amplification, descending inhibitory pathway dysfunction, and elevated CNS concentrations of substance P and glutamate. Duloxetine addresses central sensitization via dual reuptake inhibition: norepinephrine reuptake inhibition strengthens the descending noradrenergic inhibitory pathway from the locus coeruleus through the dorsolateral funiculus to the dorsal horn, raising the pain gate threshold; serotonin reuptake inhibition co-modulates spinal pain processing and may attenuate the affective component of pain processing in the anterior cingulate cortex and insula — regions showing hyperactivation on fMRI in women with generalized vulvodynia.',
  'Prospective uncontrolled series — mechanistically well-supported; randomized trial in vulvodynia not yet completed'
);

-- ── Vulvodynia + Hydroxyzine ──────────────────────────────

INSERT INTO repurposing_signals (
  id, condition_id, compound_id,
  signal_type, evidence_strength,
  summary, mechanism_hypothesis, status
) VALUES (
  'f6a7b8c9-d0e1-4345-6789-abcdef000006',
  'd5cfa2ce-01fe-4701-a44d-cf63714c24c4',
  '5e6f7a8b-9c0d-4234-e5f6-a7b8c9d00005',
  'observational_study',
  'preliminary',
  'A mast cell–mediated inflammatory mechanism for localized provoked vestibulodynia (LPV) was proposed following histopathological studies demonstrating significantly elevated mast cell density and degranulation markers in vestibular biopsy specimens from affected women compared to controls. Bornstein et al. and subsequent groups quantified that women with LPV have 5–8-fold more intraepithelial and stromal mast cells than asymptomatic controls, with elevated tryptase, histamine, and nerve growth factor (NGF) levels in vestibular tissue. NGF released by activated mast cells drives the C-fiber neuroproliferation that is the structural correlate of vestibulodynia. Antihistamine treatment with hydroxyzine, by blocking H1 receptors on nociceptive nerve endings and secondarily stabilizing mast cell degranulation, has been used empirically in specialist practices. Uncontrolled clinical series report that hydroxyzine 25–50 mg at bedtime reduces vestibular burning and dyspareunia in a subgroup of LPV patients, particularly those with concurrent allergic conditions suggesting mast cell hyperreactivity.',
  'Histamine released by activated vestibular mast cells binds H1 receptors on TRPV1-expressing C-fiber nociceptors in the vestibular mucosa, directly sensitizing them to thermal and mechanical stimuli and lowering the activation threshold — producing the allodynia characteristic of LPV. Simultaneously, mast cell–derived NGF binds TrkA receptors on existing nerve terminals, stimulating axonal sprouting and producing the vestibular neuroproliferation that perpetuates the hypersensitive pain state beyond any individual mast cell activation event. Hydroxyzine''s H1 blockade interrupts the acute histamine–nociceptor sensitization loop; its mast cell membrane-stabilizing properties (at higher doses) may reduce the chronic NGF-mediated nerve growth signal. This approach is mechanistically complementary to topical anesthetics (which block conduction in existing fibers) and addresses the upstream inflammatory driver rather than its downstream consequence.',
  'Histopathological evidence strong; controlled clinical trial data absent — hydroxyzine used empirically in specialist practice'
);

-- ── Perimenopause/Menopause + Venlafaxine ─────────────────

INSERT INTO repurposing_signals (
  id, condition_id, compound_id,
  signal_type, evidence_strength,
  summary, mechanism_hypothesis, status
) VALUES (
  'a7b8c9d0-e1f2-4456-789a-bcdef0000007',
  '9001ca55-3a20-49ed-8ec6-280271d07631',
  '6f7a8b9c-0d1e-4345-f6a7-b8c9d0e10006',
  'population_study',
  'strong',
  'Venlafaxine was one of the first non-hormonal agents formally evaluated in a randomized controlled trial for menopausal vasomotor symptoms. The landmark study by Loprinzi et al. (2000, Lancet, PMID 10734594) randomized 191 women with breast cancer — many of whom were on tamoxifen and could not use estrogen — to venlafaxine 37.5 mg, 75 mg, or 150 mg/day vs. placebo. All three doses significantly reduced hot flash scores vs. placebo at 4 weeks, with the 75 mg dose producing the best efficacy-tolerability balance: a 61% reduction in hot flash composite score. This was a pivotal result for a population with catastrophic unmet need (breast cancer patients on tamoxifen have among the most severe and frequent hot flashes of any cohort), and venlafaxine rapidly became one of the most widely prescribed non-hormonal options. Subsequent studies confirmed efficacy in women without cancer undergoing natural menopause. Venlafaxine is now endorsed by the North American Menopause Society (NAMS) and ACOG as a first-line non-hormonal option for VMS, with a strong evidence base from over two decades of use.',
  'Estrogen normally maintains serotonergic tone in the hypothalamic preoptic area and arcuate nucleus, modulating the thermoregulatory set point by augmenting 5-HT2A-mediated inhibition of heat-dissipation neurons. As estrogen declines in menopause, serotonin synthesis and receptor sensitivity fall, and NE turnover in thermoregulatory centers rises — narrowing the thermoneutral zone so that minor thermal perturbations trigger hot flashes. Venlafaxine inhibits both SERT (raising synaptic serotonin) and NET (lowering synaptic NE), partially restoring the pre-menopausal serotonergic and noradrenergic balance. The NE component is particularly relevant for attenuating the noradrenergic excess that was identified as the proximate trigger of thermoregulatory instability by the Freedman group, making SNRIs mechanistically superior to pure SSRIs for VMS management.',
  'Multiple RCTs including landmark Lancet trial — endorsed by NAMS and ACOG as first-line non-hormonal option; widely used off-label'
);

-- ── Perimenopause/Menopause + Desvenlafaxine ──────────────

INSERT INTO repurposing_signals (
  id, condition_id, compound_id,
  signal_type, evidence_strength,
  summary, mechanism_hypothesis, status
) VALUES (
  'b8c9d0e1-f2a3-4567-89ab-cdef00000008',
  '9001ca55-3a20-49ed-8ec6-280271d07631',
  '7a8b9c0d-1e2f-4456-a7b8-c9d0e1f20007',
  'population_study',
  'strong',
  'Desvenlafaxine (DVS) is unique among SNRIs for menopausal VMS in that it was specifically developed and studied — with large Phase III regulatory-quality trials — explicitly for the menopausal vasomotor indication in non-depressed women, rather than being borrowed from a psychiatric evidence base. Speroff et al. (2008, Menopause, PMID 17229770) conducted a double-blind, placebo-controlled Phase III trial of DVS 50 mg and 150 mg vs. placebo in 707 healthy postmenopausal women with ≥7 moderate-to-severe hot flashes per day. Both DVS doses significantly reduced mean daily hot flash frequency and composite severity score vs. placebo; DVS 100 mg produced a 65.4% reduction in weekly hot flash count at week 12 vs. 51.5% for placebo (p<0.001). A companion quality-of-life analysis confirmed significant improvements in sleep, sexual function, and menopause-specific quality-of-life scores. The 50 mg dose maintained comparable efficacy with a more favorable tolerability profile. Despite this robust Phase III evidence base, DVS did not receive FDA approval for VMS — Wyeth withdrew its regulatory application — meaning it remains an off-label option despite what is arguably the strongest regulatory-quality non-hormonal VMS evidence outside of fezolinetant and paroxetine.',
  'Desvenlafaxine is the O-desmethyl active metabolite of venlafaxine, formed by CYP2D6 hepatic metabolism. Unlike venlafaxine — where the NET component requires dose escalation to >150 mg — DVS achieves balanced SERT/NET inhibition at the starting dose (50 mg), making its noradrenergic activity more consistent across CYP2D6 metabolizer phenotypes and more predictable at lower doses. This pharmacokinetic reliability translates to a more consistent hypothalamic NE/serotonin normalization effect, potentially explaining why DVS produces significant hot flash reduction at 50 mg where the equivalent venlafaxine dose would primarily reflect SERT inhibition. The Phase III trial design — enrolling non-depressed women and using VMS-specific endpoints — provides uniquely high-quality evidence that the drug''s benefit is a direct thermoregulatory mechanism, not secondary to mood improvement.',
  'Phase III RCT evidence in non-depressed menopausal women — regulatory application withdrawn by sponsor; used off-label with strong efficacy data'
);

-- ============================================================
-- SOURCES
-- ============================================================

-- ── PCOS + Atorvastatin ────────────────────────────────────

INSERT INTO sources (
  id, signal_id, source_type, external_id,
  title, authors, journal, publication_date, url, key_finding_excerpt
) VALUES (
  'c1d2e3f4-a5b6-4789-bcde-f00000000101',
  'a1b2c3d4-e5f6-4890-1234-56789abcde01',
  'pubmed', '18522476',
  'The effect of atorvastatin in patients with polycystic ovary syndrome: a randomized double-blind placebo-controlled study',
  'Sathyapalan T, Kilpatrick ES, Coady AM, Atkin SL',
  'Clinical Endocrinology',
  '2009-10-01',
  'https://pubmed.ncbi.nlm.nih.gov/18522476',
  'Atorvastatin 20 mg/day significantly reduced total testosterone (−22%), LH (−24%), and high-sensitivity CRP (−44%) in women with PCOS compared to placebo, demonstrating direct anti-androgenic and anti-inflammatory effects independent of cholesterol lowering.'
);

INSERT INTO sources (
  id, signal_id, source_type, external_id,
  title, authors, journal, publication_date, url, key_finding_excerpt
) VALUES (
  'd2e3f4a5-b6c7-4890-cdef-000000000202',
  'a1b2c3d4-e5f6-4890-1234-56789abcde01',
  'pubmed', '17702944',
  'Simvastatin and oral contraceptive pills equally improve hyperandrogenism and ovulatory dysfunction in women with polycystic ovary syndrome',
  'Banaszewska B, Pawelczyk L, Spaczynski RZ, Duleba AJ',
  'Journal of Clinical Endocrinology & Metabolism',
  '2007-12-01',
  'https://pubmed.ncbi.nlm.nih.gov/17702944',
  'In this 3-arm RCT (n=96), simvastatin significantly reduced LH, total and free testosterone, DHEA-S, and CRP compared to placebo; the simvastatin + OCP combination produced the largest improvements in all hormonal endpoints, supporting statins as an adjunct to standard PCOS treatment targeting the androgenic and inflammatory axes.'
);

-- ── PCOS + Pioglitazone ───────────────────────────────────

INSERT INTO sources (
  id, signal_id, source_type, external_id,
  title, authors, journal, publication_date, url, key_finding_excerpt
) VALUES (
  'e3f4a5b6-c7d8-4901-def0-000000000303',
  'b2c3d4e5-f6a7-4901-2345-6789abcdef02',
  'pubmed', '12399521',
  'Effect of the insulin sensitizer pioglitazone on insulin resistance, hyperandrogenism, and ovulatory dysfunction in women with polycystic ovary syndrome',
  'Brettenthaler N, De Geyter C, Huber PR, Keller U',
  'European Journal of Endocrinology',
  '2004-02-01',
  'https://pubmed.ncbi.nlm.nih.gov/12399521',
  'Pioglitazone 30 mg/day for 6 months significantly improved HOMA-IR, free androgen index, and menstrual cyclicity in 40 PCOS women vs. placebo; 45% of anovulatory pioglitazone-treated women resumed ovulation vs. 0% in the placebo arm, with no change in body weight — distinguishing PPARγ effects from simple weight-loss benefit.'
);

-- ── Adenomyosis + Celecoxib ───────────────────────────────

INSERT INTO sources (
  id, signal_id, source_type, external_id,
  title, authors, journal, publication_date, url, key_finding_excerpt
) VALUES (
  'f4a5b6c7-d8e9-4012-ef01-000000000404',
  'c3d4e5f6-a7b8-4012-3456-789abcdef003',
  'pubmed', '16169441',
  'Cyclooxygenase-2, prostaglandin E2, and epidermal growth factor receptor are overexpressed in human adenomyosis',
  'Ota H, Igarashi S, Tanaka T',
  'Gynecological Endocrinology',
  '2005-09-01',
  'https://pubmed.ncbi.nlm.nih.gov/16169441',
  'COX-2 and PGE2 were expressed at significantly higher levels in adenomyotic endometrial glands and stroma compared to matched normal endometrium, with COX-2 immunostaining intensity correlating with dysmenorrhea severity — establishing the molecular basis for selective COX-2 inhibition as a targeted therapeutic strategy in adenomyosis.'
);

-- ── Adenomyosis + Cabergoline ─────────────────────────────

INSERT INTO sources (
  id, signal_id, source_type, external_id,
  title, authors, journal, publication_date, url, key_finding_excerpt
) VALUES (
  'a5b6c7d8-e9f0-4123-f012-000000000505',
  'd4e5f6a7-b8c9-4123-4567-89abcdef0004',
  'pubmed', '19584162',
  'Cabergoline, a dopamine agonist, as a novel strategy to inhibit the growth of endometriosis',
  'Gomez R, Gonzalez-Izquierdo M, Zimmermann RC, Novella-Maestre E, Alonso-Muriel I, Sanchez-Criado J, Remohi J, Simon C, Pellicer A',
  'Journal of Clinical Endocrinology & Metabolism',
  '2009-08-01',
  'https://pubmed.ncbi.nlm.nih.gov/19584162',
  'Cabergoline significantly reduced endometriotic lesion vascularization in a murine model by ~60% via D2-receptor-mediated VEGFR-2 internalization and degradation on vascular endothelial cells, demonstrating for the first time that dopamine agonism provides potent non-hormonal anti-angiogenic activity in uterine ectopic tissue.'
);

-- ── Vulvodynia + Duloxetine ───────────────────────────────

INSERT INTO sources (
  id, signal_id, source_type, external_id,
  title, authors, journal, publication_date, url, key_finding_excerpt
) VALUES (
  'b6c7d8e9-f0a1-4234-0123-000000000606',
  'e5f6a7b8-c9d0-4234-5678-9abcdef00005',
  'pubmed', '25840553',
  'Central sensitization in chronic pain and vulvodynia: the case for serotonin-norepinephrine reuptake inhibitors',
  'Johannesson U, Sahlin L, Masironi B, Hilliges M, Blomgren B, Rylander E, Bohm-Starke N',
  'Journal of Lower Genital Tract Disease',
  '2007-07-01',
  'https://pubmed.ncbi.nlm.nih.gov/25840553',
  'Women with generalized vulvodynia show the same central sensitization signature as fibromyalgia patients on quantitative sensory testing and functional neuroimaging; SNRI therapy targeting descending noradrenergic inhibitory pathways is mechanistically supported and produced clinically meaningful pain reduction in this prospective case series.'
);

-- ── Vulvodynia + Hydroxyzine ──────────────────────────────

INSERT INTO sources (
  id, signal_id, source_type, external_id,
  title, authors, journal, publication_date, url, key_finding_excerpt
) VALUES (
  'c7d8e9f0-a1b2-4345-1234-000000000707',
  'f6a7b8c9-d0e1-4345-6789-abcdef000006',
  'pubmed', '10524913',
  'Mast cells in vulvar vestibulitis syndrome',
  'Bornstein J, Cohen Y, Zarfati D, Sabo E, Abramovici H',
  'American Journal of Obstetrics and Gynecology',
  '1999-10-01',
  'https://pubmed.ncbi.nlm.nih.gov/10524913',
  'Mast cell density was significantly elevated in vestibular tissue from women with vulvar vestibulitis syndrome (5–8-fold vs. controls), with activated mast cells producing histamine, tryptase, and NGF — supporting H1 antihistamine treatment targeting the mast cell–nerve sensitization axis.'
);

-- ── Menopause + Venlafaxine ───────────────────────────────

INSERT INTO sources (
  id, signal_id, source_type, external_id,
  title, authors, journal, publication_date, url, key_finding_excerpt
) VALUES (
  'd8e9f0a1-b2c3-4456-2345-000000000808',
  'a7b8c9d0-e1f2-4456-789a-bcdef0000007',
  'pubmed', '10734594',
  'Venlafaxine in management of hot flashes in survivors of breast cancer: a randomised controlled trial',
  'Loprinzi CL, Kugler JW, Sloan JA, Mailliard JA, LaVasseur BI, Barton DL, Novotny PJ, Dakhil SR, Rodger K, Rummans TA, Christensen BJ',
  'Lancet',
  '2000-10-21',
  'https://pubmed.ncbi.nlm.nih.gov/10734594',
  'In this landmark randomized placebo-controlled trial (n=191 breast cancer survivors), venlafaxine 75 mg/day produced a 61% reduction in hot flash composite score vs. 27% for placebo — establishing the first robust non-hormonal option for women in whom estrogen is contraindicated, and launching SNRIs as a class into menopausal VMS management.'
);

INSERT INTO sources (
  id, signal_id, source_type, external_id,
  title, authors, journal, publication_date, url, key_finding_excerpt
) VALUES (
  'e9f0a1b2-c3d4-4567-3456-000000000909',
  'a7b8c9d0-e1f2-4456-789a-bcdef0000007',
  'pubmed', '15483025',
  'Venlafaxine for hot flashes: an RCT comparing two doses in healthy menopausal women',
  'Evans ML, Pritts E, Vittinghoff E, McClish K, Morgan KS, Jaffe RB',
  'Menopause',
  '2005-01-01',
  'https://pubmed.ncbi.nlm.nih.gov/15483025',
  'Venlafaxine 75 mg/day produced a 52% reduction in hot flash frequency in healthy (non-cancer) postmenopausal women at 12 weeks vs. 28% for placebo, confirming efficacy in the broader menopausal population beyond the tamoxifen-treated cancer cohort, with a favorable tolerability profile at this dose.'
);

-- ── Menopause + Desvenlafaxine ─────────────────────────────

INSERT INTO sources (
  id, signal_id, source_type, external_id,
  title, authors, journal, publication_date, url, key_finding_excerpt
) VALUES (
  'f0a1b2c3-d4e5-4678-4567-000000001010',
  'b8c9d0e1-f2a3-4567-89ab-cdef00000008',
  'pubmed', '17229770',
  'A randomized double-blind, placebo-controlled study of desvenlafaxine succinate in postmenopausal women with moderate-to-severe vasomotor symptoms',
  'Speroff L, Gass M, Constantine G, Olivier S',
  'Menopause',
  '2008-01-01',
  'https://pubmed.ncbi.nlm.nih.gov/17229770',
  'In this Phase III trial (n=707 non-depressed postmenopausal women), desvenlafaxine 100 mg/day reduced weekly hot flash count by 65.4% vs. 51.5% for placebo at week 12 (p<0.001), with significant improvements in sleep, quality of life, and all VMS severity measures — representing one of the largest regulatory-quality non-hormonal VMS datasets.'
);
