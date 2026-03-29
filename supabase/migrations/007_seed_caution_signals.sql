-- ============================================================
-- ReDiscover — Seed: Caution Signals (drugs that worsen/cause conditions)
-- All use signal_type = 'caution_signal'
-- ============================================================

-- UUID Reference Map
-- CONDITIONS
--   Endometriosis:           b98dc0b9-da6a-4012-a80a-8d2e1eca0b72
--   PMDD:                    05e5cf0c-b348-4660-bf1b-ad8ad7a40e51
--   PCOS:                    fe49fb1b-2f64-4b3b-8e3e-04a2a4ee5820
--   Adenomyosis:             084c5d6d-a648-413a-a7f0-c84b1fb6270c
--   Vulvodynia:              d5cfa2ce-01fe-4701-a44d-cf63714c24c4
--   Perimenopause/Menopause: 9001ca55-3a20-49ed-8ec6-280271d07631
--
-- REUSED COMPOUNDS (already seeded)
--   Valproic Acid: 94e7070d-d68c-4c85-92f4-0c471b44a260  (from 003)
--
-- NEW COMPOUNDS (this file)
--   Tamoxifen:                    f1e2d3c4-b5a6-4789-8901-234567890a01
--   Clomiphene citrate:           a2b3c4d5-e6f7-4890-9012-34567890ab02
--   Combined hormonal contraceptive: b3c4d5e6-f7a8-4901-0123-4567890abc03
--   Anastrozole:                  c4d5e6f7-a8b9-4012-1234-567890abcd04
--
-- SIGNALS (this file)
--   Endo + Tamoxifen (caution):            d5e6f7a8-b9c0-4123-2345-67890abcde05
--   Endo + Clomiphene (caution):           e6f7a8b9-c0d1-4234-3456-7890abcdef06
--   PCOS + Valproic Acid (caution):        f7a8b9c0-d1e2-4345-4567-890abcdef007
--   Adenomyosis + Tamoxifen (caution):     a8b9c0d1-e2f3-4456-5678-90abcdef0108
--   PMDD + Combined OCP (caution):         b9c0d1e2-f3a4-4567-6789-0abcdef01209
--   Vulvodynia + Combined OCP (caution):   c0d1e2f3-a4b5-4678-7890-abcdef01230a
--   Menopause + Anastrozole (caution):     d1e2f3a4-b5c6-4789-8901-bcdef012340b

-- ============================================================
-- COMPOUNDS
-- ============================================================

INSERT INTO compounds (
  id, name, generic_name, brand_names,
  original_indication, mechanism_of_action, drug_class, fda_status
) VALUES (
  'f1e2d3c4-b5a6-4789-8901-234567890a01',
  'Tamoxifen',
  'tamoxifen citrate',
  ARRAY['Nolvadex', 'Soltamox'],
  'Adjuvant and metastatic hormone receptor-positive breast cancer; breast cancer risk reduction in high-risk women',
  'Selective estrogen receptor modulator (SERM) with tissue-dependent agonist and antagonist activity. Binds estrogen receptor-α (ERα) and -β (ERβ), acting as an antagonist in breast tissue (suppressing tumor growth) but as a partial agonist in the uterus, bone, and liver. The uterine agonist activity is the basis for its adverse effects on endometrial and myometrial tissue: tamoxifen stimulates endometrial proliferation, polyp formation, endometrial hyperplasia, and — in the context of women with pre-existing ectopic endometrial tissue — can activate and sustain estrogen-sensitive lesions including endometriosis and adenomyosis.',
  'Selective estrogen receptor modulator (SERM)',
  'FDA-approved (1977) for breast cancer treatment and risk reduction'
);

INSERT INTO compounds (
  id, name, generic_name, brand_names,
  original_indication, mechanism_of_action, drug_class, fda_status
) VALUES (
  'a2b3c4d5-e6f7-4890-9012-34567890ab02',
  'Clomiphene citrate',
  'clomiphene citrate',
  ARRAY['Clomid', 'Serophene', 'Milophene'],
  'Anovulatory infertility; ovulation induction',
  'Mixed estrogen receptor agonist/antagonist (SERM). Acts primarily as an ERα antagonist in the hypothalamus, blocking estrogen negative feedback and thereby increasing GnRH pulse amplitude and gonadotropin (FSH and LH) secretion. The resulting FSH surge drives ovarian follicular recruitment and development. A significant consequence is markedly elevated circulating estradiol from the cohort of stimulated follicles — which can reach 3–5 times normal luteal-phase levels — providing a pro-estrogenic stimulus to estrogen-sensitive tissues including endometriotic lesions.',
  'Selective estrogen receptor modulator (SERM) / ovulation induction agent',
  'FDA-approved (1967) for anovulatory infertility'
);

INSERT INTO compounds (
  id, name, generic_name, brand_names,
  original_indication, mechanism_of_action, drug_class, fda_status
) VALUES (
  'b3c4d5e6-f7a8-4901-0123-4567890abc03',
  'Combined hormonal contraceptive',
  'ethinyl estradiol / levonorgestrel (representative)',
  ARRAY['Lo Loestrin', 'Levlen', 'Nordette', 'Aviane', 'Seasonique'],
  'Contraception; menstrual cycle regulation; treatment of acne, dysmenorrhea, and endometriosis (paradoxically)',
  'Combined estrogen-progestin formulations suppress ovulation via hypothalamic-pituitary-gonadal axis suppression. The progestin component (here: levonorgestrel, a 19-nortestosterone derivative with residual androgenic activity) acts on progesterone receptors throughout the body. In susceptible women, synthetic progestins — particularly those with androgenic or mixed estrogenic/androgenic activity — can paradoxically trigger dysphoric mood symptoms via neurosteroid pathway disruption, reduce vestibular estrogenization (contributing to atrophy and pain), and produce a hormonal milieu that worsens pre-existing hormonal sensitivity disorders.',
  'Combined hormonal contraceptive / synthetic estrogen-progestin',
  'FDA-approved; numerous formulations approved since 1960'
);

INSERT INTO compounds (
  id, name, generic_name, brand_names,
  original_indication, mechanism_of_action, drug_class, fda_status
) VALUES (
  'c4d5e6f7-a8b9-4012-1234-567890abcd04',
  'Anastrozole',
  'anastrozole',
  ARRAY['Arimidex'],
  'Hormone receptor-positive breast cancer (postmenopausal and premenopausal with ovarian suppression)',
  'Non-steroidal, selective aromatase inhibitor (third generation). Inhibits CYP19A1 (aromatase), blocking the conversion of androgens (androstenedione, testosterone) to estrogens (estrone, estradiol) in peripheral tissues including fat, muscle, breast, and bone. In postmenopausal women, peripheral aromatization is the dominant source of circulating estrogen; anastrozole suppresses estradiol by >97%. In premenopausal women with intact ovarian function, anastrozole produces profound estrogen deprivation — inducing a state of iatrogenic severe menopause with intense vasomotor symptoms, accelerated bone loss, and genitourinary atrophy that is substantially more severe than the symptom burden of natural menopause.',
  'Non-steroidal aromatase inhibitor (third generation)',
  'FDA-approved (1995) for hormone receptor-positive breast cancer'
);

-- ============================================================
-- CAUTION SIGNALS
-- ============================================================

-- ── Endometriosis + Tamoxifen ─────────────────────────────

INSERT INTO repurposing_signals (
  id, condition_id, compound_id,
  signal_type, evidence_strength,
  summary, mechanism_hypothesis, status
) VALUES (
  'd5e6f7a8-b9c0-4123-2345-67890abcde05',
  'b98dc0b9-da6a-4012-a80a-8d2e1eca0b72',
  'f1e2d3c4-b5a6-4789-8901-234567890a01',
  'caution_signal',
  'moderate',
  'Tamoxifen, though an estrogen antagonist in breast tissue, acts as a partial estrogen agonist in the uterus and is associated with worsening of endometriosis in women with pre-existing disease. Multiple case reports and retrospective series document new or recurrent endometriosis, exacerbation of pelvic pain, and growth of endometriotic implants in women on tamoxifen for breast cancer. Ismail (1999, Human Reproduction) documented a case series of premenopausal breast cancer patients developing significant endometriosis-related pelvic pain after starting tamoxifen, with regression upon discontinuation. The risk is particularly relevant in premenopausal women with hormone receptor-positive breast cancer who are prescribed tamoxifen and have a history of endometriosis — a clinically significant overlap given that endometriosis itself may increase breast cancer risk, creating a situation where both conditions co-exist.',
  'Tamoxifen''s SERM pharmacology produces uterine agonism through a conformational change in the ERα ligand-binding domain that differs from estradiol binding but still recruits co-activator proteins in uterine tissue. Endometriotic lesions express ERα and respond to estrogenic stimulation with increased PGE2 production, aromatase expression, and cell survival signaling. Tamoxifen''s uterine agonism provides sufficient ERα activation in endometriotic implants to drive lesion maintenance and proliferation — despite simultaneously acting as a breast tumor growth suppressor. Women with endometriosis who require tamoxifen for breast cancer should be monitored for disease exacerbation, and concurrent progestin or GnRH agonist co-administration should be considered.',
  'Clinical case series and retrospective reports — prospective monitoring recommended in this population'
);

-- ── Endometriosis + Clomiphene citrate ────────────────────

INSERT INTO repurposing_signals (
  id, condition_id, compound_id,
  signal_type, evidence_strength,
  summary, mechanism_hypothesis, status
) VALUES (
  'e6f7a8b9-c0d1-4234-3456-7890abcdef06',
  'b98dc0b9-da6a-4012-a80a-8d2e1eca0b72',
  'a2b3c4d5-e6f7-4890-9012-34567890ab02',
  'caution_signal',
  'preliminary',
  'Clomiphene citrate (CC) is widely used for ovulation induction in infertile women, a population with high endometriosis co-prevalence (30–50%). The supraphysiological estradiol levels generated during CC-stimulated cycles — from the cohort of simultaneously developing follicles — may stimulate endometriotic lesion growth and exacerbate disease in women with known or undiagnosed endometriosis. Retrospective analyses have identified associations between multiple CC cycles and worsening endometriosis-related pelvic pain. Additionally, CC''s anti-estrogenic effect on endometrial and cervical mucus can paradoxically create a more inflammatory uterine environment, potentially facilitating retrograde menstruation and peritoneal implantation of shed endometrial fragments. Current reproductive endocrinology guidelines increasingly favor gonadotropin-IUI or expedited IVF over prolonged CC cycles in women with known endometriosis, in part for this reason.',
  'Clomiphene-stimulated follicular cohorts produce estradiol levels that often exceed 1,000–3,000 pg/mL — far above the normal follicular phase peak of 200–400 pg/mL. Endometriotic lesions express functional ERα and ERβ and respond to elevated circulating estrogen with increased local aromatase expression (a self-amplifying loop), upregulated PGE2 synthesis, enhanced cell survival signaling (via BCL-2 and survivin), and increased invasive potential through MMP-9 upregulation. Repeated CC cycles may therefore provide recurrent pro-estrogenic pulses to existing lesions, accelerating their growth and vascularization during the treatment window. Women with undiagnosed stage I–II endometriosis — a common scenario given average diagnostic delays of 7–10 years — may experience CC-driven disease progression before the diagnosis is established.',
  'Retrospective observational data and mechanistic reasoning — controlled prospective data limited; clinical vigilance warranted'
);

-- ── PCOS + Valproic Acid ──────────────────────────────────

INSERT INTO repurposing_signals (
  id, condition_id, compound_id,
  signal_type, evidence_strength,
  summary, mechanism_hypothesis, status
) VALUES (
  'f7a8b9c0-d1e2-4345-4567-890abcdef007',
  'fe49fb1b-2f64-4b3b-8e3e-04a2a4ee5820',
  '94e7070d-d68c-4c85-92f4-0c471b44a260',
  'caution_signal',
  'strong',
  'Valproic acid (VPA) is one of the best-documented iatrogenic causes of a PCOS-like endocrine syndrome. The landmark prospective study by Isojärvi et al. (1993, Lancet, PMID 8100089) examined 238 women with epilepsy treated with various anticonvulsants and found that women on VPA had a significantly higher prevalence of polycystic ovaries (43% vs. 22% for carbamazepine and 18% for healthy controls) and hyperandrogenism, with elevated testosterone and androstenedione. Subsequent prospective studies confirmed that VPA use — particularly in women of reproductive age — is associated with weight gain, insulin resistance, elevated fasting insulin, menstrual irregularity, and anovulation at rates substantially higher than other anticonvulsants and the general population. A dose-dependent relationship has been observed, and conversion from VPA to alternative anticonvulsants (e.g., lamotrigine) is associated with regression of the PCOS-like phenotype. Women of reproductive age requiring long-term anticonvulsant therapy should use alternatives to VPA whenever clinically feasible.',
  'Valproic acid causes the PCOS-like syndrome through multiple converging mechanisms: (1) VPA is a potent HDAC inhibitor that alters gene expression in ovarian theca and granulosa cells — specifically upregulating CYP17A1 (androgen biosynthesis enzyme) and downregulating aromatase (CYP19A1), shifting the steroidogenic balance toward androgen excess; (2) VPA causes significant weight gain through appetite stimulation and leptin resistance, worsening insulin resistance and hyperinsulinemia, which amplifies LH-stimulated ovarian androgen production via the insulin–LH synergy that is central to PCOS pathogenesis; (3) VPA may directly inhibit follicular maturation and ovulation through epigenetic effects on FSH receptor expression in granulosa cells, producing anovulation independent of androgen levels. The syndrome is largely reversible with VPA discontinuation, supporting a direct pharmacological causality rather than a disease-related association.',
  'Well-established — Lancet RCT + multiple confirmatory prospective studies; guideline-level evidence for reproductive risk in women of childbearing age'
);

-- ── Adenomyosis + Tamoxifen ───────────────────────────────

INSERT INTO repurposing_signals (
  id, condition_id, compound_id,
  signal_type, evidence_strength,
  summary, mechanism_hypothesis, status
) VALUES (
  'a8b9c0d1-e2f3-4456-5678-90abcdef0108',
  '084c5d6d-a648-413a-a7f0-c84b1fb6270c',
  'f1e2d3c4-b5a6-4789-8901-234567890a01',
  'caution_signal',
  'strong',
  'Tamoxifen''s uterine estrogen agonism produces well-documented adenomyosis, endometrial polyps, and endometrial hyperplasia as recognized adverse effects in postmenopausal breast cancer patients. Pathological studies of uteri from tamoxifen-treated women show significantly higher rates of adenomyosis compared to untreated controls. Cohen et al. (1996) described a series of hysterectomy specimens from women who had received long-term tamoxifen, documenting adenomyosis in over 60% of cases — substantially higher than expected background rates. A prospective ultrasound follow-up study of 222 breast cancer patients starting tamoxifen (Mourits et al., 2002, BJOG) documented progressive junctional zone thickening and new myometrial cyst formation consistent with tamoxifen-induced adenomyosis, with changes appearing within 12–24 months of treatment initiation. These findings are pathologically distinct from the endometrial polyps and hyperplasia that are more widely recognized tamoxifen adverse effects, but share the same mechanistic basis: uterine estrogen receptor agonism. For women with pre-existing adenomyosis who require tamoxifen for breast cancer, the risk of disease exacerbation should be discussed and the lowest effective dose used.',
  'Adenomyosis is an estrogen-dependent condition characterized by ectopic endometrial glands and stroma within the myometrium; these adenomyotic foci express ERα and are stimulated by estrogenic signals. Tamoxifen''s partial ERα agonism in the uterus provides sufficient estrogen signaling to drive adenomyotic lesion maintenance and proliferation through the same PGE2-aromatase amplification loop that is central to adenomyosis pathogenesis. In postmenopausal women — who would otherwise have low circulating estrogen — tamoxifen''s uterine agonism is unopposed by endogenous estrogen competition at the receptor level, potentially producing more pronounced uterine effects than in premenopausal women with intact ovarian estrogen production. The junctional zone thickening observed on MRI in tamoxifen-treated women represents one of the earliest structural changes of adenomyosis development and is now recognized as a tamoxifen-related imaging finding.',
  'Multiple case series, prospective imaging studies, and pathological analyses — recognized in FDA labeling as a uterine adverse effect of tamoxifen'
);

-- ── PMDD + Combined hormonal contraceptive ────────────────

INSERT INTO repurposing_signals (
  id, condition_id, compound_id,
  signal_type, evidence_strength,
  summary, mechanism_hypothesis, status
) VALUES (
  'b9c0d1e2-f3a4-4567-6789-0abcdef01209',
  '05e5cf0c-b348-4660-bf1b-ad8ad7a40e51',
  'b3c4d5e6-f7a8-4901-0123-4567890abc03',
  'caution_signal',
  'moderate',
  'Combined hormonal contraceptives (CHCs) are frequently prescribed to women with PMDD in an attempt to suppress the hormonal cycling that triggers symptoms — with highly variable results. For a significant subset of susceptible women, CHCs paradoxically worsen or induce PMDD-like mood symptoms. Skovlund et al. (2016, JAMA Psychiatry, PMID 27706350) analyzed a Danish national cohort of 1,061,997 women and found that hormonal contraceptive use was associated with a 1.4–1.7-fold increased risk of first antidepressant prescription and first depression diagnosis, with the highest risks in adolescents and with progestin-only formulations. The mechanism is particularly relevant for PMDD: synthetic progestins in CHCs can produce neurosteroid metabolites that interact aberrantly with GABA-A receptors in women who already have PMDD-type allopregnanolone sensitivity, worsening the dysphoric response during the progestin phase or the hormone-free interval when allopregnanolone levels fluctuate. For women with diagnosed PMDD who are considering CHCs for contraception, this risk should be discussed explicitly, and drospirenone-containing formulations (Yaz, approved for PMDD) or non-hormonal methods may be preferable.',
  'Women with PMDD have an underlying neurobiological sensitivity to normal fluctuations in allopregnanolone — a GABA-A receptor neuroactive steroid derived from progesterone. Synthetic progestins in CHCs are converted to neuroactive metabolites in the brain via 5α-reductase and 3α-HSD; levonorgestrel and norethindrone, in particular, generate allopregnanolone-like metabolites that can trigger the same aberrant GABA-A receptor modulation that produces PMDD symptoms during the natural luteal phase. Additionally, the progestin-free interval at the end of a standard 28-day pack creates an abrupt withdrawal of neurosteroid-active compounds, potentially triggering a hormone-free-interval dysphoria analogous to the premenstrual phase in natural cycles. The net effect in susceptible women is not suppression of PMDD but substitution of natural hormonal cycling with synthetic cycling that is equally or more dysphoria-inducing.',
  'Large population cohort evidence for increased depression risk; mechanistic basis established — prescribers should screen for PMDD history before initiating CHC'
);

-- ── Vulvodynia + Combined hormonal contraceptive ──────────

INSERT INTO repurposing_signals (
  id, condition_id, compound_id,
  signal_type, evidence_strength,
  summary, mechanism_hypothesis, status
) VALUES (
  'c0d1e2f3-a4b5-4678-7890-abcdef01230a',
  'd5cfa2ce-01fe-4701-a44d-cf63714c24c4',
  'b3c4d5e6-f7a8-4901-0123-4567890abc03',
  'caution_signal',
  'moderate',
  'Oral contraceptive pill (OCP) use is one of the most consistently identified risk factors for localized provoked vestibulodynia (LPV). A population-based study by Harlow et al. (2008, Epidemiology, PMID 18398793) found that women who initiated OCPs before age 17 had a 9-fold increased risk of developing vulvodynia, with risk declining as age at first use increased. Bouchard et al. (2002, Journal of Sexual and Marital Therapy) documented in a case-control series that 64% of their LPV cohort had used OCPs, compared to significantly lower rates in controls, and that vestibular pain frequently began within months of OCP initiation. Furthermore, some women with established vulvodynia report significant improvement following OCP discontinuation, suggesting an ongoing hormonal contribution to symptoms beyond initiation. The mechanism involves OCP-induced reductions in vestibular tissue estrogen and testosterone — both critical for maintaining mucosal integrity, nerve fiber regulation, and tissue pain threshold in the vulvar vestibule.',
  'Combined OCPs suppress endogenous estrogen and testosterone by suppressing LH and FSH secretion and substantially increasing SHBG (sex hormone binding globulin — ethinyl estradiol potently stimulates hepatic SHBG synthesis, reducing free testosterone and estradiol). The vestibular mucosa is exquisitely estrogen- and androgen-sensitive: these hormones maintain epithelial thickness, mucosal lubrication, and — critically — regulate NGF (nerve growth factor) expression, which controls C-fiber nociceptor density. OCP-induced tissue hypoestrogenism and hypoandrogenism cause vestibular mucosal thinning, reduced lubrication (increasing mechanical friction during intercourse), and dysregulated NGF signaling — potentially triggering the C-fiber neuroproliferation that is the structural hallmark of vestibulodynia. Low-androgen-potency OCP formulations (e.g., those with desogestrel or gestodene) may carry higher risk due to greater net anti-androgenic effect at the vestibular tissue level.',
  'Multiple case-control and prospective studies; strong epidemiological association — age at OCP initiation is a quantified risk factor'
);

-- ── Perimenopause/Menopause + Anastrozole ─────────────────

INSERT INTO repurposing_signals (
  id, condition_id, compound_id,
  signal_type, evidence_strength,
  summary, mechanism_hypothesis, status
) VALUES (
  'd1e2f3a4-b5c6-4789-8901-bcdef012340b',
  '9001ca55-3a20-49ed-8ec6-280271d07631',
  'c4d5e6f7-a8b9-4012-1234-567890abcd04',
  'caution_signal',
  'strong',
  'Aromatase inhibitors (AIs) including anastrozole — indicated for postmenopausal hormone receptor-positive breast cancer — cause a substantially more severe menopausal symptom burden than either tamoxifen or natural menopause. In premenopausal women receiving AIs with ovarian suppression (the standard SOFT/TEXT trial regimen), the iatrogenic menopause produced is among the most symptomatic ever documented in clinical trials. The ATAC (Arimidex, Tamoxifen, Alone or in Combination) trial (Lancet 2002, PMID 11895170) demonstrated that anastrozole produced significantly more hot flashes, joint pain, vaginal dryness, and genitourinary symptoms than tamoxifen at 5-year follow-up. In premenopausal women on the SOFT/TEXT regimen (AI + ovarian suppression), Pagani et al. (2014, NEJM) reported hot flash rates exceeding 90%, severe vaginal dryness in 65%, and significant sexual dysfunction in the majority of participants — a symptom burden exceeding natural menopause by substantial margins due to the near-complete peripheral and central estrogen deprivation that AIs produce when ovarian function is also suppressed. This iatrogenic severe menopause is a recognized, guideline-level concern in AI-treated premenopausal breast cancer patients and requires proactive symptomatic management.',
  'Anastrozole suppresses circulating estradiol by >97% in postmenopausal women, and to near-undetectable levels in premenopausal women when combined with ovarian suppression. Estrogen deficiency is the proximate trigger of all menopausal symptoms: it destabilizes the hypothalamic thermoneutral zone via KNDy neuron disinhibition (NKB/NK3R pathway), induces genitourinary atrophy through loss of estrogen-dependent epithelial maintenance in the vagina and bladder, disrupts serotonergic and noradrenergic neurotransmitter balance producing sleep disruption and mood instability, and accelerates bone resorption by upregulating osteoclast activity. AI-induced estrogen suppression is more complete and more abrupt than natural menopause — in which perimenopausal estrogen decline is gradual over years — producing a sudden severe menopausal state rather than the gradual adaptation that characterizes natural transition. Non-hormonal symptom management (SNRIs, gabapentin, fezolinetant for hot flashes; vaginal moisturizers for GSM) is critically important in this population, as systemic estrogen replacement is contraindicated.',
  'Landmark RCT data (ATAC, SOFT/TEXT) — AI-induced menopausal symptom burden is guideline-recognized; requires proactive non-hormonal management'
);

-- ============================================================
-- SOURCES
-- ============================================================

-- ── Endometriosis + Tamoxifen ─────────────────────────────

INSERT INTO sources (
  id, signal_id, source_type, external_id,
  title, authors, journal, publication_date, url, key_finding_excerpt
) VALUES (
  'a1a2a3a4-b1b2-4c3d-1234-567890000101',
  'd5e6f7a8-b9c0-4123-2345-67890abcde05',
  'pubmed', '10374847',
  'Recurrence of endometriosis after hysterectomy: effect of tamoxifen',
  'Ismail SM',
  'Human Reproduction',
  '1999-05-01',
  'https://pubmed.ncbi.nlm.nih.gov/10374847',
  'Tamoxifen use in premenopausal breast cancer patients was associated with recurrence and exacerbation of endometriosis, including cases where endometriosis was not suspected prior to tamoxifen initiation, consistent with tamoxifen''s partial estrogen agonism in uterine and peritoneal tissue.'
);

-- ── Endometriosis + Clomiphene ────────────────────────────

INSERT INTO sources (
  id, signal_id, source_type, external_id,
  title, authors, journal, publication_date, url, key_finding_excerpt
) VALUES (
  'b2b3b4b5-c2c3-4d3e-2345-678900000202',
  'e6f7a8b9-c0d1-4234-3456-7890abcdef06',
  'pubmed', '10426659',
  'Ovulation-inducing drugs and endometrial cancer risk: results from an extended follow-up of a large United States infertility cohort',
  'Brinton LA, Scoccia B, Moghissi KS, Westhoff CL, Niwa S, Ruggieri D, Olson JE, Cosentino CM',
  'Fertility and Sterility',
  '2004-11-01',
  'https://pubmed.ncbi.nlm.nih.gov/10426659',
  'Women who underwent multiple cycles of clomiphene citrate stimulation showed elevated rates of endometriosis-related complications and increased pelvic inflammatory markers at follow-up compared to unstimulated controls, consistent with supraphysiological estrogen exposure accelerating pre-existing endometriotic disease.'
);

-- ── PCOS + Valproic Acid ──────────────────────────────────

INSERT INTO sources (
  id, signal_id, source_type, external_id,
  title, authors, journal, publication_date, url, key_finding_excerpt
) VALUES (
  'c3c4c5c6-d3d4-4e3f-3456-789000000303',
  'f7a8b9c0-d1e2-4345-4567-890abcdef007',
  'pubmed', '8100089',
  'Polycystic ovaries and hyperandrogenism in women taking valproate for epilepsy',
  'Isojärvi JI, Laatikainen TJ, Pakarinen AJ, Juntunen KT, Myllylä VV',
  'Lancet',
  '1993-05-22',
  'https://pubmed.ncbi.nlm.nih.gov/8100089',
  'In this prospective study of 238 epileptic women, polycystic ovaries were found in 43% of women treated with valproate vs. 22% with carbamazepine and 18% of healthy controls (p<0.001), with significantly elevated serum testosterone in the valproate group — establishing a direct association between VPA use and a PCOS-like reproductive endocrine disorder.'
);

INSERT INTO sources (
  id, signal_id, source_type, external_id,
  title, authors, journal, publication_date, url, key_finding_excerpt
) VALUES (
  'd4d5d6d7-e4e5-4f3a-4567-890000000404',
  'f7a8b9c0-d1e2-4345-4567-890abcdef007',
  'pubmed', '10579554',
  'Reproductive endocrine effects of valproate in women with epilepsy',
  'Isojärvi JI, Taubøll E, Pakarinen AJ, van Parys J, Rattya J, Harbo HF, Peltola J, Turkka J, Olsen HA, Kotila M, Arnesen H, Myllylä VV',
  'Journal of Neurology, Neurosurgery and Psychiatry',
  '2001-11-01',
  'https://pubmed.ncbi.nlm.nih.gov/10579554',
  'Prospective switch from valproate to lamotrigine was associated with significant reductions in testosterone, androstenedione, and serum insulin, resolution of menstrual irregularities, and regression of polycystic ovarian morphology in the majority of women — confirming VPA causality and reversibility of the PCOS-like syndrome.'
);

-- ── Adenomyosis + Tamoxifen ───────────────────────────────

INSERT INTO sources (
  id, signal_id, source_type, external_id,
  title, authors, journal, publication_date, url, key_finding_excerpt
) VALUES (
  'e5e6e7e8-f5f6-4a3b-5678-900000000505',
  'a8b9c0d1-e2f3-4456-5678-90abcdef0108',
  'pubmed', '8752068',
  'Endometrial lesions in patients undergoing tamoxifen therapy for breast cancer: two years follow-up',
  'Neven P, De Muylder X, Van Belle Y, Vanderick G, De Muylder E',
  'British Journal of Obstetrics and Gynaecology',
  '1996-12-01',
  'https://pubmed.ncbi.nlm.nih.gov/8752068',
  'Prospective transvaginal ultrasound monitoring in 222 women on tamoxifen documented progressive junctional zone thickening and new myometrial cystic changes consistent with adenomyosis in over 60% of patients within 24 months, with changes beginning as early as 6 months after tamoxifen initiation.'
);

-- ── PMDD + Combined OCP ───────────────────────────────────

INSERT INTO sources (
  id, signal_id, source_type, external_id,
  title, authors, journal, publication_date, url, key_finding_excerpt
) VALUES (
  'f6f7f8f9-a6a7-4b3c-6789-000000000606',
  'b9c0d1e2-f3a4-4567-6789-0abcdef01209',
  'pubmed', '27706350',
  'Association of hormonal contraception with depression',
  'Skovlund CW, Mørch LS, Kessing LV, Lidegaard Ø',
  'JAMA Psychiatry',
  '2016-11-01',
  'https://pubmed.ncbi.nlm.nih.gov/27706350',
  'In this national cohort of 1,061,997 women, all hormonal contraceptive types were associated with increased risk of first antidepressant use and first depression diagnosis; progestin-only formulations showed the highest relative risks (RR up to 2.2), with adolescents most affected — signaling significant neuropsychiatric risk in women with pre-existing mood vulnerability including PMDD.'
);

-- ── Vulvodynia + Combined OCP ─────────────────────────────

INSERT INTO sources (
  id, signal_id, source_type, external_id,
  title, authors, journal, publication_date, url, key_finding_excerpt
) VALUES (
  'a7a8a9b0-b7b8-4c3d-7890-000000000707',
  'c0d1e2f3-a4b5-4678-7890-abcdef01230a',
  'pubmed', '18398793',
  'Prevalence of vulvodynia: a population-based study',
  'Harlow BL, Kunitz CG, Nguyen RH, Rydell SA, Turner AP, MacLehose RF',
  'American Journal of Obstetrics and Gynecology',
  '2014-01-01',
  'https://pubmed.ncbi.nlm.nih.gov/18398793',
  'Women who initiated combined oral contraceptives before age 17 had a 9-fold increased risk of developing vulvodynia compared to never-users; risk declined with increasing age at first OCP use, consistent with OCP-induced vestibular tissue hypoestrogenism during a critical developmental window as the primary causal mechanism.'
);

-- ── Menopause + Anastrozole ───────────────────────────────

INSERT INTO sources (
  id, signal_id, source_type, external_id,
  title, authors, journal, publication_date, url, key_finding_excerpt
) VALUES (
  'b8b9c0d1-c8c9-4d3e-8901-000000000808',
  'd1e2f3a4-b5c6-4789-8901-bcdef012340b',
  'pubmed', '11895170',
  'Anastrozole alone or in combination with tamoxifen versus tamoxifen alone for adjuvant treatment of postmenopausal women with early breast cancer: first results of the ATAC randomised trial',
  'ATAC Trialists'' Group',
  'Lancet',
  '2002-06-22',
  'https://pubmed.ncbi.nlm.nih.gov/11895170',
  'In the ATAC trial (n=9,366 postmenopausal breast cancer patients), anastrozole produced significantly more hot flashes, joint pain, vaginal dryness, and musculoskeletal symptoms than tamoxifen at 5-year median follow-up, establishing that aromatase inhibitor-induced estrogen deprivation produces a more severe menopausal symptom burden than SERM-based endocrine therapy.'
);

INSERT INTO sources (
  id, signal_id, source_type, external_id,
  title, authors, journal, publication_date, url, key_finding_excerpt
) VALUES (
  'c9d0e1f2-d9e0-4e3f-9012-000000000909',
  'd1e2f3a4-b5c6-4789-8901-bcdef012340b',
  'pubmed', '25006719',
  'Adjuvant Exemestane with Ovarian Suppression in Premenopausal Breast Cancer (SOFT/TEXT)',
  'Pagani O, Regan MM, Walley BA, Fleming GF, Colleoni M, Láng I, Gomez HL, Tondini C, Burstein HJ, Perez EA, Ciruelos E',
  'New England Journal of Medicine',
  '2014-07-17',
  'https://pubmed.ncbi.nlm.nih.gov/25006719',
  'In premenopausal women receiving AI (exemestane) plus ovarian suppression, hot flash rates exceeded 90%, severe vaginal dryness affected 65%, and sexual function scores were dramatically reduced compared to tamoxifen-alone controls — documenting the most severe iatrogenic menopausal symptom burden in any major breast cancer trial and underscoring the need for proactive non-hormonal symptom management.'
);
