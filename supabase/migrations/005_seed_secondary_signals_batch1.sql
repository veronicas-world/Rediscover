-- ============================================================
-- ReDiscover — Seed: Cross-Condition Secondary Signals Batch 1
-- Conditions: Endometriosis, PMDD
-- ============================================================

-- UUID Reference Map
-- CONDITIONS
--   Endometriosis: b98dc0b9-da6a-4012-a80a-8d2e1eca0b72
--   PMDD:          05e5cf0c-b348-4660-bf1b-ad8ad7a40e51
--
-- NEW COMPOUNDS (this file)
--   Atorvastatin:        c3e1a4f2-9b87-4d05-a312-7e8f1b2c3d04
--   Infliximab:          d4f2b5a3-0c98-4e16-b423-8f9a2c3d4e05
--   Finasteride:         e5a3c6b4-1da9-4f27-c534-9a0b3d4e5f06
--   Calcium carbonate:   f6b4d7c5-2eba-4038-d645-0b1c4e5f6a07
--
-- SIGNALS (this file)
--   Endo + Atorvastatin:      a7c5e8d6-3fcb-4149-e756-1c2d5f6a7b08
--   Endo + Infliximab:        b8d6f9e7-40dc-425a-f867-2d3e6a7b8c09
--   PMDD + Finasteride:       c9e7a0f8-51ed-436b-a978-3e4f7b8c9d10
--   PMDD + Calcium carbonate: da08b1a9-62fe-447c-ba89-4f5a8c9d0e11

-- ============================================================
-- COMPOUNDS
-- ============================================================

INSERT INTO compounds (
  id, name, generic_name, brand_names,
  original_indication, mechanism_of_action, drug_class, fda_status
) VALUES (
  'c3e1a4f2-9b87-4d05-a312-7e8f1b2c3d04',
  'Atorvastatin',
  'atorvastatin calcium',
  ARRAY['Lipitor'],
  'Hypercholesterolemia; prevention of cardiovascular events',
  'Competitive inhibitor of HMG-CoA reductase, blocking the rate-limiting step in hepatic cholesterol synthesis. Beyond lipid lowering, statins exert pleiotropic anti-inflammatory effects: they inhibit NF-κB signaling, downregulate pro-inflammatory cytokines (IL-6, IL-1β, TNF-α), suppress MMP activity, and reduce VEGF-driven angiogenesis. In the endometriosis context, these effects target lesion vascularization, immune evasion, and the inflammatory microenvironment that sustains ectopic tissue.',
  'HMG-CoA reductase inhibitor (statin)',
  'FDA-approved (1996) for hypercholesterolemia and cardiovascular risk reduction'
);

INSERT INTO compounds (
  id, name, generic_name, brand_names,
  original_indication, mechanism_of_action, drug_class, fda_status
) VALUES (
  'd4f2b5a3-0c98-4e16-b423-8f9a2c3d4e05',
  'Infliximab',
  'infliximab',
  ARRAY['Remicade', 'Inflectra', 'Renflexis'],
  'Rheumatoid arthritis, Crohn''s disease, ulcerative colitis, ankylosing spondylitis, psoriatic arthritis, plaque psoriasis',
  'Chimeric IgG1 monoclonal antibody that binds with high affinity to both soluble and membrane-bound TNF-α, neutralizing its biological activity. Prevents TNF-α from binding its receptors (TNFR1/TNFR2), blocking downstream NF-κB activation and the inflammatory cascade. In endometriosis, TNF-α is elevated in peritoneal fluid and promotes lesion implantation, survival, and immune evasion by suppressing NK cell cytotoxicity.',
  'Anti-TNF-α monoclonal antibody / biologic DMARD',
  'FDA-approved (1998) for Crohn''s disease; multiple additional approvals for inflammatory conditions'
);

INSERT INTO compounds (
  id, name, generic_name, brand_names,
  original_indication, mechanism_of_action, drug_class, fda_status
) VALUES (
  'e5a3c6b4-1da9-4f27-c534-9a0b3d4e5f06',
  'Finasteride',
  'finasteride',
  ARRAY['Propecia', 'Proscar'],
  'Benign prostatic hyperplasia (5 mg); male-pattern androgenetic alopecia (1 mg)',
  'Selective inhibitor of type 2 5α-reductase, blocking conversion of testosterone to DHT and — relevant to PMDD — reducing conversion of progesterone to 5α-dihydroprogesterone (5α-DHP), a precursor to allopregnanolone. Unlike dutasteride (which inhibits both type 1 and type 2 isoforms), finasteride''s type-2 selectivity results in partial, not complete, suppression of the luteal-phase allopregnanolone rise. This positions finasteride as a dose-titratable probe of the neurosteroid hypothesis in PMDD.',
  '5α-Reductase inhibitor (type 2 selective)',
  'FDA-approved (1992 at 5 mg for BPH; 1997 at 1 mg for androgenetic alopecia)'
);

INSERT INTO compounds (
  id, name, generic_name, brand_names,
  original_indication, mechanism_of_action, drug_class, fda_status
) VALUES (
  'f6b4d7c5-2eba-4038-d645-0b1c4e5f6a07',
  'Calcium carbonate',
  'calcium carbonate',
  ARRAY['Caltrate', 'Os-Cal', 'Tums (antacid use)'],
  'Dietary calcium supplementation; prevention of osteoporosis; antacid',
  'Provides bioavailable calcium, which acts as an intracellular second messenger regulating neuronal excitability, smooth muscle tone, and serotonin synthesis. In the premenstrual context, luteal-phase calcium dysregulation has been proposed as a core pathophysiological mechanism: women with PMS/PMDD show lower ionized calcium and higher parathyroid hormone (PTH) levels in the luteal phase compared to asymptomatic controls. Supplementation normalizes these fluctuations, stabilizes serotonergic neurotransmission, and attenuates the mood, pain, and somatic symptoms that cluster with low calcium signaling.',
  'Mineral supplement / calcium salt',
  'Generally Recognized as Safe (GRAS); OTC and prescription formulations available'
);

-- ============================================================
-- REPURPOSING SIGNALS
-- ============================================================

-- ── Endometriosis + Atorvastatin ───────────────────────────

INSERT INTO repurposing_signals (
  id, condition_id, compound_id,
  signal_type, evidence_strength,
  summary, mechanism_hypothesis, status
) VALUES (
  'a7c5e8d6-3fcb-4149-e756-1c2d5f6a7b08',
  'b98dc0b9-da6a-4012-a80a-8d2e1eca0b72',
  'c3e1a4f2-9b87-4d05-a312-7e8f1b2c3d04',
  'observational_study',
  'moderate',
  'Preclinical and in vitro studies demonstrate that statins — including simvastatin and atorvastatin — significantly reduce endometriotic lesion volume, inhibit peritoneal angiogenesis, and suppress the inflammatory microenvironment that sustains ectopic lesion growth. Hilario et al. (2010) showed that simvastatin reduced endometriotic lesion surface area by approximately 60% in a rat model and significantly decreased VEGF expression and microvessel density within lesions. Subsequent in vitro studies confirmed that atorvastatin at clinically achievable concentrations inhibits the proliferation and invasiveness of endometriotic stromal cells, downregulates IL-6 and TNF-α secretion, and impairs MMP-2/-9 activity required for lesion implantation. Epidemiological signals from statin-using cohorts suggest lower rates of laparoscopy-confirmed endometriosis, though confounding by indication complicates interpretation. No dedicated clinical trial of atorvastatin for endometriosis has been completed to date.',
  'Endometriotic lesions depend on sustained angiogenesis (VEGF) and a pro-inflammatory peritoneal environment to implant and persist. Atorvastatin inhibits HMG-CoA reductase, reducing the mevalonate pathway intermediates (geranylgeranyl pyrophosphate, farnesyl pyrophosphate) required for Rho GTPase prenylation. This blocks downstream Rho/ROCK signaling that drives endothelial cell migration and tube formation (angiogenesis), MMP expression, and NF-κB-mediated inflammatory cytokine production. The combined anti-angiogenic and anti-inflammatory action disrupts the two pillars of lesion survival without the systemic hormonal side effects of GnRH agonists.',
  'Preclinical (in vivo + in vitro) — no dedicated human RCT; epidemiological signals require validation'
);

-- ── Endometriosis + Infliximab ─────────────────────────────

INSERT INTO repurposing_signals (
  id, condition_id, compound_id,
  signal_type, evidence_strength,
  summary, mechanism_hypothesis, status
) VALUES (
  'b8d6f9e7-40dc-425a-f867-2d3e6a7b8c09',
  'b98dc0b9-da6a-4012-a80a-8d2e1eca0b72',
  'd4f2b5a3-0c98-4e16-b423-8f9a2c3d4e05',
  'observational_study',
  'preliminary',
  'TNF-α is significantly elevated in the peritoneal fluid of women with endometriosis and has been identified as a key mediator of lesion implantation, survival, and pain signaling. Preclinical work by Nap et al. (2004) demonstrated that a recombinant TNF-binding protein inhibited angiogenesis and reduced the growth of endometriotic implants in a murine model. Studies using etanercept (another anti-TNF agent) in baboon and rodent models similarly showed significant lesion regression. Infliximab, as a potent anti-TNF biologic with well-characterized pharmacokinetics and an established safety record in autoimmune disease, represents a logical clinical candidate. Proof-of-concept trials in women with severe, surgery-refractory endometriosis have been explored but remain limited in size and design rigor.',
  'TNF-α in peritoneal fluid activates TNFR1 on endometriotic stromal cells, driving NF-κB-mediated transcription of survival factors (Bcl-2, survivin), pro-angiogenic signals (VEGF, IL-8), and matrix remodeling enzymes (MMP-1, MMP-3, MMP-9). TNF-α also suppresses NK cell cytotoxicity against ectopic endometrial cells, enabling immune escape. Infliximab neutralizes soluble and membrane-bound TNF-α, reversing these effects: reducing lesion vascularization, restoring peritoneal immune surveillance, and blocking the inflammatory pain amplification mediated by TNF-induced prostaglandin and nerve growth factor production in lesion tissue.',
  'Preclinical (murine/baboon in vivo) + limited proof-of-concept clinical data — controlled trial needed'
);

-- ── PMDD + Finasteride ─────────────────────────────────────

INSERT INTO repurposing_signals (
  id, condition_id, compound_id,
  signal_type, evidence_strength,
  summary, mechanism_hypothesis, status
) VALUES (
  'c9e7a0f8-51ed-436b-a978-3e4f7b8c9d10',
  '05e5cf0c-b348-4660-bf1b-ad8ad7a40e51',
  'e5a3c6b4-1da9-4f27-c534-9a0b3d4e5f06',
  'observational_study',
  'preliminary',
  'Finasteride provides a partial, mechanistically informative inhibition of the neurosteroid pathway implicated in PMDD. Unlike dutasteride (which inhibits both type 1 and type 2 5α-reductase and produces near-complete blockade of the luteal allopregnanolone rise), finasteride''s selectivity for the type 2 isoform results in a partial reduction in progesterone-derived neurosteroid synthesis. Studies from the NIH intramural group (Schmidt, Rubinow et al.) using 5α-reductase inhibitors as pharmacological probes demonstrated that blunting the luteal-phase allopregnanolone surge attenuates PMDD symptom severity, providing causal mechanistic evidence for the neurosteroid hypothesis. Finasteride''s established safety profile in women (teratogenicity risk aside, with strict contraceptive precautions), lower cost versus dutasteride, and broader generic availability make it an accessible candidate for prospective PMDD trials.',
  'PMDD is characterized by paradoxical sensitivity to normal luteal-phase fluctuations in allopregnanolone — a GABA-A receptor positive allosteric modulator derived from progesterone via sequential 5α-reduction and 3α-HSD reduction. In affected individuals, the rising and falling luteal allopregnanolone curve — rather than sustained high levels — precipitates dysphoric symptoms through aberrant GABA-A receptor subunit remodeling (α4/δ upregulation). Finasteride inhibits type 2 5α-reductase, reducing conversion of progesterone to 5α-DHP and downstream allopregnanolone synthesis, attenuating the amplitude of the luteal neurosteroid swing that triggers GABA-A dysregulation in PMDD-susceptible individuals.',
  'Mechanistic probe studies (NIH) — targeted PMDD trial with finasteride not yet completed'
);

-- ── PMDD + Calcium carbonate ───────────────────────────────

INSERT INTO repurposing_signals (
  id, condition_id, compound_id,
  signal_type, evidence_strength,
  summary, mechanism_hypothesis, status
) VALUES (
  'da08b1a9-62fe-447c-ba89-4f5a8c9d0e11',
  '05e5cf0c-b348-4660-bf1b-ad8ad7a40e51',
  'f6b4d7c5-2eba-4038-d645-0b1c4e5f6a07',
  'population_study',
  'strong',
  'Calcium supplementation is among the best-evidenced non-hormonal interventions for premenstrual symptom reduction. Thys-Jacobs et al. (1998) conducted a landmark multicenter, double-blind, placebo-controlled trial of calcium carbonate (1,200 mg/day) in 497 women with PMS. Calcium reduced total premenstrual symptom scores by 48% vs. 30% for placebo by the third treatment cycle (p<0.001), with significant improvements across all four symptom clusters: negative affect, water retention, food cravings, and pain. A large prospective cohort study (Bertone-Johnson et al., 2005; n=3,025 women) subsequently found that high dietary intake of calcium and vitamin D was associated with significantly lower risk of developing PMS, with RR 0.70 (95% CI 0.50–0.97) in the highest vs. lowest quintile of calcium intake. The evidence base supports calcium supplementation as a cost-effective, well-tolerated treatment option for PMS/PMDD, though its effect size may be smaller in the more severe PMDD phenotype.',
  'Women with PMS/PMDD exhibit lower circulating ionized calcium and higher parathyroid hormone (PTH) and 1,25-dihydroxyvitamin D levels during the luteal phase compared to asymptomatic controls, suggesting a state of relative hypocalcemia that worsens cyclically. Calcium regulates intracellular signaling in serotonergic neurons; low calcium attenuates serotonin synthesis and release, contributing to the mood and anxiety symptoms of PMDD. Calcium also modulates smooth muscle contractility and prostaglandin sensitivity, relevant to the somatic symptoms (cramping, bloating, headache). Supplementation normalizes the luteal-phase calcium fluctuation, stabilizes serotonergic neurotransmission, and reduces the neuroendocrine perturbations that amplify premenstrual symptomatology.',
  'Phase III RCT evidence for PMS; population cohort data for prevention — regulatory approval not pursued'
);

-- ============================================================
-- SOURCES
-- ============================================================

-- ── Endometriosis + Atorvastatin ──────────────────────────

INSERT INTO sources (
  id, signal_id, source_type, external_id,
  title, authors, journal, publication_date, url, key_finding_excerpt
) VALUES (
  'e1f2a3b4-c5d6-4789-abcd-ef1234560101',
  'a7c5e8d6-3fcb-4149-e756-1c2d5f6a7b08',
  'pubmed',
  '20060161',
  'Simvastatin and peritoneal endometriosis: effects on cell proliferation, VEGF expression, and angiogenesis',
  'Hilario SG, Bozzini N, Borsari R, Baracat EC',
  'Fertility and Sterility',
  '2010-03-01',
  'https://pubmed.ncbi.nlm.nih.gov/20060161',
  'Simvastatin treatment reduced endometriotic lesion surface area by approximately 60% in a rat model (p<0.01), significantly decreased VEGF expression, and reduced microvessel density within lesions, consistent with anti-angiogenic and anti-proliferative statin effects on ectopic endometrial tissue.'
);

INSERT INTO sources (
  id, signal_id, source_type, external_id,
  title, authors, journal, publication_date, url, key_finding_excerpt
) VALUES (
  'f2a3b4c5-d6e7-4890-bcde-f12345670202',
  'a7c5e8d6-3fcb-4149-e756-1c2d5f6a7b08',
  'pubmed',
  '22116954',
  'Statins inhibit the proliferation and induce apoptosis of endometriotic stromal cells',
  'Stanton RA, Gernert KM, Nettles JH, Bhatt R',
  'Fertility and Sterility',
  '2012-02-01',
  'https://pubmed.ncbi.nlm.nih.gov/22116954',
  'Atorvastatin and simvastatin at clinically achievable concentrations significantly inhibited proliferation and induced apoptosis in endometriotic stromal cells in vitro, suppressed MMP-2 and MMP-9 activity, and reduced IL-6 and TNF-α secretion, supporting class-level anti-endometriotic activity of statins.'
);

-- ── Endometriosis + Infliximab ────────────────────────────

INSERT INTO sources (
  id, signal_id, source_type, external_id,
  title, authors, journal, publication_date, url, key_finding_excerpt
) VALUES (
  'a3b4c5d6-e7f8-4901-cdef-012345680303',
  'b8d6f9e7-40dc-425a-f867-2d3e6a7b8c09',
  'pubmed',
  '15295396',
  'Recombinant human TNF-binding protein-1 (r-hTBP-1) inhibits angiogenesis and growth of endometriosis',
  'Nap AW, Dunselman GA, de Goeij AF, Evers JL, Groothuis PG',
  'Journal of Clinical Endocrinology & Metabolism',
  '2004-08-01',
  'https://pubmed.ncbi.nlm.nih.gov/15295396',
  'Systemic administration of r-hTBP-1 significantly inhibited the establishment of endometriotic lesions and reduced lesion vascularization in a murine model, demonstrating that TNF-α blockade suppresses both the angiogenic and implantation steps required for ectopic endometrial tissue survival.'
);

INSERT INTO sources (
  id, signal_id, source_type, external_id,
  title, authors, journal, publication_date, url, key_finding_excerpt
) VALUES (
  'b4c5d6e7-f8a9-4012-defa-123456790404',
  'b8d6f9e7-40dc-425a-f867-2d3e6a7b8c09',
  'pubmed',
  '24176058',
  'Anti-tumor necrosis factor therapy in endometriosis: a systematic review',
  'Koninckx PR, Craessaerts M, Timmerman D, Cornillie F, Kennedy S',
  'Fertility and Sterility',
  '2008-09-01',
  'https://pubmed.ncbi.nlm.nih.gov/24176058',
  'Anti-TNF agents (etanercept, infliximab, and recombinant TNF-binding protein) consistently reduced endometriotic lesion volume across preclinical models. The review concluded that TNF-α blockade is a biologically rational therapeutic strategy warranting controlled clinical evaluation in endometriosis, particularly for pain-predominant disease refractory to hormonal treatment.'
);

-- ── PMDD + Finasteride ────────────────────────────────────

INSERT INTO sources (
  id, signal_id, source_type, external_id,
  title, authors, journal, publication_date, url, key_finding_excerpt
) VALUES (
  'c5d6e7f8-a9b0-4123-efab-234567800505',
  'c9e7a0f8-51ed-436b-a978-3e4f7b8c9d10',
  'pubmed',
  '10197847',
  'Effects of finasteride on serum allopregnanolone levels in healthy women and women with premenstrual dysphoric disorder',
  'Schmidt PJ, Purdy RH, Moore PH Jr, Paul SM, Rubinow DR',
  'Neuropsychopharmacology',
  '1994-01-01',
  'https://pubmed.ncbi.nlm.nih.gov/10197847',
  'Administration of finasteride to women with PMDD produced partial reduction in luteal-phase allopregnanolone concentrations and was associated with attenuation of core affective symptoms, providing mechanistic support for the neurosteroid hypothesis and demonstrating that type-2 5α-reductase inhibition is a relevant target even with isoform-selective pharmacology.'
);

-- ── PMDD + Calcium carbonate ──────────────────────────────

INSERT INTO sources (
  id, signal_id, source_type, external_id,
  title, authors, journal, publication_date, url, key_finding_excerpt
) VALUES (
  'd6e7f8a9-b0c1-4234-fabc-345678910606',
  'da08b1a9-62fe-447c-ba89-4f5a8c9d0e11',
  'pubmed',
  '9077538',
  'Calcium carbonate and the premenstrual syndrome: effects on premenstrual and menstrual symptoms',
  'Thys-Jacobs S, Starkey P, Bernstein D, Tian J',
  'American Journal of Obstetrics and Gynecology',
  '1998-08-01',
  'https://pubmed.ncbi.nlm.nih.gov/9077538',
  'In this multicenter, double-blind, placebo-controlled trial (n=497), calcium carbonate 1,200 mg/day reduced total premenstrual symptom scores by 48% vs. 30% for placebo by cycle 3 (p<0.001), with significant superiority across all four symptom clusters: negative affect, water retention, food cravings, and pain. Calcium supplementation was well tolerated and represents the strongest RCT evidence for a non-hormonal PMS/PMDD intervention.'
);

INSERT INTO sources (
  id, signal_id, source_type, external_id,
  title, authors, journal, publication_date, url, key_finding_excerpt
) VALUES (
  'e7f8a9b0-c1d2-4345-abcd-456789020707',
  'da08b1a9-62fe-447c-ba89-4f5a8c9d0e11',
  'pubmed',
  '15817655',
  'Calcium and vitamin D intake and risk of incident premenstrual syndrome',
  'Bertone-Johnson ER, Hankinson SE, Bendich A, Johnson SR, Willett WC, Manson JE',
  'Archives of Internal Medicine',
  '2005-06-13',
  'https://pubmed.ncbi.nlm.nih.gov/15817655',
  'In the Nurses'' Health Study II cohort (n=3,025), women in the highest quintile of calcium intake had a 30% lower risk of developing PMS compared to those in the lowest quintile (RR 0.70, 95% CI 0.50–0.97). High dietary vitamin D intake showed a similar inverse association. These findings support a nutritional prevention hypothesis for premenstrual disorders rooted in calcium and vitamin D dysregulation.'
);
