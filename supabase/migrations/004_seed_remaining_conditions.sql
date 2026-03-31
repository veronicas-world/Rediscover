-- ============================================================
-- ReDiscover — Seed: Vulvodynia, Perimenopause & Menopause
-- All PMIDs verified against PubMed
-- ============================================================

-- UUID Reference Map
-- CONDITIONS
--   Vulvodynia:              d5cfa2ce-01fe-4701-a44d-cf63714c24c4
--   Perimenopause/Menopause: 9001ca55-3a20-49ed-8ec6-280271d07631
--
-- COMPOUNDS
--   Gabapentin:       24080694-86c9-482e-8365-c858668eacbc  (shared by both conditions)
--   Amitriptyline:    4e2cfe57-b707-4874-a9c3-b3235d4bb627
--   Capsaicin:        6d6ddda3-92e7-4888-a752-1a61f3d416fa
--   Botulinum Toxin A:6f15bc58-a4c3-4be1-b127-52da112f2610
--   Oxybutynin:       3ae7aa7b-be70-42c4-8537-7c537d60cd80
--   Clonidine:        1d3bb1a7-5b80-4486-8204-38988e1b1754
--   Escitalopram:     1f24aa8b-daec-4be4-93d4-e1ad758859ab
--
-- SIGNALS
--   Vulvodynia + Gabapentin:       7dd5569f-2fff-45bc-b284-a15b2b4b48b6
--   Vulvodynia + Amitriptyline:    66ab2e57-07dd-4935-a855-453d3666fc1f
--   Vulvodynia + Capsaicin:        ad9507d1-e323-43d7-a78f-1649b809441e
--   Vulvodynia + Botulinum Toxin:  6840fa08-f549-4dae-90f5-e46af19c3596
--   Menopause + Oxybutynin:        36d49d16-c66c-4a8e-8a08-688f9dd59883
--   Menopause + Gabapentin:        660fe36b-ec41-4f10-9e7d-e2829c547445
--   Menopause + Clonidine:         f624d1a7-aae1-44c7-b3db-dbd2f8ac01ed
--   Menopause + Escitalopram:      42063fe4-b882-4990-ad51-f498092bd480

-- ============================================================
-- CONDITIONS
-- ============================================================

INSERT INTO conditions (
  id, name, slug, description, prevalence_summary,
  treatment_gap_summary, biology_summary, underfunding_notes
) VALUES (
  'd5cfa2ce-01fe-4701-a44d-cf63714c24c4',
  'Vulvodynia',
  'vulvodynia',
  'Vulvodynia is chronic vulvar pain lasting at least three months with no identifiable cause. The most common form is provoked vestibulodynia, where pain is triggered by touch at the vaginal opening. It is a leading cause of sexual dysfunction and gynecologic care avoidance.',
  'Affects 8 to 16% of women across the lifespan. Four in ten affected women never seek care. Average time to correct diagnosis is 3 to 5 years.',
  'No FDA-approved treatment exists. Management is entirely off-label: topical anesthetics, neuromodulators, pelvic floor physical therapy, and surgery. The evidence base is weak and clinical guidelines are inconsistent.',
  'A pain sensitization disorder, not an infection or inflammatory condition. The vestibular tissue in affected women has 10 times the normal density of pain nerve fibers, with upregulated pain receptors. Brain imaging confirms that central pain processing is also altered.',
  'Classified as psychosomatic for decades. NIH funding is roughly 2.5 million dollars annually despite lifetime prevalence comparable to asthma. No pharmaceutical industry investment because no approved drug exists to build on.'
);

INSERT INTO conditions (
  id, name, slug, description, prevalence_summary,
  treatment_gap_summary, biology_summary, underfunding_notes
) VALUES (
  '9001ca55-3a20-49ed-8ec6-280271d07631',
  'Perimenopause & Menopause',
  'perimenopause-menopause',
  'Perimenopause is the 4 to 10 year transition before menopause, during which hormones fluctuate and symptoms begin. Menopause is confirmed after 12 consecutive months without a period. Hot flashes and night sweats are the hallmark complaints. Genitourinary changes, mood disruption, and insomnia are common and frequently undertreated.',
  'Universal for all women with ovaries. 1.3 million US women reach menopause annually. Vasomotor symptoms affect 70 to 80% of women during the transition. One in four describes symptoms as severely disruptive to work and sleep. Symptoms persist for a median of 7 to 10 years.',
  'Hormone therapy remains the most effective treatment but is contraindicated or declined by many women. Only two non-hormonal drugs are FDA-approved for hot flashes. All other options including gabapentin, clonidine, and SSRIs are used off-label.',
  'Hot flashes are driven by loss of estrogen''s suppression of neurokinin B signaling in the hypothalamus. Rising neurokinin B activity disrupts the thermoregulatory set point, triggering vasodilation and sweating. This pathway is the target of fezolinetant, the newest approved treatment. Serotonin and norepinephrine pathways are also involved, explaining why SSRIs and clonidine help.',
  'The 2002 WHI study was widely misinterpreted, causing a decade of hormone therapy under-prescribing that left millions of women undertreated. Risk-benefit data has since been substantially rehabilitated. Fewer than 20% of ob-gyn residents feel adequately trained in menopause management.'
);

-- ============================================================
-- COMPOUNDS
-- ============================================================

INSERT INTO compounds (
  id, name, generic_name, brand_names, original_indication,
  mechanism_of_action, drug_class, fda_status
) VALUES (
  '24080694-86c9-482e-8365-c858668eacbc',
  'Gabapentin',
  'gabapentin',
  ARRAY['Neurontin', 'Gralise', 'Horizant'],
  'Epilepsy (adjunctive); postherpetic neuralgia',
  'Alpha-2-delta (α2δ) subunit ligand of voltage-gated calcium channels. Binding reduces calcium influx at presynaptic terminals, decreasing release of excitatory neurotransmitters (glutamate, substance P, CGRP) from sensitized neurons. In vulvodynia, reduces peripheral nociceptor hyperexcitability and central sensitization by dampening aberrant C-fiber firing in the hyperproliferative vestibular nerve endings. In menopause, modulates hypothalamic thermoregulatory circuits by reducing excitatory neurotransmission in the arcuate nucleus, stabilizing the thermoneutral zone independently of estrogen.',
  'α2δ calcium channel ligand / anticonvulsant / neuromodulator',
  'FDA-approved for postherpetic neuralgia (2002) and epilepsy; off-label for vulvodynia and vasomotor symptoms'
);

INSERT INTO compounds (
  id, name, generic_name, brand_names, original_indication,
  mechanism_of_action, drug_class, fda_status
) VALUES (
  '4e2cfe57-b707-4874-a9c3-b3235d4bb627',
  'Amitriptyline',
  'amitriptyline hydrochloride',
  ARRAY['Elavil', 'Endep'],
  'Major depressive disorder; neuropathic pain (off-label)',
  'Tricyclic antidepressant with multiple mechanisms relevant to chronic pain: (1) blocks reuptake of norepinephrine and serotonin, increasing descending inhibitory pain control via the periaqueductal gray and dorsal horn; (2) blocks Nav1.7 and Nav1.8 sodium channels at low doses, reducing ectopic discharge in sensitized peripheral nociceptors; (3) antagonizes NMDA receptors, reducing central sensitization wind-up; (4) blocks histamine H1 and muscarinic M1 receptors, producing sedation that improves sleep disrupted by chronic pain. In vulvodynia, primarily targets the neuroproliferative C-fiber hyperexcitability and central sensitization thought to maintain the pain state after the initial trigger has resolved.',
  'Tricyclic antidepressant (TCA) / sodium channel blocker',
  'FDA-approved for major depression; off-label for neuropathic pain and vulvodynia'
);

INSERT INTO compounds (
  id, name, generic_name, brand_names, original_indication,
  mechanism_of_action, drug_class, fda_status
) VALUES (
  '6d6ddda3-92e7-4888-a752-1a61f3d416fa',
  'Capsaicin',
  'capsaicin',
  ARRAY['Zostrix', 'Qutenza', 'Capzasin'],
  'Peripheral neuropathic pain; postherpetic neuralgia (high-concentration patch)',
  'Highly selective agonist of TRPV1 (transient receptor potential vanilloid 1), the primary nociceptive heat and pain transducer on C-fiber and Aδ nociceptors. Initial topical application causes intense TRPV1 activation and substance P release (causing burning). Prolonged or repeated application produces defunctionalization: TRPV1-expressing nerve endings are reversibly depleted of substance P, desensitized to further stimuli, and — with sufficient exposure — undergo a retraction of epidermal nerve fiber density. In vulvodynia, where vestibular nerve fiber density is pathologically increased 10-fold with TRPV1 upregulation, capsaicin directly targets the aberrant nociceptive apparatus. The defunctionalization effect may persist for weeks to months after application ceases.',
  'TRPV1 agonist / topical analgesic',
  'FDA-approved (topical OTC and 8% prescription patch Qutenza for PHN); off-label for vulvodynia'
);

INSERT INTO compounds (
  id, name, generic_name, brand_names, original_indication,
  mechanism_of_action, drug_class, fda_status
) VALUES (
  '6f15bc58-a4c3-4be1-b127-52da112f2610',
  'Botulinum Toxin A',
  'onabotulinumtoxinA',
  ARRAY['Botox', 'Dysport', 'Xeomin'],
  'Cervical dystonia, blepharospasm, chronic migraine, spasticity, overactive bladder, hyperhidrosis',
  'Cleaves SNAP-25 (synaptosomal-associated protein 25), a component of the SNARE complex required for vesicle fusion and neurotransmitter release. Local injection blocks acetylcholine release at neuromuscular junctions (causing temporary muscle paralysis) and reduces release of substance P, CGRP, and glutamate from sensory nerve terminals. In vulvodynia and vaginismus, targets two distinct mechanisms: (1) pelvic floor hypertonicity — injection into levator ani and puborectalis reduces the involuntary muscle guarding that perpetuates mechanical allodynia; (2) peripheral sensitization — reduces neuropeptide release from vestibular C-fibers, decreasing neurogenic inflammation and pain sensitization. Effects are temporary (3–6 months) and reversible.',
  'Neurotoxin / acetylcholine release inhibitor',
  'FDA-approved for multiple indications including overactive bladder, chronic migraine, spasticity; off-label for vulvodynia and vaginismus'
);

INSERT INTO compounds (
  id, name, generic_name, brand_names, original_indication,
  mechanism_of_action, drug_class, fda_status
) VALUES (
  '3ae7aa7b-be70-42c4-8537-7c537d60cd80',
  'Oxybutynin',
  'oxybutynin chloride',
  ARRAY['Ditropan', 'Oxytrol', 'Gelnique'],
  'Overactive bladder; urinary urge incontinence',
  'Competitive antagonist of muscarinic acetylcholine receptors (primarily M1 and M3), with additional direct smooth muscle spasmolytic activity and some local anesthetic properties. In overactive bladder, blocks detrusor muscle M3 receptors to reduce urgency and frequency. In menopausal vasomotor symptoms, the proposed mechanism involves central anticholinergic effects: muscarinic M1 receptor antagonism in the hypothalamic preoptic area inhibits cholinergic thermoregulatory signaling that modulates heat-dissipation responses, raising the threshold for hot flash triggering. Oxybutynin also crosses the blood-brain barrier more readily than many other anticholinergics, potentially contributing to central thermoregulatory modulation.',
  'Anticholinergic / antimuscarinic',
  'FDA-approved for overactive bladder; off-label for vasomotor symptoms'
);

INSERT INTO compounds (
  id, name, generic_name, brand_names, original_indication,
  mechanism_of_action, drug_class, fda_status
) VALUES (
  '1d3bb1a7-5b80-4486-8204-38988e1b1754',
  'Clonidine',
  'clonidine hydrochloride',
  ARRAY['Catapres', 'Kapvay', 'Nexiclon'],
  'Hypertension; ADHD (extended-release); opioid withdrawal',
  'Central α2-adrenergic receptor agonist. Stimulates presynaptic α2 receptors in the locus coeruleus and hypothalamus, reducing norepinephrine (NE) release and sympathetic outflow. In hypertension, lowers blood pressure by reducing sympathetic vascular tone. In menopause, the relevant mechanism is thermoregulatory: declining estrogen increases NE turnover in the hypothalamic preoptic area, narrowing the thermoneutral zone and lowering the threshold at which the hypothalamus triggers heat-dissipation responses (sweating, vasodilation). Clonidine''s central α2 agonism reduces hypothalamic NE activity, partially restoring the thermoneutral zone and reducing hot flash frequency and severity.',
  'Central α2-adrenergic agonist / antihypertensive',
  'FDA-approved for hypertension and ADHD; off-label for vasomotor symptoms'
);

INSERT INTO compounds (
  id, name, generic_name, brand_names, original_indication,
  mechanism_of_action, drug_class, fda_status
) VALUES (
  '1f24aa8b-daec-4be4-93d4-e1ad758859ab',
  'Escitalopram',
  'escitalopram oxalate',
  ARRAY['Lexapro', 'Cipralex'],
  'Major depressive disorder; generalized anxiety disorder',
  'Highly selective serotonin reuptake inhibitor (SSRI). Blocks the serotonin transporter (SERT), increasing synaptic serotonin concentrations throughout the central nervous system. In menopausal vasomotor symptoms, serotonin modulates hypothalamic thermoregulatory circuits via 5-HT2A and 5-HT1A receptors in the preoptic area. Declining estrogen reduces serotonergic tone; escitalopram''s SERT inhibition compensates, partially restoring serotonergic modulation of the thermoneutral zone. Additionally, serotonin inhibits NKB signaling (the primary molecular driver of hot flashes) in the arcuate nucleus. Escitalopram is used at sub-antidepressant doses (10–20 mg vs. standard 20 mg) for vasomotor symptoms, and may provide mood benefit in perimenopausal depression as a secondary effect.',
  'Selective serotonin reuptake inhibitor (SSRI)',
  'FDA-approved for major depression and generalized anxiety disorder; off-label for vasomotor symptoms (paroxetine/Brisdelle is the only approved SSRI for this indication)'
);

-- ============================================================
-- REPURPOSING SIGNALS
-- ============================================================

-- ── Vulvodynia signals ────────────────────────────────────

INSERT INTO repurposing_signals (
  id, condition_id, compound_id, signal_type, evidence_strength,
  summary, mechanism_hypothesis, status
) VALUES (
  '7dd5569f-2fff-45bc-b284-a15b2b4b48b6',
  'd5cfa2ce-01fe-4701-a44d-cf63714c24c4',
  '24080694-86c9-482e-8365-c858668eacbc',
  'Observational cohort + RCT (mixed results)',
  'preliminary',
  'Gabapentin is one of the most commonly prescribed off-label neuromodulators for vulvodynia, particularly generalized unprovoked vulvodynia where central sensitization is the dominant pathophysiology. A retrospective cohort by Harris, Horowitz & Borgida (2007, Journal of Reproductive Medicine, PMID 17393770) in 152 patients found that 64% achieved at least 80% symptom resolution with gabapentin, supporting its clinical utility in routine practice. A 2008 pilot study of topical gabapentin (Boardman et al., PMID 18757655) in 35 women demonstrated pain VAS scores falling from 7.3 to 2.5 — an 66% reduction — with approximately 80% achieving at least 50% improvement, while minimizing systemic side effects. However, a 2018 RCT by Brown, Bachmann et al. (PMID 29742655, n=89 women with localized provoked vestibulodynia) found that extended-release gabapentin (1,200–3,000 mg/day) did not significantly outperform placebo on the primary tampon test pain score. The totality of evidence suggests gabapentin may be more effective for generalized unprovoked vulvodynia (centrally mediated) than for localized provoked vestibulodynia (peripherally mediated), with topical formulations warranting further investigation.',
  'Vulvodynia — particularly the generalized unprovoked subtype — involves central sensitization: dorsal horn wind-up, cortical pain amplification, and reduced descending inhibition indistinguishable from other chronic neuropathic pain states. Gabapentin''s α2δ subunit binding reduces presynaptic calcium influx in the dorsal horn, decreasing glutamate and substance P release from hyperexcitable central synapses. In vestibulodynia, the hyperproliferative C-fiber nerve endings in vestibular mucosa overexpress α2δ subunits alongside TRPV1 and NGF receptors, making them a plausible peripheral target for gabapentin. Topical formulations exploit this peripheral nociceptor target while avoiding systemic CNS side effects (somnolence, cognitive blunting) that limit oral dosing.',
  'Mixed evidence — observational cohort data positive; RCT for localized vestibulodynia negative; topical route promising but underpowered'
);

INSERT INTO repurposing_signals (
  id, condition_id, compound_id, signal_type, evidence_strength,
  summary, mechanism_hypothesis, status
) VALUES (
  '66ab2e57-07dd-4935-a855-453d3666fc1f',
  'd5cfa2ce-01fe-4701-a44d-cf63714c24c4',
  '4e2cfe57-b707-4874-a9c3-b3235d4bb627',
  'Case series + RCT (mixed results)',
  'preliminary',
  'Amitriptyline is among the oldest and most widely used off-label treatments for vulvodynia, based on its established efficacy in other neuropathic pain conditions. McKay (1993, Journal of Reproductive Medicine, PMID 8441136) described favorable outcomes with low-dose oral amitriptyline (10–60 mg/day) in 20 patients with dysesthetic/essential vulvodynia, coining the concept of a distinct neurological subtype responsive to tricyclics. Pagano & Wong (2012, PMID 22622338) reported that topical amitriptyline 2% cream produced meaningful improvement in 56% of 150 women with provoked vestibulodynia, offering the advantages of local drug delivery without systemic anticholinergic side effects. However, a randomized controlled trial by Brown et al. (2009, PMID 19183087) comparing oral amitriptyline ± topical triamcinolone vs. self-management in 53 women found no statistically significant advantage for amitriptyline — and a companion RCT by Foster et al. (2010, PMID 20733439) of the closely related tricyclic desipramine also failed to show superiority over placebo. The RCT evidence is substantially limited by small sample sizes, heterogeneous patient populations (mixing provoked and generalized subtypes), and short duration of treatment relative to the natural history of the condition.',
  'Low-dose amitriptyline''s analgesic mechanism in vulvodynia is distinct from its antidepressant mechanism. Below antidepressant thresholds (10–50 mg vs. therapeutic 150+ mg), amitriptyline exerts clinically significant sodium channel blockade (Nav1.7, Nav1.8) in peripheral nociceptors — reducing ectopic discharge from hyperexcitable C-fibers — and NMDA receptor antagonism in the dorsal horn, attenuating central sensitization wind-up. Serotonin-norepinephrine reuptake inhibition at these doses augments descending inhibitory control from the periaqueductal gray. The topical route delivers amitriptyline directly to vestibular mucosa at concentrations sufficient for sodium channel blockade without systemic absorption, potentially explaining the modest clinical response seen despite negative systemic RCT data.',
  'RCT evidence negative for systemic formulations; topical route shows observational benefit; requires adequately powered RCT with subtype stratification'
);

INSERT INTO repurposing_signals (
  id, condition_id, compound_id, signal_type, evidence_strength,
  summary, mechanism_hypothesis, status
) VALUES (
  'ad9507d1-e323-43d7-a78f-1649b809441e',
  'd5cfa2ce-01fe-4701-a44d-cf63714c24c4',
  '6d6ddda3-92e7-4888-a752-1a61f3d416fa',
  'Uncontrolled prospective + small RCTs',
  'preliminary',
  'Topical capsaicin has been investigated for vulvodynia on the basis of its mechanism: directly targeting TRPV1-expressing nerve fibers, which are pathologically overabundant in the vestibular mucosa in vulvodynia. Two published studies provide the core evidence. Murina, Radici & Bianco (2004, MedGenMed, PMID 15775875) treated 33 women with vestibulitis with topical capsaicin 0.05%; 59% showed symptom improvement, but all patients relapsed after discontinuation and the treatment was limited by severe application-site burning. Steinberg et al. (2005, American Journal of Obstetrics & Gynecology, PMID 15902156) reported more robust results: daily topical capsaicin 0.025% for 12 weeks produced a Kaufman touch test score reduction from 13.2 to 4.8 (p<0.001) and significant Marinoff dyspareunia scale improvement. Capsaicin requires pre-treatment with topical lidocaine given the intense initial burning, limiting its practical use to motivated patients under clinical supervision. The evidence base is small and uncontrolled, but mechanistic plausibility is strong given the TRPV1 biology of vestibulodynia.',
  'Localized provoked vestibulodynia is characterized by a 10-fold increase in intraepithelial C-fiber density in the vestibular mucosa, with these supernumerary nerve fibers showing pronounced TRPV1 upregulation — the exact receptor targeted by capsaicin. Capsaicin''s initial TRPV1 agonism causes intense substance P release and burning (the dose-limiting side effect), followed by prolonged TRPV1 desensitization and, with repeated application, retraction of TRPV1-expressing epidermal nerve fiber terminals. This defunctionalization effect is mechanistically specific to the pathological nerve proliferation of vestibulodynia — potentially reducing vestibular nerve fiber density toward normal levels. Unlike most vulvodynia treatments, capsaicin targets the structural abnormality (nerve hyperplasia) rather than downstream pain signaling, which is why its effects outlast the application period.',
  'Small uncontrolled studies — strong mechanistic rationale; requires dose-optimization RCT with pre-treatment analgesia protocol'
);

INSERT INTO repurposing_signals (
  id, condition_id, compound_id, signal_type, evidence_strength,
  summary, mechanism_hypothesis, status
) VALUES (
  '6840fa08-f549-4dae-90f5-e46af19c3596',
  'd5cfa2ce-01fe-4701-a44d-cf63714c24c4',
  '6f15bc58-a4c3-4be1-b127-52da112f2610',
  'Multiple randomized controlled trials (mixed results)',
  'moderate',
  'Botulinum toxin A has been evaluated in multiple RCTs for vulvodynia and vaginismus, with consistent signal for pelvic floor muscle relaxation benefit but inconsistent evidence for vestibular pain reduction. Petersen et al. (2009, Journal of Sexual Medicine, PMID 19619148) randomized 64 women with provoked vestibulodynia to botulinum toxin A vs. saline; both groups improved significantly with no statistically significant difference between groups, suggesting a strong placebo response. Haraldson et al. (2020, Obstetrics & Gynecology, PMID 32769643) in 88 women similarly found no significant primary endpoint difference but did observe a significant 11-unit reduction in tampon insertion pain as a secondary outcome and meaningful reductions in pelvic floor muscle tension in the active arm. For vaginismus — which overlaps significantly with provoked vestibulodynia — Ghazizadeh & Nikzad (2004, PMID 15516379) reported that botulinum toxin injections in 24 women with severe refractory vaginismus produced 75% achieving satisfactory intercourse at 12-month follow-up. The overall picture suggests botulinum toxin is effective for the pelvic floor hypertonicity component of vulvodynia but may not directly address vestibular nociceptor sensitization.',
  'Botulinum toxin A addresses the pelvic floor hypertonicity that is present in the majority of women with provoked vestibulodynia and vaginismus. Hypertonicity is both a primary risk factor and a perpetuating mechanism: sustained levator ani and puborectalis contraction creates mechanical pressure on the vestibule and pudendal nerve branches, amplifying allodynia through constant mechanical stimulation of already-sensitized tissues. Botulinum toxin''s SNAP-25 cleavage in pelvic floor motor neuromuscular junctions temporarily reduces involuntary muscle guarding, breaking the pain-guarding-pain cycle. A secondary mechanism — direct inhibition of substance P and CGRP release from sensory nerve terminals near the injection sites — may contribute analgesic effects at vestibular tissue independently of the muscle relaxation effect, though the relative contributions are difficult to separate clinically.',
  'Multiple RCTs — primary endpoints mixed; significant secondary outcomes for pelvic floor hypertonicity and vaginismus; off-label use common in specialist practice'
);

-- ── Perimenopause / Menopause signals ────────────────────

INSERT INTO repurposing_signals (
  id, condition_id, compound_id, signal_type, evidence_strength,
  summary, mechanism_hypothesis, status
) VALUES (
  '36d49d16-c66c-4a8e-8a08-688f9dd59883',
  '9001ca55-3a20-49ed-8ec6-280271d07631',
  '3ae7aa7b-be70-42c4-8537-7c537d60cd80',
  'Randomized controlled trial',
  'moderate',
  'Oxybutynin, approved for overactive bladder, has emerged as a promising non-hormonal option for hot flash management in both women with natural menopause and those with breast cancer. A double-blind, placebo-controlled RCT by Leon-Ferre et al. (JNCI Cancer Spectrum, 2019/2020, PMID 32337497) randomized 150 women to oxybutynin 2.5 mg twice daily, 5 mg twice daily, or placebo. Both oxybutynin doses produced significantly greater reductions in weekly hot flash scores versus placebo; the 5 mg dose achieved a 16.9-point score reduction vs. 5.7 points for placebo. Oxybutynin was well tolerated at both doses, with mild-to-moderate dry mouth (the main side effect, consistent with its anticholinergic class) and no significant urinary symptoms. Crucially, the trial enrolled women with and without breast cancer, addressing an unmet need in the oncology population where estrogen therapy is contraindicated. The drug is generic, low-cost, and widely available — making it a pragmatically attractive non-hormonal option if findings are replicated.',
  'The hypothalamic preoptic area contains muscarinic acetylcholine receptors (M1 subtype) on thermoregulatory neurons. Cholinergic input to the preoptic area promotes heat dissipation — sweating and vasodilation — as part of the normal thermoregulatory reflex. During menopause, declining estrogen destabilizes the thermoneutral zone, so that normal cholinergic fluctuations trigger inappropriate heat-dissipation responses (hot flashes). Oxybutynin''s M1 antagonism in the hypothalamic preoptic area raises the threshold at which cholinergic stimulation triggers the heat-dissipation cascade, stabilizing the thermoregulatory set point. This mechanism is pharmacologically distinct from all other non-hormonal approaches (which target adrenergic, serotonergic, or neurokinin pathways), suggesting potential additive efficacy in combination regimens and utility in patients non-responsive to other agents.',
  'Phase II-equivalent RCT — single large trial; confirmatory replication and longer-term safety data needed'
);

INSERT INTO repurposing_signals (
  id, condition_id, compound_id, signal_type, evidence_strength,
  summary, mechanism_hypothesis, status
) VALUES (
  '660fe36b-ec41-4f10-9e7d-e2829c547445',
  '9001ca55-3a20-49ed-8ec6-280271d07631',
  '24080694-86c9-482e-8365-c858668eacbc',
  'Randomized controlled trial',
  'moderate',
  'Gabapentin was one of the earliest non-hormonal drugs systematically evaluated for menopausal vasomotor symptoms. A landmark double-blind RCT by Guttuso et al. (2003, Obstetrics & Gynecology, PMID 12576259) randomized 59 postmenopausal women to gabapentin 900 mg/day vs. placebo for 12 weeks; gabapentin produced a 45% reduction in hot flash frequency and 54% composite score reduction versus 29%/31% for placebo (both p<0.05). An open-label extension to 2,700 mg/day demonstrated further improvement. Subsequent meta-analyses and guideline reviews have confirmed a clinically meaningful but modest gabapentin effect on hot flash frequency (typically 20–30% additional reduction vs. placebo), with the strongest evidence in women with breast cancer on endocrine therapy — a population with frequent, severe vasomotor symptoms and an absolute contraindication to estrogen. Somnolence, dizziness, and cognitive effects at higher doses are the primary limitations.',
  'Gabapentin''s α2δ subunit binding reduces glutamatergic and noradrenergic neurotransmitter release in the hypothalamic thermoregulatory center. During menopause, the KNDy neuron circuit — which governs thermoregulatory set point via neurokinin B signaling — becomes hyperactive as estrogen-mediated suppression is lost. Gabapentin does not directly target NK3 receptors (the primary molecular driver of hot flashes) but modulates the broader excitatory neurotransmitter milieu of the arcuate nucleus and preoptic area, reducing the excitatory drive to heat-dissipation neurons. This upstream modulatory role explains the partial (rather than complete) efficacy of gabapentin vs. estrogen or fezolinetant. The drug also improves sleep architecture — which is often severely disrupted by night sweats — providing quality-of-life benefit beyond direct vasomotor suppression.',
  'RCT evidence established — multiple trials confirming efficacy; widely used off-label particularly in oncology setting'
);

INSERT INTO repurposing_signals (
  id, condition_id, compound_id, signal_type, evidence_strength,
  summary, mechanism_hypothesis, status
) VALUES (
  'f624d1a7-aae1-44c7-b3db-dbd2f8ac01ed',
  '9001ca55-3a20-49ed-8ec6-280271d07631',
  '1d3bb1a7-5b80-4486-8204-38988e1b1754',
  'Multiple randomized controlled trials',
  'moderate',
  'Clonidine is one of the longest-studied non-hormonal options for menopausal hot flashes, with RCT evidence dating to the 1990s. Goldberg et al. (1994, Journal of Clinical Oncology, PMID 8270972) conducted a randomized double-blind crossover trial of transdermal clonidine in tamoxifen-treated breast cancer patients — a high-need population — and demonstrated statistically significant but clinically modest reductions in hot flash frequency (~20%) and severity. Pandya et al. (2000, Annals of Internal Medicine, PMID 10819701) extended this in a larger randomized trial with oral clonidine 0.1 mg/day in postmenopausal breast cancer patients on tamoxifen, finding 37–38% reduction in hot flash frequency at weeks 4 and 8 versus 20–24% for placebo. The limitation of clonidine is its side-effect profile: dry mouth, constipation, dizziness, fatigue, and — importantly — sleep disturbance (paradoxically, given that night sweats are a major symptom). Rebound hypertension on abrupt discontinuation requires gradual tapering. Its use is now largely reserved for women who have failed or cannot tolerate SSRIs/SNRIs, given the more favorable tolerability of newer agents.',
  'Declining estrogen during menopause increases norepinephrine (NE) turnover in the locus coeruleus and hypothalamic preoptic area, raising the noradrenergic drive to thermoregulatory neurons. This NE excess narrows the thermoneutral zone: smaller temperature deviations trigger the heat-dissipation cascade (vasodilation, sweating), producing hot flashes. Clonidine, as a central α2-adrenergic agonist, stimulates presynaptic inhibitory α2 autoreceptors on NE-releasing neurons, reducing NE synthesis and release in the hypothalamus. This directly addresses the noradrenergic excess driving thermoregulatory instability in menopause — a different mechanistic entry point than serotonergic (SSRI) or neurokinin-B (fezolinetant) approaches, which is why clonidine may benefit patients non-responsive to other agents.',
  'Multiple RCTs in tamoxifen-treated breast cancer cohorts; moderate efficacy; limited by adverse effect profile — particularly sleep disruption'
);

INSERT INTO repurposing_signals (
  id, condition_id, compound_id, signal_type, evidence_strength,
  summary, mechanism_hypothesis, status
) VALUES (
  '42063fe4-b882-4990-ad51-f498092bd480',
  '9001ca55-3a20-49ed-8ec6-280271d07631',
  '1f24aa8b-daec-4be4-93d4-e1ad758859ab',
  'Multicenter randomized controlled trial',
  'strong',
  'A multicenter double-blind RCT by Freeman et al. (JAMA, 2011, PMID 21245182) — the MsFLASH 01 trial — randomized 205 healthy menopausal women to escitalopram 10–20 mg/day vs. placebo for 8 weeks. Escitalopram significantly reduced mean hot flash frequency by approximately 1.4 more episodes per day than placebo (p=0.005), and 55% of escitalopram-treated women achieved ≥50% reduction in hot flash frequency versus 36% of placebo-treated women. Benefits were consistent across race, BMI, and depression status — demonstrating that the vasomotor effect is independent of antidepressant action and does not require underlying depression. Quality of life, mood, and sleep measures also improved significantly. This trial established escitalopram as one of the better-evidenced non-hormonal options for vasomotor symptoms, and its findings contributed to the eventual FDA approval of paroxetine (Brisdelle) in 2013. Escitalopram itself remains off-label for this indication but is widely prescribed in clinical practice given the strength of the JAMA RCT evidence.',
  'Estrogen modulates serotonergic tone throughout the brain, including in hypothalamic thermoregulatory circuits. As estrogen declines during menopause, serotonin synthesis and 5-HT2A receptor sensitivity decrease in the preoptic area, reducing serotonergic inhibition of the thermoregulatory reflex. Concurrently, the KNDy neuron circuit in the arcuate nucleus — whose neurokinin B signaling directly triggers hot flashes — is under inhibitory serotonergic control; reduced serotonin amplifies NKB-driven thermoregulatory dysregulation. Escitalopram''s SERT inhibition raises synaptic serotonin throughout these circuits, partially restoring serotonergic suppression of the heat-dissipation cascade via 5-HT2A and 5-HT1A receptors. The sub-antidepressant dose efficacy (10 mg) suggests this mechanism is pharmacodynamically distinct from the full-dose neuroadaptation required for antidepressant effect.',
  'High-quality multicenter JAMA RCT — one of the best-evidenced non-hormonal options; widely used off-label'
);

-- ============================================================
-- SOURCES
-- ============================================================

-- ── Vulvodynia: Gabapentin ────────────────────────────────

INSERT INTO sources (
  id, signal_id, source_type, external_id, title, authors,
  journal, publication_date, url, key_finding_excerpt
) VALUES (
  '053f31d8-bfc9-4f0a-b11d-4f0e47a8d197',
  '7dd5569f-2fff-45bc-b284-a15b2b4b48b6',
  'pubmed', '17393770',
  'Evaluation of gabapentin in the treatment of generalized vulvodynia, unprovoked',
  'Harris G, Horowitz B, Borgida A',
  'Journal of Reproductive Medicine',
  '2007-04-01',
  'https://pubmed.ncbi.nlm.nih.gov/17393770',
  'Among 152 patients treated with gabapentin, 64% achieved at least 80% symptom resolution; only 26% reported side effects, supporting a favorable safety and efficacy profile for gabapentin in unprovoked generalized vulvodynia.'
);

INSERT INTO sources (
  id, signal_id, source_type, external_id, title, authors,
  journal, publication_date, url, key_finding_excerpt
) VALUES (
  '4ba26ebf-7a1a-4e3f-b6cb-a9008cce1275',
  '7dd5569f-2fff-45bc-b284-a15b2b4b48b6',
  'pubmed', '18757655',
  'Topical gabapentin in the treatment of localized and generalized vulvodynia',
  'Boardman LA, Cooper AS, Blais LR, Raker CA',
  'Obstetrics & Gynecology',
  '2008-09-01',
  'https://pubmed.ncbi.nlm.nih.gov/18757655',
  'Compounded topical gabapentin (2–6%) reduced mean pain VAS from 7.26 to 2.49, with approximately 80% of women achieving at least 50% pain improvement — favorable outcomes with topical delivery that may minimize the cognitive side effects limiting systemic gabapentin.'
);

INSERT INTO sources (
  id, signal_id, source_type, external_id, title, authors,
  journal, publication_date, url, key_finding_excerpt
) VALUES (
  '9ac4eaaf-b9e8-4bc1-a151-4e1045c5c30a',
  '7dd5569f-2fff-45bc-b284-a15b2b4b48b6',
  'pubmed', '29742655',
  'Gabapentin for the Treatment of Vulvodynia: A Randomized Controlled Trial',
  'Brown CS, Bachmann GA, Wan J, Foster DC; Gabapentin (GABA) Study Group',
  'Obstetrics & Gynecology',
  '2018-05-01',
  'https://pubmed.ncbi.nlm.nih.gov/29742655',
  'Extended-release gabapentin (1,200–3,000 mg/day) did not significantly outperform placebo on the tampon test pain score in localized provoked vestibulodynia (adjusted mean 4.0 vs. 4.3; P=.07) — a key negative RCT suggesting subtype specificity is essential when evaluating gabapentin for vulvodynia.'
);

-- ── Vulvodynia: Amitriptyline ─────────────────────────────

INSERT INTO sources (
  id, signal_id, source_type, external_id, title, authors,
  journal, publication_date, url, key_finding_excerpt
) VALUES (
  '1f920b2a-5109-4164-baa5-f8e2b5a91181',
  '66ab2e57-07dd-4935-a855-453d3666fc1f',
  'pubmed', '8441136',
  'Dysesthetic ("essential") vulvodynia. Treatment with amitriptyline',
  'McKay M',
  'Journal of Reproductive Medicine',
  '1993-01-01',
  'https://pubmed.ncbi.nlm.nih.gov/8441136',
  'Low-dose amitriptyline (10–60 mg/day) produced favorable responses in 20 patients with dysesthetic/essential vulvodynia, establishing a distinct neurological subtype of vulvar pain responsive to tricyclics — the foundational clinical observation for TCA use in this condition.'
);

INSERT INTO sources (
  id, signal_id, source_type, external_id, title, authors,
  journal, publication_date, url, key_finding_excerpt
) VALUES (
  'e0487607-068b-4782-b384-7691231ec74f',
  '66ab2e57-07dd-4935-a855-453d3666fc1f',
  'pubmed', '22622338',
  'Use of amitriptyline cream in the management of entry dyspareunia due to provoked vestibulodynia',
  'Pagano R, Wong S',
  'Journal of Lower Genital Tract Disease',
  '2012-07-01',
  'https://pubmed.ncbi.nlm.nih.gov/22622338',
  'Topical amitriptyline 2% cream produced meaningful improvement in 56% of 150 women with provoked vestibulodynia, with response distributed as slight (25), moderate (44), and excellent (15) — supporting topical delivery as a strategy to deliver local sodium channel blockade without systemic side effects.'
);

-- ── Vulvodynia: Capsaicin ─────────────────────────────────

INSERT INTO sources (
  id, signal_id, source_type, external_id, title, authors,
  journal, publication_date, url, key_finding_excerpt
) VALUES (
  '308e10a3-355b-4b59-8f68-e147d8f1c5ef',
  'ad9507d1-e323-43d7-a78f-1649b809441e',
  'pubmed', '15902156',
  'Capsaicin for the treatment of vulvar vestibulitis',
  'Steinberg AC, Oyama IA, Rejba AE, Kellogg-Spadt S, Whitmore KE',
  'American Journal of Obstetrics and Gynecology',
  '2005-05-01',
  'https://pubmed.ncbi.nlm.nih.gov/15902156',
  'Topical capsaicin 0.025% applied daily for 12 weeks significantly reduced vestibulitis discomfort; Kaufman touch test scores fell from 13.2 to 4.8 (p<.001), and the Marinoff dyspareunia scale improved significantly, enabling more frequent sexual activity.'
);

INSERT INTO sources (
  id, signal_id, source_type, external_id, title, authors,
  journal, publication_date, url, key_finding_excerpt
) VALUES (
  'e17b936a-e5e0-4120-a931-6d2f673f0f32',
  'ad9507d1-e323-43d7-a78f-1649b809441e',
  'pubmed', '15775875',
  'Capsaicin and the treatment of vulvar vestibulitis syndrome: a valuable alternative?',
  'Murina F, Radici G, Bianco V',
  'MedGenMed',
  '2004-10-01',
  'https://pubmed.ncbi.nlm.nih.gov/15775875',
  '59% of 33 women treated with topical capsaicin 0.05% showed symptom improvement, but all patients relapsed after stopping and severe application-site burning was the main limitation — establishing capsaicin''s mechanistic proof-of-concept while highlighting the need for dose and formulation optimization.'
);

-- ── Vulvodynia: Botulinum Toxin ───────────────────────────

INSERT INTO sources (
  id, signal_id, source_type, external_id, title, authors,
  journal, publication_date, url, key_finding_excerpt
) VALUES (
  '99dc35c4-ac72-423c-86e2-31a11593c8ae',
  '6840fa08-f549-4dae-90f5-e46af19c3596',
  'pubmed', '15516379',
  'Botulinum toxin in the treatment of refractory vaginismus',
  'Ghazizadeh S, Nikzad M',
  'Obstetrics & Gynecology',
  '2004-11-01',
  'https://pubmed.ncbi.nlm.nih.gov/15516379',
  'In 24 women with severe refractory vaginismus, botulinum toxin injections led to ~96% showing minimal vaginismus at one week and 75% achieving satisfactory intercourse; no recurrence was observed at a mean 12.3-month follow-up — establishing proof-of-concept for neurotoxin in pelvic floor hypertonicity.'
);

INSERT INTO sources (
  id, signal_id, source_type, external_id, title, authors,
  journal, publication_date, url, key_finding_excerpt
) VALUES (
  'cb8dd882-2256-4d22-9ca3-107132d1d620',
  '6840fa08-f549-4dae-90f5-e46af19c3596',
  'pubmed', '32769643',
  'Botulinum Toxin A as a Treatment for Provoked Vestibulodynia: A Randomized Controlled Trial',
  'Haraldson P, Mühlrad H, Heddini U, Nilsson K, Bohm-Starke N',
  'Obstetrics & Gynecology',
  '2020-09-01',
  'https://pubmed.ncbi.nlm.nih.gov/32769643',
  'In 88 women (44/arm), botulinum toxin A did not significantly reduce primary dyspareunia endpoint but produced a significant 11-unit pain decrease on weekly tampon insertion and meaningfully reduced pelvic floor muscle tension — suggesting target specificity for hypertonicity-driven rather than purely vestibular nociceptive pain.'
);

-- ── Menopause: Oxybutynin ─────────────────────────────────

INSERT INTO sources (
  id, signal_id, source_type, external_id, title, authors,
  journal, publication_date, url, key_finding_excerpt
) VALUES (
  'd635dfa9-22a5-4eb7-bccf-f805abda0bed',
  '36d49d16-c66c-4a8e-8a08-688f9dd59883',
  'pubmed', '32337497',
  'Oxybutynin vs Placebo for Hot Flashes in Women With or Without Breast Cancer: A Randomized, Double-Blind Clinical Trial (ACCRU SC-1603)',
  'Leon-Ferre RA, Novotny PJ, Wolfe EG, Faubion SS, Ruddy KJ, Flora D, Dakhil CSR, Rowland KM, Graham ML, Le-Lindqwister N, Smith TJ, Loprinzi CL',
  'JNCI Cancer Spectrum',
  '2020-02-01',
  'https://pubmed.ncbi.nlm.nih.gov/32337497',
  'Oxybutynin 5 mg twice daily produced a 16.9-point weekly hot flash score reduction vs. 5.7 points for placebo (p<0.001) in 150 women with and without breast cancer; well tolerated with mainly mild dry mouth, establishing a novel anticholinergic mechanism for vasomotor symptom management.'
);

-- ── Menopause: Gabapentin ─────────────────────────────────

INSERT INTO sources (
  id, signal_id, source_type, external_id, title, authors,
  journal, publication_date, url, key_finding_excerpt
) VALUES (
  '15382831-0a4a-4de4-900a-b4e6335abdb3',
  '660fe36b-ec41-4f10-9e7d-e2829c547445',
  'pubmed', '12576259',
  'Gabapentin''s effects on hot flashes in postmenopausal women: a randomized controlled trial',
  'Guttuso T Jr, Kurlan R, McDermott MP, Kieburtz K',
  'Obstetrics & Gynecology',
  '2003-02-01',
  'https://pubmed.ncbi.nlm.nih.gov/12576259',
  'Gabapentin 900 mg/day produced a 45% reduction in hot flash frequency and 54% composite score reduction vs. 29%/31% for placebo (both p<0.05) in 59 postmenopausal women; open-label extension to 2,700 mg/day demonstrated further improvement of 54% frequency reduction and 67% composite reduction.'
);

-- ── Menopause: Clonidine ──────────────────────────────────

INSERT INTO sources (
  id, signal_id, source_type, external_id, title, authors,
  journal, publication_date, url, key_finding_excerpt
) VALUES (
  '52ccb7dd-cd5f-4830-a889-4c98b43625ed',
  'f624d1a7-aae1-44c7-b3db-dbd2f8ac01ed',
  'pubmed', '8270972',
  'Transdermal clonidine for ameliorating tamoxifen-induced hot flashes',
  'Goldberg RM, Loprinzi CL, O''Fallon JR, Veeder MH, Miser AW, Mailliard JA, Michalak JC, Dose AM, Rowland KM Jr, Burnham NL',
  'Journal of Clinical Oncology',
  '1994-01-01',
  'https://pubmed.ncbi.nlm.nih.gov/8270972',
  'Randomized double-blind crossover trial: transdermal clonidine produced statistically significant but clinically modest ~20% reductions in hot flash frequency and ~10% reductions in severity vs. placebo in tamoxifen-treated breast cancer patients — establishing proof of concept for central noradrenergic suppression as a vasomotor mechanism.'
);

INSERT INTO sources (
  id, signal_id, source_type, external_id, title, authors,
  journal, publication_date, url, key_finding_excerpt
) VALUES (
  'b0354652-baf3-49a6-87f0-1a4cc8986002',
  'f624d1a7-aae1-44c7-b3db-dbd2f8ac01ed',
  'pubmed', '10819701',
  'Oral clonidine in postmenopausal patients with breast cancer experiencing tamoxifen-induced hot flashes',
  'Pandya KJ, Raubertas RF, Flynn PJ, Hynes HE, Rosenbluth RJ, Kirshner JJ, Pierce HI, Dragalin V, Morrow GR',
  'Annals of Internal Medicine',
  '2000-05-16',
  'https://pubmed.ncbi.nlm.nih.gov/10819701',
  'Oral clonidine 0.1 mg/day reduced hot flash frequency by 37–38% vs. 20–24% for placebo at weeks 4 and 8 (statistically significant), but increased sleep disturbances (41% vs. 21%), highlighting the tolerability trade-off that limits clonidine''s clinical utility despite confirmed efficacy.'
);

-- ── Menopause: Escitalopram ───────────────────────────────

INSERT INTO sources (
  id, signal_id, source_type, external_id, title, authors,
  journal, publication_date, url, key_finding_excerpt
) VALUES (
  '745d9580-8549-42c4-a16a-777a877142b4',
  '42063fe4-b882-4990-ad51-f498092bd480',
  'pubmed', '21245182',
  'Efficacy of escitalopram for hot flashes in healthy menopausal women: a randomized controlled trial',
  'Freeman EW, Guthrie KA, Caan B, Sternfeld B, Cohen LS, Joffe H, Carpenter JS, Anderson GL, Larson JC, Ensrud KE, Reed SD, Newton KM, Sherman S, Sammel MD, LaCroix AZ',
  'JAMA',
  '2011-01-19',
  'https://pubmed.ncbi.nlm.nih.gov/21245182',
  'Escitalopram 10–20 mg/day reduced hot flash frequency by ~1.4 more episodes/day than placebo (p=0.005) in 205 menopausal women in the MsFLASH 01 trial; 55% vs. 36% achieved ≥50% reduction — benefits consistent across race, BMI, and depression status, confirming a vasomotor mechanism independent of antidepressant action.'
);
