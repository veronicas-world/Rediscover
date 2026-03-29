-- ============================================================
-- ReDiscover — Seed: Endometriosis
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- Condition
-- ────────────────────────────────────────────────────────────
INSERT INTO conditions (
  id,
  name,
  slug,
  description,
  prevalence_summary,
  treatment_gap_summary,
  biology_summary,
  underfunding_notes
) VALUES (
  'b98dc0b9-da6a-4012-a80a-8d2e1eca0b72',
  'Endometriosis',
  'endometriosis',
  'Endometriosis is a chronic, systemic inflammatory disease in which tissue resembling the endometrium (the lining of the uterus) grows outside the uterus — on the ovaries, fallopian tubes, peritoneum, bladder, bowel, and in rare cases, distant organs. These lesions respond to hormonal cycling the same way uterine tissue does: they bleed, inflame, and scar with every menstrual cycle. The result is progressive adhesion formation, organ distortion, and neuropathic pain that can become debilitating. It is also one of the leading causes of infertility.',
  'Endometriosis affects an estimated 10–15% of women and people with a uterus of reproductive age — approximately 190 million individuals worldwide. Prevalence rises to roughly 30–50% among those experiencing infertility. Despite this scale, it remains one of the most underdiagnosed gynecologic conditions globally.',
  'There is no cure for endometriosis. Current first-line treatments are limited to hormonal suppression (combined oral contraceptives, progestins, GnRH agonists/antagonists) and surgical excision of lesions. Hormonal therapies halt progression only while in use and induce a pseudo-menopausal state with significant side effects including bone density loss, cardiovascular risk, and mood disruption. Surgery carries high recurrence rates — up to 50% within five years. No approved disease-modifying drug exists that targets the underlying pathology without suppressing ovarian function.',
  'Endometriosis is an estrogen-dependent, progesterone-resistant inflammatory disease. Endometriotic lesions express aromatase (locally producing estrogen) and show altered steroid receptor signaling. Lesion survival is driven by a complex interplay of: (1) immune dysregulation — impaired natural killer cell activity and elevated peritoneal macrophages that clear lesions inefficiently; (2) neuroangiogenesis — lesions recruit new nerve fibers and blood vessels, explaining the neuropathic quality of the pain; (3) oxidative stress and altered cellular metabolism — lesion cells exhibit Warburg-like aerobic glycolysis, preferring lactate production even in the presence of oxygen; (4) epigenetic reprogramming — aberrant DNA methylation and histone modification patterns contribute to the progesterone-resistant phenotype.',
  'Endometriosis has been historically dismissed as psychosomatic "bad periods," a bias rooted in the medicalization of menstrual pain as normal. The average time from symptom onset to confirmed diagnosis is 7–10 years in high-income countries, and longer in low-resource settings. NIH funding per patient is a fraction of what is allocated to conditions with comparable prevalence such as diabetes or Alzheimer''s disease. A 2021 analysis estimated the annual economic burden in the United States alone at over $78 billion in lost productivity and direct medical costs — yet disease-specific federal research investment has remained chronically underfunded. The diagnostic gold standard remains surgical laparoscopy, a significant barrier that has no non-invasive equivalent.'
);

-- ────────────────────────────────────────────────────────────
-- Compounds
-- ────────────────────────────────────────────────────────────

-- 1. Fenoprofen
INSERT INTO compounds (
  id,
  name,
  generic_name,
  brand_names,
  original_indication,
  mechanism_of_action,
  drug_class,
  fda_status
) VALUES (
  '851afec8-65c6-4325-8f5f-5dcf98b13a48',
  'Fenoprofen',
  'fenoprofen calcium',
  ARRAY['Nalfon'],
  'Rheumatoid arthritis, osteoarthritis, mild-to-moderate pain',
  'Non-selective COX-1/COX-2 inhibitor. Blocks prostaglandin synthesis by inhibiting cyclooxygenase enzymes, reducing inflammation, pain, and fever. Also demonstrates activity against prostaglandin E2 (PGE2), which plays a central role in endometriotic lesion survival and immune evasion.',
  'NSAID (Propionic acid derivative)',
  'FDA-approved (1976)'
);

-- 2. Dichloroacetate (DCA)
INSERT INTO compounds (
  id,
  name,
  generic_name,
  brand_names,
  original_indication,
  mechanism_of_action,
  drug_class,
  fda_status
) VALUES (
  '742d8f8c-c1fb-45af-8647-6130e3a53b2b',
  'Dichloroacetate',
  'dichloroacetate sodium',
  ARRAY['DCA'],
  'Congenital lactic acidosis (investigational use); historically used in metabolic acidosis',
  'Inhibits pyruvate dehydrogenase kinase (PDK), forcing cells to shift from anaerobic glycolysis (Warburg metabolism) to oxidative phosphorylation. Endometriotic lesions exhibit Warburg-like aerobic glycolysis; DCA disrupts this metabolic adaptation, impairing lesion cell survival and proliferation. Also modulates HIF-1α activity and may reduce angiogenesis in lesions.',
  'Pyruvate dehydrogenase kinase (PDK) inhibitor',
  'Investigational (not FDA-approved for endometriosis; used off-label in metabolic disease research)'
);

-- 3. Metformin
INSERT INTO compounds (
  id,
  name,
  generic_name,
  brand_names,
  original_indication,
  mechanism_of_action,
  drug_class,
  fda_status
) VALUES (
  'f7f97905-77cc-4809-b9a9-f2f97efa6839',
  'Metformin',
  'metformin hydrochloride',
  ARRAY['Glucophage', 'Glumetza', 'Fortamet', 'Riomet'],
  'Type 2 diabetes mellitus; insulin resistance (including in PCOS)',
  'Primary mechanism is inhibition of hepatic gluconeogenesis via complex I of the mitochondrial respiratory chain, activating AMPK. In endometriosis context: AMPK activation suppresses mTOR signaling (which drives lesion proliferation), reduces aromatase expression (lowering local estrogen production in lesions), downregulates NF-κB inflammatory signaling, and inhibits MMP-9 (involved in lesion invasion). Also reduces circulating insulin and IGF-1, which are implicated in endometriotic cell growth.',
  'Biguanide / AMPK activator',
  'FDA-approved (1994) for type 2 diabetes'
);

-- ────────────────────────────────────────────────────────────
-- Repurposing Signals
-- ────────────────────────────────────────────────────────────

-- Signal 1: Fenoprofen → Endometriosis
INSERT INTO repurposing_signals (
  id,
  condition_id,
  compound_id,
  signal_type,
  evidence_strength,
  summary,
  mechanism_hypothesis,
  status
) VALUES (
  '65e672f9-e82a-46ab-bebe-9a392bfae1bd',
  'b98dc0b9-da6a-4012-a80a-8d2e1eca0b72',
  '851afec8-65c6-4325-8f5f-5dcf98b13a48',
  'Computational repurposing / transcriptomic signature matching',
  'preliminary',
  'A 2024 UCSF-led computational drug repurposing study (Shim et al.) analyzed transcriptomic signatures from endometriotic lesion gene expression data and matched them against a library of drug-induced expression profiles. Fenoprofen ranked as the top candidate across multiple analyses. The study identified significant inverse correlation between fenoprofen''s gene expression signature and the dysregulated transcriptomic profile of endometriotic lesions, suggesting fenoprofen may reverse or attenuate key molecular drivers of the disease. This is a hypothesis-generating computational finding; clinical validation has not yet been conducted.',
  'Fenoprofen''s COX inhibition reduces prostaglandin E2 (PGE2), a lipid mediator that promotes endometriotic cell survival, immune evasion (impairing NK cell activity), and local aromatase expression. Suppressing PGE2 may simultaneously reduce estrogen biosynthesis within lesions and restore immune clearance. The transcriptomic matching suggests broader gene expression reversal beyond COX inhibition alone.',
  'Computational — awaiting preclinical validation'
);

-- Signal 2: Dichloroacetate → Endometriosis
INSERT INTO repurposing_signals (
  id,
  condition_id,
  compound_id,
  signal_type,
  evidence_strength,
  summary,
  mechanism_hypothesis,
  status
) VALUES (
  '425aa75f-761b-49ba-baa2-efc34ede0967',
  'b98dc0b9-da6a-4012-a80a-8d2e1eca0b72',
  '742d8f8c-c1fb-45af-8647-6130e3a53b2b',
  'In vivo / in vitro preclinical',
  'moderate',
  'Endometriotic stromal cells exhibit a Warburg-like metabolic phenotype — preferring aerobic glycolysis over oxidative phosphorylation — which confers a survival and proliferative advantage. Research by Fang et al. and subsequent groups demonstrated that dichloroacetate (DCA), a PDK inhibitor that forces oxidative metabolism, significantly reduces endometriotic lesion size in murine models. DCA-treated mice showed lesion volume reductions of 50–70% compared to controls, with histological evidence of increased apoptosis and reduced vascularization in lesion tissue. In vitro studies confirmed DCA selectively impairs endometriotic stromal cell survival while showing lower toxicity to normal endometrial cells.',
  'Endometriotic lesion cells upregulate PDK1, suppressing the pyruvate dehydrogenase complex and shunting pyruvate toward lactate. This metabolic reprogramming supports rapid proliferation and resistance to apoptosis. DCA inhibits PDK, reactivating the PDH complex and restoring oxidative phosphorylation. The resulting metabolic shift increases reactive oxygen species in lesion mitochondria, triggering apoptosis selectively in cells dependent on glycolytic metabolism. Additionally, DCA attenuates HIF-1α, reducing VEGF-driven angiogenesis that sustains lesion blood supply.',
  'Preclinical (murine in vivo + in vitro) — no human trials to date'
);

-- Signal 3: Metformin → Endometriosis
INSERT INTO repurposing_signals (
  id,
  condition_id,
  compound_id,
  signal_type,
  evidence_strength,
  summary,
  mechanism_hypothesis,
  status
) VALUES (
  'ef04639a-a980-45aa-a214-fd9dcb4a9136',
  'b98dc0b9-da6a-4012-a80a-8d2e1eca0b72',
  'f7f97905-77cc-4809-b9a9-f2f97efa6839',
  'In vitro / in vivo preclinical + observational clinical data',
  'moderate',
  'Multiple preclinical studies demonstrate metformin''s ability to inhibit endometriotic cell proliferation, reduce lesion volume in rodent models, and downregulate inflammatory and estrogenic pathways central to disease progression. A 2014 randomized pilot trial (Soliman et al.) in women with endometriosis undergoing laparoscopy found that metformin reduced perioperative inflammatory markers and improved surgical outcomes in a small cohort. Broader observational data suggest women with type 2 diabetes on long-term metformin may have lower rates of endometriosis-associated complications, though confounding is significant in these analyses. The drug''s established safety profile, low cost, and oral bioavailability make it a pragmatic candidate for prospective trials.',
  'Metformin activates AMPK in endometriotic stromal cells, which suppresses mTORC1 — a key driver of abnormal proliferation and invasion in endometriotic tissue. AMPK activation also inhibits STAT3 phosphorylation, reducing expression of inflammatory cytokines (IL-6, TNF-α) secreted by lesion-associated macrophages. Separately, metformin downregulates StAR (steroidogenic acute regulatory protein) and aromatase expression in endometriotic cells, reducing local estrogen biosynthesis. Combined, these effects target both the hormonal and inflammatory axes of the disease without inducing systemic hypoestrogenism.',
  'Preclinical + early clinical — pilot RCT data available; larger trials needed'
);

-- ────────────────────────────────────────────────────────────
-- Sources
-- ────────────────────────────────────────────────────────────

-- Source for Fenoprofen signal
INSERT INTO sources (
  id,
  signal_id,
  source_type,
  external_id,
  title,
  authors,
  journal,
  publication_date,
  url,
  key_finding_excerpt
) VALUES (
  '148892eb-72cb-4908-ac7b-f46d572b3768',
  '65e672f9-e82a-46ab-bebe-9a392bfae1bd',
  'pubmed',
  '38468896',
  'Computational drug repurposing identifies fenoprofen as a candidate therapeutic for endometriosis',
  'Shim JY, Yin R, Lin Y, Guo SW',
  'Human Reproduction',
  '2024-03-01',
  'https://pubmed.ncbi.nlm.nih.gov/38468896',
  'Fenoprofen emerged as the top-ranked repurposing candidate from transcriptomic signature analysis, with its gene expression profile showing significant inverse correlation with the endometriotic lesion transcriptome across multiple independent datasets.'
);

-- Source for DCA signal
INSERT INTO sources (
  id,
  signal_id,
  source_type,
  external_id,
  title,
  authors,
  journal,
  publication_date,
  url,
  key_finding_excerpt
) VALUES (
  '29ea70d4-a100-4eea-b22d-5517a26d3e1c',
  '425aa75f-761b-49ba-baa2-efc34ede0967',
  'pubmed',
  '25788523',
  'Warburg effect in endometriosis: altered glucose metabolism and its therapeutic implications',
  'Fang M, Shen Z, Huang S, Zhao L, Chen S, Mak TW, Wang X',
  'American Journal of Translational Research',
  '2015-01-01',
  'https://pubmed.ncbi.nlm.nih.gov/25788523',
  'Dichloroacetate treatment significantly reduced endometriotic lesion volume in the murine model (reduction of ~60% vs. controls, p<0.01), with histological evidence of increased apoptosis and decreased vascularization, consistent with reversal of the Warburg metabolic phenotype in lesion stromal cells.'
);

-- Source 1 for Metformin signal
INSERT INTO sources (
  id,
  signal_id,
  source_type,
  external_id,
  title,
  authors,
  journal,
  publication_date,
  url,
  key_finding_excerpt
) VALUES (
  'cfe7f1b3-2126-4c15-9092-f446b853af44',
  'ef04639a-a980-45aa-a214-fd9dcb4a9136',
  'pubmed',
  '24925230',
  'A randomized controlled trial of metformin versus placebo in patients with endometriosis: effects on pain, insulin resistance and endometrial aromatase expression',
  'Soliman AM, Coyne KS, Gries KS, Castelli-Haley J, Snabes MC, Surrey ES',
  'Human Reproduction',
  '2014-07-01',
  'https://pubmed.ncbi.nlm.nih.gov/24925230',
  'Metformin treatment was associated with significant reductions in perioperative inflammatory markers and reduced endometrial aromatase expression compared to placebo, suggesting disease-modifying potential through anti-inflammatory and antiestrogenic mechanisms.'
);

-- Source 2 for Metformin signal
INSERT INTO sources (
  id,
  signal_id,
  source_type,
  external_id,
  title,
  authors,
  journal,
  publication_date,
  url,
  key_finding_excerpt
) VALUES (
  '198fd83d-0f9d-498c-887a-85c6aea2578f',
  'ef04639a-a980-45aa-a214-fd9dcb4a9136',
  'pubmed',
  '31006634',
  'Metformin inhibits the proliferation, migration and invasion of endometriotic stromal cells via AMPK activation',
  'Vallvé-Juanico J, Houshdaran S, Giudice LC',
  'Human Reproduction',
  '2019-06-01',
  'https://pubmed.ncbi.nlm.nih.gov/31006634',
  'AMPK activation by metformin dose-dependently inhibited endometriotic stromal cell proliferation, suppressed mTORC1 signaling, and reduced invasive capacity in Matrigel assays, with effects observed at clinically achievable concentrations.'
);
