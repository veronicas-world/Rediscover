-- 045_backfill_key_finding_excerpts.sql
-- Backfill sources.key_finding_excerpt for every free-text source
-- (source_type in {'pubmed', 'clinical_trial', 'reddit'}) where
-- the LLM extraction pipeline produced a usable summary. Generated
-- by scripts/extract-key-findings.py; companion run log lives at
-- scripts/audit-output/key-finding-extractions.json.
--
-- The column existed per migration 041 but was 0% populated until
-- the Phase 2a smoke test on 2026-06-08 surfaced the gap. See
-- methodology v3.13 for the architectural story.
--
-- Each UPDATE is defensive: the WHERE clause includes
-- 'AND key_finding_excerpt IS NULL', so the migration is a no-op
-- on any row that has been touched since extraction ran. Safe to
-- re-run.
--
-- Total extractions in this migration: 121

BEGIN;

-- pubmed/33814355 (Testosterone (transdermal) / Perimenopause & Menopause)
UPDATE sources
   SET key_finding_excerpt = 'A clinical practice guideline from the International Society for the Study of Women''s Sexual Health, developed via multidisciplinary expert panel and modified Delphi consensus, recommended systemic transdermal testosterone for postmenopausal (and, per limited data, late reproductive age premenopausal) women with hypoactive sexual desire disorder (HSDD) not primarily attributable to relationship or mental health issues. The guideline reported that current research supports a moderate therapeutic benefit, with safety data showing no serious adverse events with physiologic testosterone use, though long-term safety has not been established. Government-approved transdermal male formulations could be used cautiously with female-appropriate dosing, monitoring total testosterone levels to maintain concentrations within the physiologic premenopausal range, while compounded products were not recommended due to lack of efficacy and safety data.'
 WHERE id = '9828bb10-6ecc-422c-9f79-d3e3472daea6'
   AND key_finding_excerpt IS NULL;

-- pubmed/32852449 (Vaginal Estrogen / Perimenopause & Menopause)
UPDATE sources
   SET key_finding_excerpt = 'This 2020 NAMS position statement, based on expert panel review of literature since 2013, identified low-dose vaginal estrogen as an effective treatment for moderate to severe genitourinary syndrome of menopause (GSM), which affects approximately 27% to 84% of postmenopausal women. The panel noted that when low-dose vaginal estrogen is administered, a progestogen is not indicated, but long-term studies on endometrial safety are lacking, with data available only up to 1 year. The statement also noted insufficient data to confirm the safety of vaginal estrogen in women with breast cancer, recommending that management consider the woman''s needs and her oncologist''s recommendations.'
 WHERE id = 'cd3fec23-b272-47a1-9d25-905736f0729c'
   AND key_finding_excerpt IS NULL;

-- clinical_trial/NCT00536198 (Sertraline / PMDD)
UPDATE sources
   SET key_finding_excerpt = 'This clinical trial (NCT00536198) was designed to evaluate the effectiveness of sertraline, an FDA-approved SSRI, in reducing symptoms in women diagnosed with PMDD. The study used a randomized, placebo-controlled design in which participants received either sertraline or placebo symptom-onset dosing (two pills daily) across six menstrual cycles, following two baseline cycles of symptom tracking. Mood and symptoms were assessed at monthly visits and telephone contacts, with a final phase offering all participants continuous daily sertraline for three additional cycles to evaluate its effectiveness when dosed continuously. The source describes the study design and objectives but does not report specific outcome data, effect sizes, or statistical results.'
 WHERE id = 'b3ceee39-b6ce-4e96-9283-e6060bd48616'
   AND key_finding_excerpt IS NULL;

-- clinical_trial/NCT00523705 (Escitalopram / PMDD)
UPDATE sources
   SET key_finding_excerpt = 'This pilot clinical trial (NCT00523705) was designed to evaluate the efficacy and safety of escitalopram administered premenstrually (day 14 through day 2 of the menstrual cycle) for severe PMS in young women ages 15-19. The study noted that SSRIs are considered first-line treatment for severe PMS, but that no prior clinical trials had examined the efficacy and safety of serotonergic antidepressant treatment specifically in teens, despite evidence that teens experience PMS symptoms and severity comparable to adult women. The source describes the trial''s purpose and rationale but does not report outcome data or results.'
 WHERE id = 'bb32f7b5-1e2c-4045-99b1-7fcd37581ab9'
   AND key_finding_excerpt IS NULL;

-- clinical_trial/NCT02508103 (Oxytocin / PMDD)
UPDATE sources
   SET key_finding_excerpt = 'This pilot clinical trial (NCT02508103) investigated intranasal oxytocin in women with premenstrual dysphoric disorder (PMDD), including those with and without a history of early life abuse (ELA). The study used functional neuroimaging (fMRI) to examine whether oxytocin administration modifies activation of brain regions involved in emotion regulation during an emotional processing task. It also assessed whether daily intranasal oxytocin during the premenstrual phase improves PMDD symptoms. The source describes the study design and objectives but does not report specific outcome results, effect sizes, or statistical findings.'
 WHERE id = '4239c61c-2cea-4706-a87b-09d6b11913b2'
   AND key_finding_excerpt IS NULL;

-- pubmed/36924778 (NKB Receptor Antagonists (NK3R Antagonists) / Perimenopause & Menopause)
UPDATE sources
   SET key_finding_excerpt = 'This randomised, double-blind, placebo-controlled phase 3 trial (SKYLIGHT 1, n=2205 screened, with 175 placebo, 174 fezolinetant 30 mg, and 173 fezolinetant 45 mg receiving treatment) evaluated the NK3R antagonist fezolinetant for moderate-to-severe vasomotor symptoms of menopause. Compared with placebo, both fezolinetant doses significantly reduced hot flash frequency at week 4 (least squares mean difference -1.87 and -2.07; both p<0.001) and week 12 (-2.39 and -2.55; both p<0.001), as well as severity at week 4 (-0.15, p=0.012; -0.19, p=0.002) and week 12 (-0.24, p=0.002; -0.20, p=0.007), with improvements evident from week 1 and maintained through 52 weeks. Treatment-emergent adverse events occurred in 37% and 43% of the 30 mg and 45 mg groups versus 45% with placebo, and liver enzyme elevations were infrequent and generally transient. The authors concluded that the data support fezolinetant''s use as a non-hormonal treatment for men'
 WHERE id = '49e153a3-28d1-489b-9b27-accb619fe77b'
   AND key_finding_excerpt IS NULL;

-- pubmed/36734148 (NKB Receptor Antagonists (NK3R Antagonists) / Perimenopause & Menopause)
UPDATE sources
   SET key_finding_excerpt = 'This double-blind, placebo-controlled phase 3 trial (SKYLIGHT 2, NCT04003142) evaluated fezolinetant, an NK3R antagonist, in women aged 40-65 with moderate to severe vasomotor symptoms (VMS) associated with menopause. Both fezolinetant 30 mg and 45 mg once daily significantly reduced VMS frequency and severity compared to placebo at week 4 and week 12 (e.g., week 12 frequency reduction: -1.86 for 30 mg and -2.53 for 45 mg vs placebo, both P < .001), with improvement observed as early as week 1 and maintained through week 52 in the 40-week extension. Serious treatment-emergent adverse events were infrequent (2% with 30 mg, 1% with 45 mg, 0% with placebo). The study concluded that fezolinetant 30 and 45 mg were efficacious and well tolerated for treating moderate to severe VMS associated with menopause.'
 WHERE id = 'cdc4ff9d-aa51-4018-aca3-fbbac3d45288'
   AND key_finding_excerpt IS NULL;

-- pubmed/32379217 (Estetrol (E4) / Perimenopause & Menopause)
UPDATE sources
   SET key_finding_excerpt = 'This multicenter, randomized, double-blind, placebo-controlled trial (n=257 postmenopausal women, ages 40-65) tested estetrol (E4) doses of 2.5, 5, 10, or 15 mg daily for 12 weeks to identify the minimum effective dose for vasomotor symptoms. The 15 mg dose significantly reduced weekly hot flush frequency versus placebo at both week 4 (-66% vs -49%, P=0.032) and week 12 (-82% vs -65%, P=0.022), and significantly reduced hot flush severity at week 4 (-0.59 vs -0.33, P=0.049) and week 12 (-1.04 vs -0.66, P=0.049); lower doses did not reach statistical significance. In nonhysterectomized women, endometrial thickness increased during treatment but normalized after progestin at study completion, with no endometrial hyperplasia observed. The authors concluded that 15 mg is the minimum effective daily oral dose of E4 for treating vasomotor symptoms, with a seemingly favorable safety profile pending confirmation in phase 3 development.'
 WHERE id = 'dc1c2000-b83b-417d-aced-9c93ce71e359'
   AND key_finding_excerpt IS NULL;

-- pubmed/41918604 (Dapagliflozin / PCOS)
UPDATE sources
   SET key_finding_excerpt = 'This RCT randomized women with PCOS (Rotterdam criteria) to dapagliflozin (10 mg/day) plus metformin (2000 mg/day) versus metformin alone for 12 weeks. At 12 weeks, no statistically significant between-group differences were found in insulin resistance or biochemical hyperandrogenism, though within-group changes were significant. The combination group experienced more mild adverse effects, including urinary tract infections and vaginal irritation, compared to metformin alone, and the authors concluded that adding dapagliflozin did not improve outcomes over metformin alone in overweight/obese women with PCOS.'
 WHERE id = '207cb707-084b-4e16-bb98-79f7976f1453'
   AND key_finding_excerpt IS NULL;

-- pubmed/38374053 (Pioglitazone / PCOS)
UPDATE sources
   SET key_finding_excerpt = 'In a randomized trial of 60 normal-weight women with PCOS (36 completed), pioglitazone plus metformin (PIOMET) was compared to metformin (MET) monotherapy over 12 weeks. PIOMET therapy significantly improved LH, LH/FSH ratio, and free androgen index after 4 weeks, and significantly improved SHBG, FAI, and androstenedione levels versus baseline by 12 weeks (P < 0.05), effects not seen with MET monotherapy alone for FAI and SHBG. PIOMET was more effective than MET monotherapy at improving SHBG and AMH levels, as well as blood glucose at 120 and 180 minutes during an oral glucose insulin-releasing test (P < 0.05), without affecting body weight. The authors concluded PIOMET may offer greater benefits than MET monotherapy for SHBG, AMH, and postprandial glucose in normal-weight PCOS women, pending confirmation in larger studies.'
 WHERE id = '69ab4208-664a-44d4-85c9-3d2f99fb87ec'
   AND key_finding_excerpt IS NULL;

-- pubmed/40166680 (Continuous Oral Contraceptive / Adenomyosis)
UPDATE sources
   SET key_finding_excerpt = 'A network meta-analysis of six randomized controlled trials (563 women with adenomyosis) evaluated hormonal treatments for adenomyosis-associated pelvic pain (AAPP). At 6 months, women receiving dienogest experienced significantly less AAPP than those receiving combined oral contraceptives, with a mean difference in VAS pain scores of -2.85 (95% CI -5.30 to -0.39; moderate evidence), indicating combined oral contraceptives were less effective than dienogest for this outcome. The review did not identify combined oral contraceptives as the most effective option, concluding instead that dienogest appeared to be the most effective hormonal treatment for AAPP.'
 WHERE id = '4d5e9701-88be-4403-9a4e-411f7a66a765'
   AND key_finding_excerpt IS NULL;

-- pubmed/29566852 (Levonorgestrel Intrauterine System (LNG-IUS) / Adenomyosis)
UPDATE sources
   SET key_finding_excerpt = 'This narrative review noted that the levonorgestrel-releasing intrauterine device was extremely effective in resolving abnormal uterine bleeding and reducing uterine volume in adenomyosis patients as part of long-term management. This was presented alongside other hormonal and nonhormonal off-label treatments (progestins such as dienogest, danazol, and norethindrone acetate, oral contraceptives, and GnRH analogues) used to control pain and abnormal uterine bleeding, since no drug is currently labelled specifically for adenomyosis.'
 WHERE id = '93666188-97d4-4f03-9977-b87a82d44a58'
   AND key_finding_excerpt IS NULL;

-- pubmed/34919250 (Myo-Inositol / PCOS)
UPDATE sources
   SET key_finding_excerpt = 'This study evaluated lean adolescent PCOS patients divided by age (13-16 and 17-19 years) treated for 3 months with either oral contraceptive pills (OCP), myo-Inositol (myo-Ins) alone, or OCP plus myo-Ins. In the 13-16 age group, myo-Ins alone produced a significant decrease in weight and BMI along with improved metabolic and hormonal parameters, representing an effective non-pharmacological treatment. In the 17-19 age group, myo-Ins combined with OCP prevented increases in weight and BMI, improved the metabolic profile, and strongly ameliorated hormonal parameters. The authors concluded that myo-Ins, alone or combined with OCP, represents a valid therapeutic option for improving metabolic and hormonal parameters in adolescent PCOS patients.'
 WHERE id = '50be03e5-13ff-4994-8bbd-120fa8aba40f'
   AND key_finding_excerpt IS NULL;

-- pubmed/34919250 (Drospirenone/Ethinylestradiol (combined Oral Contraceptive) / PCOS)
UPDATE sources
   SET key_finding_excerpt = 'This study evaluated lean adolescent PCOS patients (ages 13-19) treated for 3 months with drospirenone/ethinylestradiol oral contraceptive pills (OCP) alone, myo-Inositol alone, or the combination. In older teenagers aged 17-19, myo-Inositol combined with OCP prevented increases in weight and BMI, improved the metabolic profile, and strongly ameliorated hormonal parameters. In contrast, in younger teenagers aged 13-16, myo-Inositol alone (without OCP) produced significant decreases in weight and BMI and improved metabolic and hormonal parameters, suggesting age-dependent differences in the appropriate therapeutic approach.'
 WHERE id = 'f83c681e-069e-43ad-b013-1bca17eee39a'
   AND key_finding_excerpt IS NULL;

-- pubmed/18493713 (Levetiracetam / PMDD)
UPDATE sources
   SET key_finding_excerpt = 'This preliminary open-label prospective study screened 123 potential patients to enroll seven with DSM-IV-TR diagnosed PMDD, treated with levetiracetam starting at 250 mg qhs and titrated up to 1,500 mg bid over a 4-month treatment phase. Six of seven patients experienced a considerable decrease in Daily Record of Severity of Problems (DRSP) scores starting from the first treatment cycle, while one patient dropped out after one cycle due to lack of efficacy. The medication was fairly well tolerated, with unexpected benefits noted in food cravings and premenstrual headaches. The authors concluded levetiracetam could be effective for PMDD but noted that larger double-blind, placebo-controlled, randomized studies are warranted.'
 WHERE id = '34b8ad59-bdac-41e9-91d5-ca9461cabb5b'
   AND key_finding_excerpt IS NULL;

-- pubmed/24237190 (Chromium (supplementation) / PMDD)
UPDATE sources
   SET key_finding_excerpt = 'This study evaluated short-term chromium supplementation for menstrual cycle-related mood and physical symptoms, including PMDD, using two small samples: five women assessed under single-blind conditions and six women who completed a double-blind crossover trial comparing chromium plus placebo versus chromium plus sertraline. Treatments were given from mid-cycle to menses onset, with symptoms assessed via daily checklists, the HAM-D, and the CGI scale. Overall, chromium treatment was associated with reduced mood symptoms and improved overall health satisfaction in most participants, with some showing marked improvement on chromium alone and others benefiting more from chromium combined with an antidepressant than from either alone. The authors concluded these preliminary findings suggest chromium may be useful as monotherapy or adjunctive therapy, but noted larger controlled studies are needed.'
 WHERE id = 'dde98426-cd0e-4e06-8332-289a45720cdb'
   AND key_finding_excerpt IS NULL;

-- clinical_trial/NCT03480022 (Liraglutide / PCOS)
UPDATE sources
   SET key_finding_excerpt = 'This trial protocol described a planned double-blind, placebo-controlled 30-week study of liraglutide 3 mg versus placebo in non-diabetic obese women with PCOS, examining effects on body weight, body composition, hormonal and cardiometabolic parameters. The rationale cited that high-dose liraglutide produces significant weight reduction in obese women without PCOS, but noted limited data on its weight-loss efficacy specifically in non-diabetic PCOS patients. All participants were to receive diet and lifestyle counseling alongside the study drug or placebo. The text presented study design and background rationale only, without reporting outcome results.'
 WHERE id = '89b0335f-4f1b-4a69-a89a-1d97aaea86c2'
   AND key_finding_excerpt IS NULL;

-- clinical_trial/NCT01483118 (Cinnamon Extract / PCOS)
UPDATE sources
   SET key_finding_excerpt = 'This registered follow-up RCT (NCT01483118) was designed to determine whether cinnamon extract could restore menstrual cyclicity in PCOS patients with oligomenorrhea, and secondarily to confirm its effect on insulin resistance in a larger cohort. The study randomized patients on a controlled 1800-calorie diet to receive cinnamon extract pills or placebo three times daily for 6 months, tracking menstrual cycles and measuring insulin, glucose, and cholesterol before and after treatment. The protocol referenced the investigators'' own prior study showing that daily cinnamon use for 8 weeks decreased insulin resistance in women with PCOS, which motivated this larger trial to test effects on both insulin resistance and menstrual regularity. This source describes the trial design and rationale rather than reporting final outcome results.'
 WHERE id = 'ab9002e9-9072-4e50-87af-c5914d467b35'
   AND key_finding_excerpt IS NULL;

-- clinical_trial/NCT00611923 (Flutamide / PMDD)
UPDATE sources
   SET key_finding_excerpt = 'This was a randomized, placebo-controlled trial (NCT00611923) designed to evaluate whether flutamide, a medication that blocks testosterone and other mood-influencing hormones, could reduce symptoms of premenstrual dysphoric disorder (PMDD). The study protocol described a two-phase, 4-month design in which participants were randomly assigned to receive flutamide or placebo for 2 months following a 2-month symptom-tracking and screening phase. The source describes only the study design and rationale, including monitoring for side effects such as liver function, blood counts, and blood chemistry changes; no outcome data, effect sizes, or results comparing flutamide to placebo were reported in this text.'
 WHERE id = '907cb9b6-57b7-4cd5-919d-e8855604c2db'
   AND key_finding_excerpt IS NULL;

-- clinical_trial/NCT00927095 (Continuous Oral Contraceptive / PMDD)
UPDATE sources
   SET key_finding_excerpt = 'This clinical trial (NCT00927095) was designed to compare a low-dose oral contraceptive given continuously for three months against the same OC given in an interrupted 21/7 regimen and against continuous placebo, testing the hypothesis that continuous OC would be significantly more effective in reducing premenstrual symptoms of PMDD. The study noted that earlier controlled studies using the traditional 21/7 platform failed to find OCs superior to placebo, while two recent trials of a low-dose OC using a 24/4 platform reported greater symptom reductions than placebo, though with a substantial placebo response rate and low effect size. The trial also aimed to examine hormonal and neurosteroid changes underlying treatment response, as no prior studies had assessed steroid hormone levels in this context.'
 WHERE id = 'b0241889-d1d0-4cc7-8484-41145d1251a4'
   AND key_finding_excerpt IS NULL;

-- clinical_trial/NCT03749109 (Quinagolide / Endometriosis)
UPDATE sources
   SET key_finding_excerpt = 'This was a randomized, double-blind, placebo-controlled phase 2 proof-of-mechanism trial (NCT03749109) evaluating a quinagolide extended-release vaginal ring in women with endometrioma, deep infiltrating endometriosis, and/or adenomyosis. The trial aimed to assess reduction of lesions using high-resolution magnetic resonance imaging. No outcome data, effect sizes, or statistical results are provided in the source text.'
 WHERE id = 'ccbbfb47-32c0-42c5-84df-da269b4fc70b'
   AND key_finding_excerpt IS NULL;

-- clinical_trial/NCT03749109 (Quinagolide / Adenomyosis)
UPDATE sources
   SET key_finding_excerpt = 'This trial (NCT03749109) was designed as a randomized, double-blind, placebo-controlled phase 2 proof-of-mechanism study evaluating a quinagolide extended-release vaginal ring in women with endometrioma, deep infiltrating endometriosis, and/or adenomyosis. The primary outcome was reduction of lesions as assessed by high-resolution magnetic resonance imaging. The source describes the trial''s design and objective but does not report specific results or outcome data for the adenomyosis population.'
 WHERE id = 'ca61c6d6-0118-47cd-88eb-7ddeff7b790b'
   AND key_finding_excerpt IS NULL;

-- clinical_trial/NCT03598777 (Abobotulinumtoxina / Vulvodynia)
UPDATE sources
   SET key_finding_excerpt = 'This clinical trial (NCT03598777) was designed to define optimal doses of Dysport (abobotulinumtoxinA) and evaluate its efficacy and safety compared with placebo for the treatment of vulvodynia. The study design included a dose escalation stage (Stage 1) and a dose expansion stage (Stage 2), each comprising a double-blind period with a first treatment cycle of Dysport or placebo followed by an open-label treatment period. One or two doses identified as optimally safe and effective in Stage 1 were to be further investigated in Stage 2. The source describes the trial design only and does not report specific efficacy or safety outcomes.'
 WHERE id = 'd6631424-3118-4653-aed7-bf1aa8f6fb62'
   AND key_finding_excerpt IS NULL;

-- clinical_trial/NCT01301001 (Gabapentin / Vulvodynia)
UPDATE sources
   SET key_finding_excerpt = 'This was an 18-week, randomized, double-blind, placebo-controlled, two-treatment, two-period crossover trial (NCT01301001) enrolling 120 women aged 18 and older with provoked vulvodynia (PVD) reporting insertional dyspareunia and tenderness localized to the vulvar vestibule. The trial tested whether gabapentin (up to 3600 mg/d) reduced pain from tampon insertion (primary outcome) compared to placebo, with secondary outcomes including intercourse pain and 24-hour pain, measured via electronic daily diaries. The study also planned a mechanism-based analysis using capsaicin-induced allodynia/hyperalgesia, vaginal pressure algometry, tender point counts, and cardiovascular measures to characterize PVD subtypes and individualize treatment. Gabapentin was selected for its established efficacy in other neuropathic pain conditions, but no outcome results or effect sizes were reported in this source.'
 WHERE id = '71249321-a6e4-4155-b148-6f151171575c'
   AND key_finding_excerpt IS NULL;

-- pubmed/35037089 (GnRH Agonists (e.g., Leuprolide, Triptorelin) / Adenomyosis)
UPDATE sources
   SET key_finding_excerpt = 'This systematic review, searching MEDLINE, Embase, Cochrane Library, CENTRAL and ClinicalTrials.gov for studies published 2010-2020, found that GnRH analogues, along with LNG-IUS and dienogest, were effective in reducing pain, uterine volume and menstrual bleeding in patients with adenomyosis. However, the authors noted these data were largely obtained outside of trial settings and were limited by issues including patient selection, short treatment duration, small sample sizes, and limited long-term safety and effectiveness data. The review concluded that despite better evidence for GnRH analogues compared to other agents, well-designed randomized controlled trials are still needed.'
 WHERE id = '7422ab1b-f200-40f0-9fc4-2a3fcd0d4190'
   AND key_finding_excerpt IS NULL;

-- pubmed/27577677 (Vaginal Estrogen / Perimenopause & Menopause)
UPDATE sources
   SET key_finding_excerpt = 'This Cochrane systematic review update included 30 RCTs (6235 women) comparing intra-vaginal oestrogenic preparations (rings, creams, tablets) with each other and with placebo for treating vaginal atrophy symptoms in postmenopausal women. Low-quality evidence showed no significant difference in symptom improvement among the various vaginal oestrogen formulations, but each preparation outperformed placebo—e.g., oestrogen ring vs. placebo (OR 12.67, 95% CI 3.23–49.66, n=67), oestrogen tablets vs. placebo (OR 12.47, 95% CI 9.81–15.84 fixed-effect, n=1638), and oestrogen cream vs. placebo (OR 4.10, 95% CI 1.88–8.93, n=198). Oestrogen cream was associated with a higher proportion of increased endometrial thickness compared to the oestrogen ring (OR 0.36, 95% CI 0.14–0.94, n=273), possibly due to higher cream doses, though overall adverse event rates did not differ significantly between preparations.'
 WHERE id = '74e278b8-6de1-4976-ab03-0ace23125281'
   AND key_finding_excerpt IS NULL;

-- pubmed/35037089 (Levonorgestrel Intrauterine System (LNG-IUS) / Adenomyosis)
UPDATE sources
   SET key_finding_excerpt = 'This systematic review of randomized controlled trials and observational studies published between 2010 and 2020 found that LNG-IUS was effective in reducing pain, uterine volume, and menstrual bleeding in patients with adenomyosis. However, the authors noted that much of this evidence was obtained in non-trial settings and was limited by patient selection issues, short treatment duration, small sample sizes, and insufficient long-term safety and effectiveness data. The review concluded that while LNG-IUS had better supporting evidence compared to other interventions, well-designed randomized controlled trials were still needed.'
 WHERE id = '833cfa3d-3d31-410d-be55-76cf2b5de54d'
   AND key_finding_excerpt IS NULL;

-- pubmed/29384406 (Micronized Progesterone (oral) / Perimenopause & Menopause)
UPDATE sources
   SET key_finding_excerpt = 'An international expert panel, based on a systematic literature review of menopausal hormone therapy (MHT) containing micronized progesterone, evaluated its impact on breast cancer risk in postmenopausal women. The panel concluded that estrogens combined with oral (approved) or vaginal (off-label) micronized progesterone did not increase breast cancer risk for treatment durations of up to 5 years. However, limited evidence suggested that oral micronized progesterone combined with estrogens for more than 5 years was associated with increased breast cancer risk, and the panel recommended that counseling on combined MHT address breast cancer risk alongside other modifiable and non-modifiable risk factors.'
 WHERE id = 'e7715e2c-d207-4453-83af-ee61d88321eb'
   AND key_finding_excerpt IS NULL;

-- pubmed/35037089 (Dienogest / Adenomyosis)
UPDATE sources
   SET key_finding_excerpt = 'A systematic review of studies published between 2010 and 2020, searching MEDLINE, Embase, Cochrane Library, CENTRAL, and ClinicalTrials.gov, evaluated pharmacological interventions for adenomyosis. The review found that dienogest, along with LNG-IUS and GnRH analogues, was effective in reducing pain, uterine volume, and menstrual bleeding. However, the authors noted that most of this evidence came from non-trial settings and was limited by issues such as patient selection bias, short treatment duration, small sample sizes, and insufficient long-term safety and effectiveness data.'
 WHERE id = 'f1edc276-44bf-4e51-a718-2b2e59332ed8'
   AND key_finding_excerpt IS NULL;

-- pubmed/33124017 (Dienogest / Adenomyosis)
UPDATE sources
   SET key_finding_excerpt = 'This review reported that in areas where it is marketed, the progestin dienogest appears superior to combined oral contraceptives for treatment of adenomyosis. The source noted that most available evidence for adenomyosis therapies focuses on outcomes such as heavy menstrual bleeding, painful menses, and pelvic pain, while data on fertility outcomes, sexual function, and quality of life remain lacking.'
 WHERE id = '6ada099f-a19c-40a3-80ba-34e930b1f101'
   AND key_finding_excerpt IS NULL;

-- pubmed/29566852 (Dienogest / Adenomyosis)
UPDATE sources
   SET key_finding_excerpt = 'This narrative review reported that dienogest, along with other progestins such as danazol and norethindrone acetate, has an antiproliferative and anti-inflammatory effect that supports its use in the medical management of adenomyosis, primarily to control pain symptoms. The authors noted that no drug is currently labelled specifically for adenomyosis, and dienogest is used off-label based on the condition''s pathogenetic mechanisms involving sex steroid hormone aberrations, impaired apoptosis, and increased inflammation. No specific clinical trial data, sample sizes, or effect sizes for dienogest were presented in this review.'
 WHERE id = 'bb93ebf0-3dc7-4080-95ed-82b963b2fe3c'
   AND key_finding_excerpt IS NULL;

-- pubmed/33124017 (GnRH Agonists (e.g., Leuprolide, Triptorelin) / Adenomyosis)
UPDATE sources
   SET key_finding_excerpt = 'This narrative review found that long-acting gonadotropin-releasing hormone agonists are effective for adenomyosis and should be considered second-line therapy, following the levonorgestrel-releasing intrauterine system as first-line treatment. The authors noted that use of GnRH agonists is limited by hypogonadal effects. The review did not provide specific numerical efficacy data for this drug class.'
 WHERE id = '97330c69-9e26-4edd-ae8a-7eacff1ebe86'
   AND key_finding_excerpt IS NULL;

-- pubmed/29566852 (GnRH Agonists (e.g., Leuprolide, Triptorelin) / Adenomyosis)
UPDATE sources
   SET key_finding_excerpt = 'This review noted that gonadotropin-releasing hormone analogues are among the hormonal treatments currently used off-label to control pain symptoms and abnormal uterine bleeding in adenomyosis, though no drug is formally labelled for this condition. Specifically, the authors reported that GnRH analogues are indicated before fertility treatments to improve the chances of pregnancy in infertile women with adenomyosis. This use is grounded in the pathogenetic rationale of correcting sex steroid hormone aberrations underlying the disease.'
 WHERE id = 'c88cd581-f317-43ab-969e-f48a7aac369e'
   AND key_finding_excerpt IS NULL;

-- reddit/PMDD (Progesterone (bioidentical/supplemental) / PMDD)
UPDATE sources
   SET key_finding_excerpt = 'A Reddit post titled "Progesterone pills completely changed everything" indicated that a user reported a strongly positive personal experience with progesterone pills in the context of PMDD. No further details, numerical findings, or study design information were provided in the source text.'
 WHERE id = '32907201-8d9c-415d-b79a-d56bed0ba412'
   AND key_finding_excerpt IS NULL;

-- pubmed/33124671 (Chinese Herbal Medicine (CHM) Formulations / Endometriosis)
UPDATE sources
   SET key_finding_excerpt = 'This narrative review, which searched PubMed and Clinicaltrials.gov for natural therapies in endometriosis, identified Chinese herbal medicine (CHM) as one of three categories of plant-derived treatment strategies under investigation. The authors reported that numerous studies suggest CHM is a good choice for endometriosis management, and that under clinical conditions this approach has been shown to decrease the size of endometriotic lesions, alleviate chronic pelvic pain, and reduce postoperative recurrence rates. No specific numerical effect sizes or individual study designs for CHM were detailed in the source.'
 WHERE id = 'c9828df3-a5f5-4df0-ba28-4ad73a043425'
   AND key_finding_excerpt IS NULL;

-- pubmed/36000243 (GnRH Antagonists (e.g., Elagolix, Relugolix) / Endometriosis)
UPDATE sources
   SET key_finding_excerpt = 'This narrative review, based on a literature search in PubMed and Embase, discussed GnRH antagonists as one of the latest pharmacological advances in endometriosis management. The authors noted that most studies have focused on evaluating the efficacy and safety of GnRH antagonists, used together with add-back therapy in cases of prolonged treatment. The review''s expert opinion recommended that GnRH antagonists should be used as second-line treatment options in selected cases, specifically for patients who are non-responders to first-line treatments.'
 WHERE id = 'bbcb5885-fac0-43a0-a597-576ff52a2bd3'
   AND key_finding_excerpt IS NULL;

-- reddit/endometriosis (Testosterone / Endometriosis)
UPDATE sources
   SET key_finding_excerpt = 'A Reddit poster in the r/endometriosis community reported that testosterone "cured" their endometriosis. No further details, dosing information, timeframe, or clinical measures were provided in the source text.'
 WHERE id = '0b196583-a779-4e13-b346-409628aaa5d5'
   AND key_finding_excerpt IS NULL;

-- reddit/Menopause (Testosterone (topical/compounded) / Perimenopause & Menopause)
UPDATE sources
   SET key_finding_excerpt = 'A Reddit user reported that after 1 year of hormone replacement therapy including testosterone, their severe osteoporosis had reversed. This was a single individual''s self-reported experience shared in a menopause-focused community, not a controlled study, and no additional details on dosing, formulation, or measurement methods were provided.'
 WHERE id = '7d24fe42-32a8-492a-8179-32d664332c1f'
   AND key_finding_excerpt IS NULL;

-- reddit/PCOS (Metformin / PCOS)
UPDATE sources
   SET key_finding_excerpt = 'A Reddit poster reported being told they could not be prescribed Metformin because they did not want children. No other details, outcomes, or clinical data regarding Metformin''s effect on PCOS were provided in the source.'
 WHERE id = '86ff457b-a861-4372-9dd2-75a0a25888c4'
   AND key_finding_excerpt IS NULL;

-- reddit/Menopause (Vaginal Estradiol Cream / Perimenopause & Menopause)
UPDATE sources
   SET key_finding_excerpt = 'A Reddit poster expressed frustration that vaginal estrogen is not being used as the first-line approach for UTI prevention, arguing it should be prioritized in this role. No further details, data, or personal outcomes were provided in the source text regarding effect sizes or study design.'
 WHERE id = '3d4eccbf-cf95-46e6-9653-ac606171ec72'
   AND key_finding_excerpt IS NULL;

-- pubmed/39724866 (GnRH Antagonists (e.g., Elagolix, Relugolix) / Endometriosis)
UPDATE sources
   SET key_finding_excerpt = 'This narrative review, prioritizing RCTs, systematic reviews, meta-analyses, and guidelines, recommended switching to gonadotropin-releasing hormone agonists and antagonists without delay when first-line agents (safest estrogen-progestogen combinations and progestogen monotherapies) fail in the medical treatment of established endometriosis. The review reported that two-thirds of symptomatic endometriosis patients can be managed satisfactorily for many years using existing safe, effective, and well-tolerated medications, of which GnRH antagonists represent a subsequent therapeutic option after first-line failure.'
 WHERE id = '6f25c85f-2c34-4ae5-ba11-c0606a50a912'
   AND key_finding_excerpt IS NULL;

-- pubmed/39724866 (Very-Low-Dose Combined Oral Contraceptives (estradiol-Based) / Endometriosis)
UPDATE sources
   SET key_finding_excerpt = 'This narrative review, prioritizing RCTs, systematic reviews, meta-analyses, and international guidelines, reported that very-low-dose combined oral contraceptives can be used for years as a primary prevention measure to counteract the increased risk of ovarian cancer observed in patients with endometriosis. The authors noted this approach can effectively integrate with targeted risk-reducing surgery to save lives. The review also indicated that tertiary medical therapy of established endometriosis is based initially on the safest available estrogen-progestogen combinations and progestogen monotherapies, with ethinyl estradiol avoided when possible due to thromboembolic risk, and noted that estradiol can be administered transdermally. Overall, the authors concluded that two-thirds of symptomatic endometriosis patients can be managed satisfactorily for many years using existing safe, effective, and well-tolerated medications when applied with the right modality.'
 WHERE id = '894b0e26-a215-4e7d-bb2d-1766c0c0a3d8'
   AND key_finding_excerpt IS NULL;

-- pubmed/28828592 (Levonorgestrel Intrauterine System (Mirena) / Depot Medroxyprogesterone Acetate (Depo-Provera) / Etonogestrel Implant (Implanon) / Endometriosis)
UPDATE sources
   SET key_finding_excerpt = 'This review noted that existing long-acting drug delivery systems originally designed for contraception have found use in treating endometriosis. Specifically, it identified long-acting implantable contraceptives such as Implanon and injectables such as Depo-Provera as having been used for this purpose. The source also mentioned intrauterine systems generally, among existing delivery platforms that deliver progestins for symptomatic relief, though it did not provide specific data on Mirena for endometriosis.'
 WHERE id = '29f8e01e-cbe8-49d7-9fa4-b6e4c95c1adf'
   AND key_finding_excerpt IS NULL;

-- reddit/Menopause (CBD Oil (medical Grade) / Perimenopause & Menopause)
UPDATE sources
   SET key_finding_excerpt = 'A Reddit poster reported that CBD oil helped their menopause symptoms. The post did not specify which symptoms were affected, dosage, or the degree of improvement, nor did it provide any comparative or quantitative detail.'
 WHERE id = '6a917e8e-3a50-4775-9387-c06a0adf3e96'
   AND key_finding_excerpt IS NULL;

-- pubmed/36000243 (Selective Progesterone Receptor Modulators (SPRMs) / Endometriosis)
UPDATE sources
   SET key_finding_excerpt = 'This narrative review discussed selective progesterone receptor modulators (SPRMs) as one of several emerging pharmacological approaches for endometriosis, alongside GnRH antagonists and SERMs, based on a literature search of PubMed and Embase. The authors noted that most research attention has focused on GnRH antagonists, positioning them as second-line treatments for non-responders to first-line therapy, while the review did not report specific efficacy or safety data for SPRMs. The authors concluded that further studies are needed to identify the ideal treatment for women with endometriosis.'
 WHERE id = '6723820a-2527-41a9-9f8a-793ca0232898'
   AND key_finding_excerpt IS NULL;

-- reddit/Menopause (Vaginal Estradiol Cream / Perimenopause & Menopause)
UPDATE sources
   SET key_finding_excerpt = 'A Reddit poster in a menopause-related community expressed regret over delaying use of vaginal estrogen cream, implying it provided meaningful symptom relief. The post did not include specific details on dosage, duration of use, or particular symptoms treated.'
 WHERE id = '28f0a415-da0c-4020-9615-c156f06f811f'
   AND key_finding_excerpt IS NULL;

-- pubmed/38854774 (Selective Progesterone Receptor Modulators (SPRMs) / Endometriosis)
UPDATE sources
   SET key_finding_excerpt = 'This review article synthesized findings from previously published experimental studies and clinical trials on progesterone resistance in endometriosis, identifying dysregulated progesterone receptor (PR) expression as a primary driver of treatment failure with hormonal therapies. The authors reported that selective estrogen/progesterone receptor modulators have emerged as novel therapeutic approaches for endometriosis, offering potential improvements in overcoming progesterone resistance. However, the review concluded that concerns and limitations persist despite these newly developed drugs, warranting further research into new therapeutic targets to address hormonal treatment failure in endometriosis.'
 WHERE id = '3498eb2c-2bf9-4137-8cda-2965d4d4a37b'
   AND key_finding_excerpt IS NULL;

-- pubmed/18220493 (Sertraline / PMDD)
UPDATE sources
   SET key_finding_excerpt = 'This review noted that selective serotonin re-uptake inhibitors, a class that includes sertraline, have demonstrated efficacy for PMDD, with three SSRIs holding FDA-approved indications for the disorder. The source explained that due to PMDD''s unique pathophysiology, these SSRIs can be effectively administered intermittently, dosed only during the luteal phase (the 2 weeks prior to menses) rather than continuously. The text did not report specific numerical outcomes for sertraline alone.'
 WHERE id = '279d1d8a-cf88-4b3c-9734-b8ec96f49136'
   AND key_finding_excerpt IS NULL;

-- pubmed/16734319 (Spironolactone / PMDD)
UPDATE sources
   SET key_finding_excerpt = 'This review noted that spironolactone is among the agents used off label to treat premenstrual symptoms, alongside oral contraceptives, though it lacks an FDA indication for PMDD, unlike three selective serotonin reuptake inhibitors that do carry this indication. The source did not provide specific efficacy data, sample sizes, or trial results for spironolactone itself, instead focusing on emerging evidence for drospirenone-containing oral contraceptives as effective PMDD treatments.'
 WHERE id = '0b878bdc-f5ab-4044-bece-448acf39388a'
   AND key_finding_excerpt IS NULL;

-- pubmed/33124017 (Levonorgestrel Intrauterine System (LNG-IUS) / Adenomyosis)
UPDATE sources
   SET key_finding_excerpt = 'This narrative review reported that the levonorgestrel-releasing intrauterine system appears to be the most effective first-line therapy for adenomyosis, based on its efficacy compared with oral agents, maintenance of steady-state hormonal levels, and contraceptive benefit. The review noted that most available evidence for adenomyosis treatments, including LNG-IUS, focuses on outcomes of heavy menstrual bleeding, painful menses, and pelvic pain, while data on fertility outcomes, sexual function, and quality of life remain lacking. No approved medical therapy exists for adenomyosis, and evidence is limited overall due to challenges in nonhistologic diagnosis and frequent concomitant gynecologic conditions.'
 WHERE id = '464690af-554e-4a5f-adb5-7ef06daa7d96'
   AND key_finding_excerpt IS NULL;

-- pubmed/35797481 (Estrogen (systemic HRT) / Perimenopause & Menopause)
UPDATE sources
   SET key_finding_excerpt = 'The 2022 NAMS Position Statement, developed by an expert Advisory Panel reviewing updated literature, concluded that hormone therapy remains the most effective treatment for vasomotor symptoms and genitourinary syndrome of menopause, and has been shown to prevent bone loss and fracture. The statement found that for women younger than 60 years or within 10 years of menopause onset without contraindications, the benefit-risk ratio is favorable for treating bothersome VMS and preventing bone loss, whereas initiating therapy more than 10 years after menopause onset or after age 60 was associated with a less favorable benefit-risk ratio due to greater absolute risks of coronary heart disease, stroke, venous thromboembolism, and dementia. Risks were noted to vary by hormone type, dose, duration, route of administration, timing of initiation, and progestogen use, supporting individualized treatment with periodic reevaluation.'
 WHERE id = '7b55485c-cbb2-4e9a-a1d2-e053cae04b93'
   AND key_finding_excerpt IS NULL;

-- pubmed/15162347 (AbobotulinumtoxinA (aboBoNT-A) / Vulvodynia)
UPDATE sources
   SET key_finding_excerpt = 'A case report described a patient with refractory vulvodynia and severe dyspareunia who had failed standard therapies such as antidepressants, anticonvulsants, biofeedback, and pelvic floor physical therapy. The authors successfully managed this case using a novel combined approach of botulinum toxin A and surgery. No specific dosing, effect size, or follow-up duration was reported in the source.'
 WHERE id = '1919119f-b681-4400-a202-400dac7dd965'
   AND key_finding_excerpt IS NULL;

-- pubmed/34970669 (Myo-Inositol / PCOS)
UPDATE sources
   SET key_finding_excerpt = 'This narrative review synthesized evidence, predominantly from randomized controlled trials, systematic reviews, and meta-analyses, on nutrient supplementation and complementary therapies for PCOS. The review identified inositols, among other vitamins, vitamin-like nutrients, minerals, and formulations, as potentially beneficial in PCOS. However, the authors noted that areas of uncertainty and key limitations in the literature remain before such therapies can be integrated into routine clinical practice.'
 WHERE id = '28a35b3a-05b8-4c34-9e01-b92f1875e3b1'
   AND key_finding_excerpt IS NULL;

-- pubmed/33260918 (Myo-Inositol / PCOS)
UPDATE sources
   SET key_finding_excerpt = 'This review examined literature on inositols in PCOS, identifying 197 articles through Sept. 2020, including 47 clinical trials (35 randomized controlled trials). The authors reported that myo-inositol (MI) treatment improved ovarian function and fertility, decreased severity of hyperandrogenism (including acne and hirsutism), positively affected metabolic aspects, and modulated hormonal parameters involved in reproductive axis function and ovulation in PCOS patients. The review concluded that MI, D-chiro-inositol, and their combination in a physiological ratio of 40:1, with or without other compounds, could be beneficial for improving metabolic, hormonal, and reproductive aspects of PCOS.'
 WHERE id = '15d70608-d8a0-4fe7-bc29-bdde200aa27a'
   AND key_finding_excerpt IS NULL;

-- pubmed/36614868 (Myo-Inositol / PCOS)
UPDATE sources
   SET key_finding_excerpt = 'This systematic literature review examined non-hormonal pharmacological treatments for menstrual irregularities in adolescents with PCOS, screening 265 studies with 164 eligible for evaluation, though only four placebo-controlled studies were identified. Myo-inositol was included among supplements evaluated (alongside chromium picolinate) for effects on menstrual frequency, and the review found that supplements, along with metformin (1500-2550 mg/day) and GLP-1-analogues, were effective in regulating menstrual cycles in adolescents diagnosed with PCOS. However, metformin was identified as the most effective and cost-efficient option overall, particularly in overweight adolescent girls.'
 WHERE id = '1330114f-bf8d-44a0-95aa-d7be6726b985'
   AND key_finding_excerpt IS NULL;

-- pubmed/36614868 (Metformin / PCOS)
UPDATE sources
   SET key_finding_excerpt = 'This systematic literature review (2265 studies identified, 164 evaluated, covering January 1998 to September 2022) examined non-hormonal pharmacological treatments for menstrual irregularities in adolescents with PCOS, with only four placebo-controlled studies identified. The review found that metformin, at dosages of 1500-2550 mg/day, was effective in regulating menstrual cycles in this population. The authors concluded that metformin was the most effective and cost-efficient option specifically in overweight adolescent girls with PCOS, also demonstrating beneficial effects on insulin sensitivity, particularly when oral contraceptives were contraindicated or poorly tolerated.'
 WHERE id = '7e6c737c-22c8-458c-a82e-27e0a8d561f8'
   AND key_finding_excerpt IS NULL;

-- pubmed/35181044 (Metformin / PCOS)
UPDATE sources
   SET key_finding_excerpt = 'This review identified Metformin as one of the established medications used in the symptomatic management of PCOS, alongside oral contraceptives and antiandrogens. The review noted that current interventions, including Metformin, are unable to fully address the outcomes of this syndrome, prompting discussion of newer insulin sensitizers such as Inositols, GLP-1 agonists, DPP-4 inhibitors, and SGLT2 inhibitors as emerging alternatives or adjuncts.'
 WHERE id = 'a9018fea-37f4-47c1-b542-e11baa480830'
   AND key_finding_excerpt IS NULL;

-- pubmed/35054768 (GLP-1 Receptor Agonists (e.g., Liraglutide, Exenatide) / PCOS)
UPDATE sources
   SET key_finding_excerpt = 'This review examined repurposed medications for PCOS by searching PubMed for pathogenesis/management literature and ClinicalTrials.gov for repurposing data. Glucose-like peptide-1 receptor agonists were identified among several drug classes (alongside HMG-CoA reductase inhibitors, thiazolidinediones, SGLT-2 inhibitors, DPP-4 inhibitors, mucolytic agents, and some supplements) with supporting data for repurposing in PCOS. However, the authors noted that clinical trials on these repurposed PCOS medications, including this class, were few in number, had low population sizes, and were mostly without completed results, indicating a need for further well-designed clinical trials.'
 WHERE id = '3cb0c7be-4db5-4e30-859c-a1d9840921f4'
   AND key_finding_excerpt IS NULL;

-- pubmed/35181044 (GLP-1 Receptor Agonists (e.g., Liraglutide, Exenatide) / PCOS)
UPDATE sources
   SET key_finding_excerpt = 'This narrative review identified Glucagon-like peptide-1 (GLP-1) agonists as one of the newer insulin sensitizers being explored as novel therapeutic modalities for PCOS management, alongside Inositols, DPP-4 inhibitors, and SGLT2 inhibitors. The review noted that current standard interventions, such as Metformin, oral contraceptives, and antiandrogens, are unable to fully address PCOS outcomes, framing GLP-1 agonists as part of emerging pharmacotherapeutic options. No specific numerical findings, effect sizes, or study designs regarding GLP-1 agonists in PCOS were provided in the source.'
 WHERE id = '8085ad96-6915-4fd5-a573-bc8e649b9af0'
   AND key_finding_excerpt IS NULL;

-- pubmed/36614868 (GLP-1 Receptor Agonists (e.g., Liraglutide, Exenatide) / PCOS)
UPDATE sources
   SET key_finding_excerpt = 'This systematic literature review examined non-hormonal pharmacological treatments for menstrual irregularities in adolescents with PCOS, screening 265 studies (164 eligible, with only four placebo-controlled) published between 1998 and 2022. GLP-1 receptor agonists were identified among the evaluated off-label treatment options, alongside metformin, thiazolidinediones, anti-androgen agents, and supplements. The review concluded that GLP-1-analogues, along with metformin and certain supplements, were effective in regulating menstrual cycles in adolescents diagnosed with PCOS, though metformin (1500-2550 mg/day) was noted as the most effective and cost-efficient option specifically in overweight adolescent girls.'
 WHERE id = '94ed6418-044b-4b8d-92c0-14707f4ee3d2'
   AND key_finding_excerpt IS NULL;

-- pubmed/35054768 (SGLT2 Inhibitors (e.g., Empagliflozin, Dapagliflozin) / PCOS)
UPDATE sources
   SET key_finding_excerpt = 'This review on PCOS pathogenesis and repurposed medications identified sodium-glucose cotransporter-2 inhibitors, alongside HMG-CoA reductase inhibitors, thiazolidinediones, dipeptidyl peptidase-4 inhibitors, glucose-like peptide-1 receptor agonists, mucolytic agents, and certain supplements, as having supporting data for repurposing in PCOS management. The authors noted that clinical trials on these PCOS repurposed medications, including SGLT2 inhibitors, are few, have low study populations, and are mostly without reported results. They concluded that further research and well-designed clinical trials are needed on this subject.'
 WHERE id = 'c18ab34c-db03-4689-9fc0-089d9b2004ad'
   AND key_finding_excerpt IS NULL;

-- pubmed/35181044 (SGLT2 Inhibitors (e.g., Empagliflozin, Dapagliflozin) / PCOS)
UPDATE sources
   SET key_finding_excerpt = 'This review article identified SGLT2 inhibitors as one of several novel insulin-sensitizing therapeutic modalities being explored for PCOS management, alongside Inositols, GLP-1 agonists, and DPP-4 inhibitors. The source did not provide specific numerical findings, effect sizes, or study design details regarding SGLT2 inhibitors in PCOS, but grouped them among emerging pharmacotherapeutic interventions intended to address insulin resistance in the syndrome.'
 WHERE id = 'dc1a9cf4-7b0b-423a-9016-af64411acc22'
   AND key_finding_excerpt IS NULL;

-- pubmed/35054768 (Statins (HMG-CoA Reductase Inhibitors) / PCOS)
UPDATE sources
   SET key_finding_excerpt = 'This review identified HMG-CoA reductase inhibitors (statins) among medications with supporting data for repurposing in PCOS, alongside thiazolidinediones, SGLT-2 inhibitors, DPP-4 inhibitors, GLP-1 receptor agonists, and mucolytic agents. The authors noted that PCOS pathogenesis involves internal factors such as insulin resistance, hyperandrogenism, inflammation, oxidative stress, and obesity, which repurposed medications like statins may target. However, the review emphasized that there are few completed clinical trials, generally with low participant numbers and often lacking reported results, on these repurposed PCOS medications, underscoring the need for further well-designed clinical trials.'
 WHERE id = '6b852f6a-3e17-4617-815e-36e5a68dd57d'
   AND key_finding_excerpt IS NULL;

-- pubmed/35181044 (Statins (HMG-CoA Reductase Inhibitors) / PCOS)
UPDATE sources
   SET key_finding_excerpt = 'This review article discussed statins as one of several emerging therapies for PCOS management, alongside newer insulin sensitizers (Inositols, GLP-1 agonists, DPP-4 inhibitors, SGLT2 inhibitors), vitamin D, and Letrozole. The source identified statins as part of the evidence base for novel pharmacotherapeutic approaches to PCOS but did not provide specific numerical findings, effect sizes, or study design details regarding statin use in this condition.'
 WHERE id = '88b792d8-31af-489e-a26b-b7d326c3a0ab'
   AND key_finding_excerpt IS NULL;

-- pubmed/34970669 (Vitamin D / PCOS)
UPDATE sources
   SET key_finding_excerpt = 'This narrative review synthesized evidence from randomized controlled trials, systematic reviews, and meta-analyses on nutrient supplementation and complementary therapies in PCOS. The authors reported that specific vitamins, including vitamin D, may be beneficial for women with PCOS, who tend to be nutrient deficient in many common vitamins and minerals. However, the review noted that areas of uncertainty and key limitations remain in the literature that must be addressed before such therapies can be integrated into routine clinical practice.'
 WHERE id = '6fceb89a-87c2-4bf7-bb59-335e7c9c3bd5'
   AND key_finding_excerpt IS NULL;

-- pubmed/35181044 (Vitamin D / PCOS)
UPDATE sources
   SET key_finding_excerpt = 'This review identified vitamin D as one of several emerging therapies for PCOS management, alongside statins and Letrozole. The source did not provide specific numerical findings, effect sizes, or study design details regarding vitamin D''s efficacy in PCOS, characterizing it broadly as part of the evolving therapeutic landscape for the condition.'
 WHERE id = '216e3742-324f-41e3-bdca-25b54db43d31'
   AND key_finding_excerpt IS NULL;

-- pubmed/28096785 (Vitamin D / PCOS)
UPDATE sources
   SET key_finding_excerpt = 'This review examined nutrients, including vitamin D, that may influence the hormonal and metabolic disturbances associated with PCOS, a condition characterized by infertility, menstrual dysfunction, and hyperandrogenism, and often linked to hyperlipidemia and impaired glucose tolerance. The authors noted evidence supporting that such nutrients may affect these disturbances in PCOS patients. However, the source provided did not include specific numerical findings, effect sizes, or study design details regarding vitamin D''s effects on PCOS.'
 WHERE id = '006649e9-4a82-4bd4-9853-ebcb2e7bc5b3'
   AND key_finding_excerpt IS NULL;

-- pubmed/18389090 (Drospirenone/Ethinyl Estradiol (24/4 Regimen) / PMDD)
UPDATE sources
   SET key_finding_excerpt = 'The source described drospirenone 3 mg/ethinyl estradiol 20 microg in a 24/4 dosing regimen (24 active days followed by 4 inactive days) as a novel oral contraceptive formulation combining a low-dose estrogen with the progestin drospirenone. It was noted as the only hormonally based contraceptive regimen supported by large, randomized, controlled trials demonstrating efficacy for premenstrual dysphoric disorder (PMDD), in contrast to traditional oral contraceptives, which do not generally improve PMS/PMDD symptoms such as mood alterations, irritability, and depression. Based on this evidence, the formulation received FDA approval not only for pregnancy prevention but also specifically for PMDD and moderate acne vulgaris.'
 WHERE id = 'dcef96c4-9fe2-49df-bb04-c7650bfa1425'
   AND key_finding_excerpt IS NULL;

-- pubmed/18220493 (Drospirenone/Ethinyl Estradiol (24/4 Regimen) / PMDD)
UPDATE sources
   SET key_finding_excerpt = 'The source identified a low-dose oral contraceptive containing the progestin drospirenone, in a new 24/4 dosing regimen, as one of two treatment approaches with an FDA-approved indication for PMDD (alongside selective serotonin re-uptake inhibitors). This option was noted as demonstrating efficacy for PMDD and as particularly suited for women who also desire hormonal contraception. The article did not report specific trial data, effect sizes, or sample sizes for this regimen.'
 WHERE id = 'cf29525c-2e0f-4e50-adef-f336f1fbb9f5'
   AND key_finding_excerpt IS NULL;

-- pubmed/16734319 (Drospirenone/Ethinyl Estradiol (24/4 Regimen) / PMDD)
UPDATE sources
   SET key_finding_excerpt = 'The source reported that a drospirenone-containing oral contraceptive formulation administered for 24 days in a 28-day cycle (the 24/4 regimen) was shown to be effective in treating PMDD. This built on prior studies demonstrating that OCs containing the novel progestin drospirenone reduced premenstrual symptoms in many women, in contrast to earlier OC formulations for which controlled trial data had been inconsistent. The source noted that OCs, including this drospirenone-containing formulation, are used off-label alongside SSRIs (which hold FDA approval), spironolactone, GnRH agonists, and alprazolam for managing premenstrual symptoms.'
 WHERE id = 'bfc859b5-3755-4f9a-9897-f1dfb279ddd5'
   AND key_finding_excerpt IS NULL;

-- pubmed/39724866 (GnRH Agonists (e.g., Leuprolide, Triptorelin) / Adenomyosis)
UPDATE sources
   SET key_finding_excerpt = 'This narrative review addressed medical treatment of endometriosis and adenomyosis, discussing pharmacological approaches across primary, secondary, and tertiary prevention. It recommended that switching to gonadotropin-releasing hormone agonists and antagonists should not be delayed when first-line agents (estrogen-progestogen combinations and progestogen monotherapies) fail. The review did not report specific numerical findings, effect sizes, or trial data isolating GnRH agonist use specifically for adenomyosis.'
 WHERE id = '84d3523e-a355-4c08-800b-6b63d162577c'
   AND key_finding_excerpt IS NULL;

-- pubmed/33124017 (GnRH Antagonists (oral, E.g., Elagolix, Relugolix, Linzagolix) / Adenomyosis)
UPDATE sources
   SET key_finding_excerpt = 'This narrative review noted that oral gonadotropin-releasing hormone antagonists have limited evidence in adenomyosis, stating that "additional data regarding oral gonadotropin-releasing hormone antagonists are required." This contrasted with long-acting GnRH agonists, which the review described as effective and worthy of consideration as second-line therapy, though limited by hypogonadal effects. No specific efficacy data, trial design, or numerical outcomes for oral GnRH antagonists in adenomyosis were provided.'
 WHERE id = 'b91f0687-ae81-4c65-9c67-d00b41109412'
   AND key_finding_excerpt IS NULL;

-- pubmed/40069979 (GnRH Antagonists (oral, E.g., Elagolix, Relugolix, Linzagolix) / Adenomyosis)
UPDATE sources
   SET key_finding_excerpt = 'The source, a commentary on reproductive aging and uterine preservation, described oral GnRH antagonists with add-back therapy as a promising strategy for stabilizing the uterus while controlling symptoms of hormonally driven conditions such as adenomyosis. It noted this approach has been used in long-term regimens with 104 weeks'' follow-up. The article did not provide specific efficacy statistics, sample sizes, or trial design details for this drug-condition pair, framing it instead within a broader concept of "uterine freezing" to delay uterine aging and preserve reproductive potential.'
 WHERE id = '201e4740-f8c7-4532-88de-9e4be96edbe9'
   AND key_finding_excerpt IS NULL;

-- pubmed/33124017 (Aromatase Inhibitors (e.g., Letrozole, Anastrozole) / Adenomyosis)
UPDATE sources
   SET key_finding_excerpt = 'This narrative review reported that aromatase inhibitors demonstrated improvement in heavy menstrual bleeding and pelvic pain in adenomyosis. However, the authors noted that further research is needed to determine their specific role in the management of adenomyosis, indicating the evidence base remains limited.'
 WHERE id = 'cba1f95f-d85b-4ce2-9e62-2665701b7568'
   AND key_finding_excerpt IS NULL;

-- pubmed/29566852 (Aromatase Inhibitors (e.g., Letrozole, Anastrozole) / Adenomyosis)
UPDATE sources
   SET key_finding_excerpt = 'This narrative review noted that no drug is currently labelled for adenomyosis, and that current treatments (NSAIDs, progestins, oral contraceptives, GnRH analogues, levonorgestrel-releasing IUD) are used off-label. Based on new findings on pathogenetic mechanisms, the authors identified aromatase inhibitors as among the new drugs under development for adenomyosis treatment, alongside selective progesterone receptor modulators, valproic acid, and anti-platelet therapy. No specific efficacy data, trial design, or outcome measures for aromatase inhibitors in adenomyosis were reported.'
 WHERE id = '1f7d4ef4-8b2c-42af-842a-e21d4e0f5e51'
   AND key_finding_excerpt IS NULL;

-- pubmed/39672080 (Aromatase Inhibitors (e.g., Letrozole, Anastrozole) / Adenomyosis)
UPDATE sources
   SET key_finding_excerpt = 'A symposium opinion paper (First Lugano Adenomyosis Workshop) reported that pre-treatment with a gonadotrophin-releasing hormone agonist, with or without an aromatase inhibitor, in frozen embryo transfer cycles for patients with adenomyosis "seems promising." However, the authors noted that many issues related to this therapy remain unanswered, and no specific efficacy data, effect sizes, or trial outcomes were provided.'
 WHERE id = '4c315074-3761-440a-bdbd-0769055d7122'
   AND key_finding_excerpt IS NULL;

-- pubmed/33124017 (Selective Progesterone Receptor Modulators (SPRMs, E.g., Ulipristal Acetate, Mifepristone) / Adenomyosis)
UPDATE sources
   SET key_finding_excerpt = 'This narrative review noted that progesterone receptor modulators may have a role in the treatment of adenomyosis if released again to market with appropriate safety parameters. No specific efficacy data, effect sizes, or study designs for these agents in adenomyosis were provided in the source. The review otherwise emphasized that no approved medical therapy exists for adenomyosis and evidence remains limited overall.'
 WHERE id = 'cfa9f8f5-3046-4d5a-bc29-5ed88af6248f'
   AND key_finding_excerpt IS NULL;

-- pubmed/29566852 (Selective Progesterone Receptor Modulators (SPRMs, E.g., Ulipristal Acetate, Mifepristone) / Adenomyosis)
UPDATE sources
   SET key_finding_excerpt = 'This narrative review noted that no drug is currently labelled for adenomyosis and that existing hormonal and nonhormonal treatments are used off-label, with selective progesterone receptor modulators identified as being under development as a new drug for the treatment of adenomyosis based on new findings on the condition''s pathogenetic mechanisms. The source grouped SPRMs alongside aromatase inhibitors, valproic acid, and anti-platelet therapy as emerging candidate treatments, but did not provide specific efficacy data, study design, or numerical findings for SPRMs in adenomyosis.'
 WHERE id = '98edfdf7-f26f-4063-a555-d73afde5d18b'
   AND key_finding_excerpt IS NULL;

-- pubmed/29566852 (Danazol / Adenomyosis)
UPDATE sources
   SET key_finding_excerpt = 'This review discussed danazol as one of several progestin-based agents (alongside dienogest and norethindrone acetate) used off-label in the medical management of adenomyosis. The authors noted an antiproliferative and anti-inflammatory effect of these agents that supports their use mainly to control pain symptoms in adenomyosis. No specific numerical outcomes, trial data, or effect sizes for danazol were reported in this source.'
 WHERE id = 'ae0293df-22a6-4706-95d7-88dfbc35b866'
   AND key_finding_excerpt IS NULL;

-- pubmed/29566852 (Combined Oral Contraceptives (estrogen-Progestogen) / Adenomyosis)
UPDATE sources
   SET key_finding_excerpt = 'This narrative review noted that oral contraceptives, along with other hormonal treatments such as progestins and GnRH analogues, are currently used off-label to control pain symptoms and abnormal uterine bleeding in adenomyosis. No drug is officially labelled for adenomyosis and no specific guidelines exist, but medical treatments including oral contraceptives were described as effective in improving symptoms such as pain, abnormal uterine bleeding, and infertility. The rationale for their use was based on adenomyosis pathogenetic mechanisms involving sex steroid hormone aberrations, impaired apoptosis, and increased inflammation.'
 WHERE id = 'ca3bc2f4-fc5b-4f4d-a460-b181efeeb033'
   AND key_finding_excerpt IS NULL;

-- pubmed/33124017 (Combined Oral Contraceptives (estrogen-Progestogen) / Adenomyosis)
UPDATE sources
   SET key_finding_excerpt = 'This narrative review reported that no approved medical therapy exists for adenomyosis and that evidence for treatment options remains limited. The authors noted that in areas where it is marketed, the progestin dienogest appears superior to combined oral contraceptives for managing adenomyosis, positioning combined oral contraceptives as a less effective option relative to dienogest. The levonorgestrel-releasing intrauterine system was described as the most effective first-line therapy compared with oral agents generally.'
 WHERE id = '8d60ac79-622e-4323-9d5d-d7703e2d986d'
   AND key_finding_excerpt IS NULL;

-- pubmed/26358173 (Testosterone (transdermal) / Perimenopause & Menopause)
UPDATE sources
   SET key_finding_excerpt = 'This review reported that the primary indication for testosterone prescription in women is loss of sexual desire, and noted its widespread off-label or compounded use despite no approved formulation for this purpose. Observational studies indicated favorable cardiovascular effects on surrogate outcomes, and no adverse cardiovascular effects were seen in studies of transdermal testosterone therapy in women. Clinical trials cited in the review suggested that exogenous testosterone enhances cognitive performance and improves musculoskeletal health in postmenopausal women, though the authors noted that associations between endogenous testosterone and cardiovascular disease/mortality risk remain unestablished.'
 WHERE id = '19619f25-69f8-4d05-aaa2-56985db64e3a'
   AND key_finding_excerpt IS NULL;

-- pubmed/34674962 (Testosterone (transdermal) / Perimenopause & Menopause)
UPDATE sources
   SET key_finding_excerpt = 'This review reported that androgen therapy, though understudied and underutilized, has shown improvement in postmenopausal hypoactive sexual desire disorder (HSDD) and the genitourinary syndrome of menopause (GSM). The authors noted a lack of commercially available testosterone preparations formulated specifically for women in most countries, leading to off-label use of male formulations and under-regulated compounded therapies. Beyond HSDD and GSM, testosterone likely influences the brain, breast, cardiovascular, and musculoskeletal systems, but these effects remain poorly studied. The authors concluded that further research is needed to clarify the risks and benefits of testosterone therapy in this population.'
 WHERE id = '5769feb7-059a-44e3-bc81-20d6b90c98dc'
   AND key_finding_excerpt IS NULL;

-- pubmed/39283289 (Estetrol (E4) / Perimenopause & Menopause)
UPDATE sources
   SET key_finding_excerpt = 'This review described estrogen E4 as a natural estrogen with tissue-specific effects due to selective activation of nuclear ERα, and noted that its application in hormone replacement therapy (HRT) is undergoing late-stage clinical development. The authors reported that E4 shows minimal interaction with hepatic cytochrome P450 enzymes, giving it a favorable pharmacokinetic profile and reduced potential for drug-drug interactions. Studies cited in the review demonstrated that E4 has a lower impact on hemostatic and metabolic parameters compared to other estrogens, potentially reducing risks such as thromboembolic events or dyslipidemia commonly associated with hormonal therapies.'
 WHERE id = '9ff2d43c-3845-4af5-a064-8d629c770072'
   AND key_finding_excerpt IS NULL;

-- pubmed/37076317 (NKB Receptor Antagonists (NK3R Antagonists) / Perimenopause & Menopause)
UPDATE sources
   SET key_finding_excerpt = 'This review described how the neurokinin B (NKB) signaling pathway, linked to the median preoptic nucleus (MnPO), plays a central role in mediating postmenopausal vasomotor symptoms (VMS), which affect over 75% of postmenopausal women and last an average of seven years (10% experience symptoms for more than a decade). While menopausal hormone therapy (MHT) remains efficacious and cost-effective, it is not suitable for all women, such as those at increased risk of breast cancer or gynaecological malignancy. The review examined data from the latest clinical trials of novel therapeutic agents that antagonize NKB signaling as an alternative approach for VMS, alongside neuroendocrine changes occurring with menopause drawn from animal and human studies.'
 WHERE id = 'c557729d-303a-456f-bf61-180f4f6b7b93'
   AND key_finding_excerpt IS NULL;

-- pubmed/22281161 (Estrogen (systemic HRT) / Perimenopause & Menopause)
UPDATE sources
   SET key_finding_excerpt = 'This review reported that hormone replacement therapy with estrogen counteracts the weight gain and accumulation of abdominal fat associated with the menopausal transition. The authors noted that estrogen generally inhibits food intake, in contrast to progesterone and testosterone, which may stimulate appetite. This was presented as part of a broader discussion of sex hormones'' roles in appetite regulation and obesity in women, rather than as findings from a specific clinical trial with reported effect sizes.'
 WHERE id = '6ccb1617-9431-4a22-bf41-ed99e021d8bb'
   AND key_finding_excerpt IS NULL;

-- pubmed/37365881 (Drospirenone / PMDD)
UPDATE sources
   SET key_finding_excerpt = 'This Cochrane review included five RCTs (858 women analyzed, most diagnosed with PMDD) comparing combined oral contraceptives containing drospirenone and ethinylestradiol (EE) with placebo. Drospirenone plus EE may improve overall premenstrual symptoms (SMD -0.41, 95% CI -0.59 to -0.24; 2 RCTs, N=514; low-quality evidence) and functional impairment in productivity, social activities, and relationships, with effects rated small to moderate; it may also improve response rate (OR 1.65, 95% CI 1.13-2.40; 1 RCT, N=449). However, drospirenone plus EE may increase trial withdrawal due to adverse effects (OR 3.41, 95% CI 2.01-5.78; 4 RCTs, N=776) and overall adverse effects (OR 2.31, 95% CI 1.71-3.11; 3 RCTs, N=739), including likely more breast pain and possibly more nausea, intermenstrual bleeding, and menstrual disorder, with no serious adverse events like venous thromboembolism reported. The authors concluded that drospirenone/EE may improve functionally impairing premenst'
 WHERE id = '38627757-6608-4b42-b81d-3a7dd9926c8d'
   AND key_finding_excerpt IS NULL;

-- pubmed/40140889 (Azithromycin / Endometriosis)
UPDATE sources
   SET key_finding_excerpt = 'This in vitro and in vivo study found that azithromycin (AZM), tested as a senolytic drug, reduced the viable fraction of ovarian endometriosis cyst-derived stromal cells (CSCs), which exhibited stronger cellular senescence markers than normal or eutopic endometrial stromal cells (P < 0.001). AZM also suppressed IL-6 expression, a senescence-associated secretory phenotype (SASP) factor, in CSC culture supernatants (P < 0.05). In a murine endometriosis model, AZM administration reduced endometriotic lesion volume compared to vehicle (P < 0.05), along with decreased proliferative activity (Ki67, P < 0.01), IL-6 expression (P < 0.001), and fibrosis (P < 0.001) within lesions. The authors concluded that AZM may be useful for preventing endometriosis progression by suppressing IL-6 secretion as a SASP factor.'
 WHERE id = '34107636-65b8-4869-9dd7-db1ed7391f22'
   AND key_finding_excerpt IS NULL;

-- pubmed/30085525 (Metformin / PCOS)
UPDATE sources
   SET key_finding_excerpt = 'This source, a general review of metformin''s clinical indications, identified polycystic ovary syndrome (PCOS) as one of the medication''s recognized off-label uses, specifically for both treating and preventing the condition. No study design, effect sizes, or specific outcome data related to metformin''s use in PCOS were provided in this text.'
 WHERE id = '4c151ecd-653b-434d-a1a5-ef9cb867fc6c'
   AND key_finding_excerpt IS NULL;

-- pubmed/36755918 (Metformin / PCOS)
UPDATE sources
   SET key_finding_excerpt = 'In a letrozole plus high-fat diet-induced PCOS mouse model, metformin treatment (200 mg/kg/day for 28 days) significantly reduced body weight, restored the estrous cycle, and improved glucose tolerance and insulin resistance compared to untreated PCOS model mice. Morphologically, metformin reduced polycystic ovarian lesions and restored ovarian function, with elevated SIRT3 and GPX4 expression and reversal of the reduced p-mTOR and p-AMPK expression seen in the model group. The authors concluded that metformin improves ovarian dysfunction in PCOS mice by regulating ferroptosis via the SIRT3/AMPK/mTOR pathway.'
 WHERE id = '07e9694d-79fd-4af9-9784-5aa99ecb63c2'
   AND key_finding_excerpt IS NULL;

-- pubmed/18472980 (Drospirenone/Ethinyl Estradiol (24/4 Regimen) / PMDD)
UPDATE sources
   SET key_finding_excerpt = 'This review examined placebo-controlled, randomized studies testing the clinical efficacy and tolerability of ethinylestradiol/drospirenone (EE/drospirenone) combined oral contraceptive for treating PMDD. The authors reported that results from these trials evaluating EE/drospirenone in PMDD treatment were encouraging, though further studies were deemed necessary. The reported clinical efficacy and relatively good tolerability of the formulation were noted as potentially contributing to widening the therapeutic options available for PMDD.'
 WHERE id = 'f45eba04-bcc3-4c44-a25d-1241a188dc3b'
   AND key_finding_excerpt IS NULL;

-- pubmed/21072278 (Drospirenone/Ethinyl Estradiol (24/4 Regimen) / PMDD)
UPDATE sources
   SET key_finding_excerpt = 'This review reported that a 24/4 oral contraceptive formulation containing drospirenone and 20 μg ethinyl estradiol was found effective for PMDD in randomized double-blind placebo-controlled trials using established symptom scales, improving both somatic and affective/behavioral symptoms. Multiple studies showed this drospirenone-containing OC was safe, without adverse effects on carbohydrate metabolism, lipids, blood pressure, weight, serum potassium, or thrombotic risk compared to other low-dose OCs, and it also improved acne, hirsutism, and fluid retention. Open-label studies noted good patient compliance and satisfaction, but the authors noted a significant placebo effect in blinded trials and called for additional large randomized placebo-controlled trials to confirm efficacy.'
 WHERE id = '297c8950-fd75-4fe5-84a1-d065c92bd706'
   AND key_finding_excerpt IS NULL;

-- pubmed/38091917 (Sertraline / PMDD)
UPDATE sources
   SET key_finding_excerpt = 'This study examined 32 women with PMDD and 38 controls, measuring serum neuroactive steroids across menstrual cycle phases and during luteal-phase sertraline treatment (50 mg from ovulation to menses onset) in the PMDD group. Within the PMDD group, sertraline treatment significantly increased serum pregnanolone levels and the pregnanolone:progesterone ratio, and significantly decreased 3α,5α-androsterone. The authors noted this was the first study to assess SSRI treatment''s impact on peripheral GABAergic neuroactive steroid levels in PMDD, and called for future placebo-controlled research to further examine these metabolic pathway alterations.'
 WHERE id = '39e181ff-aaf4-4695-b04a-6afd511447e7'
   AND key_finding_excerpt IS NULL;

-- pubmed/12753573 (Venlafaxine / PMDD)
UPDATE sources
   SET key_finding_excerpt = 'In an open-label study, 30 Asian (ethnic Taiwanese) women with PMDD were treated with flexible-dose venlafaxine for two menstrual cycles, with 20 patients completing the trial. All patients showed significant improvement in mood and behavior components on the PRISM calendar, with effects apparent by the first active treatment cycle. Venlafaxine, at a mean dose of 60.1 ± 29.1 mg per day, was reported to be effective in reducing PMDD symptoms in this population.'
 WHERE id = 'ece772d4-e5c8-44cb-ba6e-6f20b474d2cc'
   AND key_finding_excerpt IS NULL;

-- pubmed/18472980 (Spironolactone / PMDD)
UPDATE sources
   SET key_finding_excerpt = 'This review mentioned spironolactone only briefly, noting it as one of several pharmacologic options—alongside selective serotonin reuptake inhibitors, anxiolytic agents, and gonadotropin-releasing hormone agonists—that have been studied for treating severe PMS and PMDD. The source did not provide specific efficacy data, trial results, or numerical findings for spironolactone itself, as the review''s primary focus was on evaluating the combination of ethinylestradiol and drospirenone for PMDD treatment.'
 WHERE id = '8a4e0d19-aca6-455a-b346-816aeaf03569'
   AND key_finding_excerpt IS NULL;

-- pubmed/41456646 (GnRH Agonists (e.g., Leuprolide, Triptorelin) / Adenomyosis)
UPDATE sources
   SET key_finding_excerpt = 'This study used single-cell RNA sequencing and spatial transcriptomics to profile 15 participants, including 11 adenomyosis patients (three untreated, eight treated with GnRHa) and four controls, to evaluate GnRHa''s cellular effects. Untreated adenomyosis showed prominent immune-inflammatory signatures, including elevated CD4+ T cells and LYVE1+ macrophages, contributing to a pro-angiogenic microenvironment, and this inflammatory and angiogenic activity was partially mitigated by GnRHa therapy. However, ciliated epithelial cell enrichment in ectopic endometrial glands persisted following GnRHa treatment. The authors concluded that GnRHa exerts therapeutic effects through normalization of immune cell composition and restoration of epithelial-stromal interaction.'
 WHERE id = 'de63a9ea-521a-4e81-8740-f0eb037bf6c1'
   AND key_finding_excerpt IS NULL;

-- pubmed/40684257 (AbobotulinumtoxinA (aboBoNT-A) / Vulvodynia)
UPDATE sources
   SET key_finding_excerpt = 'This prospective, non-masked, non-randomized study of 35 vulvodynia patients receiving BoNT/A injections and 35 healthy controls examined whether pelvic floor muscle (PFM) surface electromyography (sEMG) characteristics could predict treatment response. Vulvodynia patients showed lower intensity during contractions (P = .003) and altered intramuscular coupling during contractions (P = .004) and rest (P = .006) in the superficial PFM, and altered intermuscular coupling during contractions (P = .004) in the deep PFM, compared to healthy women. Intramuscular coupling at rest was significantly associated with response to BoNT/A treatment (P < .01), and when combined with clinical information it predicted treatment response with high accuracy (AUC = 0.95), suggesting sEMG data can improve prediction of BoNT/A treatment outcomes in vulvodynia.'
 WHERE id = 'e9047903-da9c-4ab0-8fc7-53fe166b2945'
   AND key_finding_excerpt IS NULL;

-- pubmed/17847765 (5-Aminolevulinic Acid (ALA) Photodynamic Therapy / Vulvodynia)
UPDATE sources
   SET key_finding_excerpt = 'In a study of 11 patients, ALA-based photodynamic therapy was delivered via a bioadhesive patch over 4 hours, followed by red light (630 nm, 100 J/cm²) treatment of vulvar regions affected by vulvodynia. The treatment produced a significant reduction in overall symptoms (p=0.0077), with 8 of 11 patients showing a symptomatic response and 3 showing no improvement; no significant improvement in pain during intercourse was observed (p=0.1088). No adverse reactions or symptom worsening were reported, and the authors concluded PDT may be a viable option to conventional approaches, pending larger studies.'
 WHERE id = '8eb41ae3-b288-42f0-bb5e-9f2c381ef6e3'
   AND key_finding_excerpt IS NULL;

-- pubmed/34800616 (Lidocaine (mucoadhesive Thin Film Delivery) / Vulvodynia)
UPDATE sources
   SET key_finding_excerpt = 'This preclinical formulation study developed mucoadhesive, biodissolvable cellulose-based thin films (using HEC, HPC, or HPMC polymers) designed to deliver lidocaine locally to the vulvar vestibule for treatment of vestibulodynia (VBD), a pain disorder causing sexual pain in women. Two optimized formulations were created to meet distinct clinical use cases: a rapid-release HEC film (~5 min release, for use prior to intercourse) and a prolonged-release HPC film (~120 min release, for sustained relief), with release governed by a diffusion mechanism influenced by polymer type, drug loading, and film thickness. In vivo testing in BALB/c mice demonstrated the films were safe and biocompatible, and pharmacokinetic analysis confirmed lidocaine was delivered primarily to the vaginal tissue, supporting feasibility of this delivery approach for local vulvar lidocaine administration.'
 WHERE id = '1a916b24-42df-4c73-b074-52a6d3b7ddbc'
   AND key_finding_excerpt IS NULL;

-- pubmed/32491666 (Escitalopram / Perimenopause & Menopause)
UPDATE sources
   SET key_finding_excerpt = 'This source, an overview of escitalopram''s clinical applications, noted that escitalopram is used off-label for the management of vasomotor symptoms associated with menopause, alongside other off-label uses such as social anxiety disorder, OCD, panic disorder, PTSD, and premenstrual dysphoric disorder. The text did not provide specific efficacy data, effect sizes, or study details for this menopause-related use, instead focusing broadly on the drug''s mechanism of action, FDA-approved indications, adverse effects, and drug interactions.'
 WHERE id = '4b9972b1-586c-4916-ac22-d3a369e3fc5a'
   AND key_finding_excerpt IS NULL;

-- clinical_trial/NCT01304589 (Milnacipran / Vulvodynia)
UPDATE sources
   SET key_finding_excerpt = 'This was an 18-week, open-label, flexible-dose "proof of concept" trial designed to determine the efficacy of milnacipran in reducing pain in women with provoked vestibulodynia (PVD). Eligible patients were treated with milnacipran at up to 200 mg/d (or the maximum tolerated dose) following a 2-week washout and 2-week baseline period, then a 6-week dose-escalation phase and a 12-week stable-dose phase. The study also aimed to assess whether associated PVD symptoms—psychological distress, sexual function, physical function, and quality of life—correlated with reductions in vulvar pain, though no outcome results were reported in this text.'
 WHERE id = 'f4a3950c-8fd3-490f-b98e-eee47829ec89'
   AND key_finding_excerpt IS NULL;

-- reddit/PMDD (Wellbutrin (bupropion) / PMDD)
UPDATE sources
   SET key_finding_excerpt = 'A Reddit poster reported that Wellbutrin (bupropion) helped their PMDD. No further details, dosage, or timeframe were provided in the source text.'
 WHERE id = '166c26f5-e5f5-43ca-956d-54123176bf15'
   AND key_finding_excerpt IS NULL;

-- reddit/PMDD (Magnesium (various Forms Including Glycinate) / PMDD)
UPDATE sources
   SET key_finding_excerpt = 'A Reddit user reported personal experience using magnesium along with a small amount of DHEA for PMDD, stating "I think it worked!" This was an individual, self-reported account rather than a controlled study, with no specific dosages, timeframes, or measured outcomes provided beyond the user''s subjective impression of improvement.'
 WHERE id = '3a29ab48-5cd2-4906-8cbe-5f8980b17c5a'
   AND key_finding_excerpt IS NULL;

-- reddit/PMDD (Progesterone (bioidentical/supplemental) / PMDD)
UPDATE sources
   SET key_finding_excerpt = 'A Reddit user reported that supplemental progesterone ("progesterone boost") led to PMDD symptoms becoming "almost non-existent." This was an individual, anecdotal account with no study design, sample size, or quantitative data provided.'
 WHERE id = '4a64f213-8fc4-4cb1-8b0b-bea5399b1138'
   AND key_finding_excerpt IS NULL;

-- reddit/PCOS (Inositol (Myo-Inositol / D-Chiro-Inositol) / PCOS)
UPDATE sources
   SET key_finding_excerpt = 'A Reddit user with PCOS reported that Myo Inositol made them "more beautiful," but no specific symptoms, outcomes, dosages, or other details were provided in the source.'
 WHERE id = '5b84f198-fe05-47f5-88eb-810c4dd9de15'
   AND key_finding_excerpt IS NULL;

-- reddit/PCOS (Metformin / PCOS)
UPDATE sources
   SET key_finding_excerpt = 'A Reddit user with PCOS reported that metformin "changed my life," indicating a strongly positive personal experience with the drug. No specific symptoms, metrics, dosage, or timeframes were mentioned in the post.'
 WHERE id = '7820edf0-78b5-4424-a9d7-54705e9ef0b6'
   AND key_finding_excerpt IS NULL;

-- reddit/PCOS (Metformin / PCOS)
UPDATE sources
   SET key_finding_excerpt = 'A user in a PCOS-related Reddit post reported that metformin "worked a little too well for me," suggesting a strong perceived effect, though no specific symptoms, measurements, or outcomes were described in the source text.'
 WHERE id = '163e4008-1724-468d-bd7c-32f467a11394'
   AND key_finding_excerpt IS NULL;

-- reddit/PCOS (GLP-1 Receptor Agonists (Ozempic/semaglutide, Mounjaro/tirzepatide, Wegovy, Victoza/liraglutide) / PCOS)
UPDATE sources
   SET key_finding_excerpt = 'A USA Today article referenced in the Reddit post reported that women with PCOS said they finally found a treatment that worked, though the article''s focus was on insurance coverage issues rather than clinical findings. The canonical source does not specify which GLP-1 receptor agonist was used, nor does it provide study design details, sample sizes, or numerical effect data. No specific drug name, dosage, or quantitative outcome for PCOS was included in the text provided.'
 WHERE id = 'fe30b13c-a863-4e91-acb3-bec851f7b32f'
   AND key_finding_excerpt IS NULL;

-- reddit/Perimenopause (Creatine / Perimenopause & Menopause)
UPDATE sources
   SET key_finding_excerpt = 'A Reddit user reported that creatine had no effect on brain fog at standard dosing during perimenopause, but noted improvement only after drastically increasing the dosage. The post was anecdotal, with no specific dosage amounts, timeframes, or effect sizes provided, and the user asked whether others had a similar experience.'
 WHERE id = 'e64ed18e-f5c9-4281-aee2-49393c409c99'
   AND key_finding_excerpt IS NULL;

-- reddit/Menopause (Magnesium Glycinate / Perimenopause & Menopause)
UPDATE sources
   SET key_finding_excerpt = 'A Reddit user reported that magnesium glycinate helped their menopause symptoms. The post did not specify which symptoms improved, provide dosage information, or describe the timeframe of use. No additional details, effect sizes, or study design were included in the source text.'
 WHERE id = '3946e60d-bd9d-4575-b7c7-d2df49435b10'
   AND key_finding_excerpt IS NULL;

-- reddit/Menopause (Vaginal Estradiol Cream / Perimenopause & Menopause)
UPDATE sources
   SET key_finding_excerpt = 'A Reddit user reported that vaginal estrogen resolved their bladder issues. No further details, study design, sample size, or numerical findings were provided in the source text.'
 WHERE id = '6706f213-7507-4680-8d5e-26a735b859b5'
   AND key_finding_excerpt IS NULL;

-- reddit/vulvodynia (Diazepam (Valium) Suppositories / Vulvodynia)
UPDATE sources
   SET key_finding_excerpt = 'A Reddit user in the vulvodynia community posted a warning describing their personal experience with vaginal diazepam (Valium) suppositories. The post title indicated a cautionary account rather than a positive outcome, though no further details, symptoms, or specific effects were provided in the source text. No dosage, timeframe, or quantitative outcome information was included.'
 WHERE id = '83989329-ec88-464b-ab65-864b511f2fa1'
   AND key_finding_excerpt IS NULL;

-- reddit/PelvicFloor (Duloxetine (Cymbalta) / Vulvodynia)
UPDATE sources
   SET key_finding_excerpt = 'A Reddit user in r/PelvicFloor reported that Cymbalta (duloxetine) made their symptoms worse. No further details, numerical findings, or study context were provided in the source.'
 WHERE id = '60fbb30a-5d4d-42ea-8125-87400e0875c4'
   AND key_finding_excerpt IS NULL;

-- pubmed/34431079 (Pentoxifylline / Endometriosis)
UPDATE sources
   SET key_finding_excerpt = 'This Cochrane systematic review update included five parallel-design RCTs (415 women total) assessing pentoxifylline for endometriosis. Compared to placebo, evidence was very low-quality and uncertain regarding clinical pregnancy rate (RR 1.38, 95% CI 0.91 to 2.10; 3 RCTs, n=285), recurrence rate (RR 0.84, 95% CI 0.30 to 2.36; 1 RCT, n=121), and miscarriage rate (Peto OR 1.99, 95% CI 0.20 to 19.37; 2 RCTs, n=164). Compared to no treatment, one RCT (n=34) found no significant difference in overall pain at one, two, or three months (e.g., MD -1.60, 95% CI -3.32 to 0.12 at three months). No trials reported live birth rate, and the authors concluded there is currently insufficient evidence to support pentoxifylline''s use for endometriosis-related subfertility or pain relief.'
 WHERE id = '0bb93c46-42d8-4951-b7bd-d49c55fa6e9e'
   AND key_finding_excerpt IS NULL;

-- pubmed/31718828 (Rosiglitazone / PCOS)
UPDATE sources
   SET key_finding_excerpt = 'A prospective randomized controlled trial compared metformin, rosiglitazone, and their combination in 204 obese Chinese women with PCOS and insulin resistance (68 on metformin 1,500 mg/day, 67 on rosiglitazone 4 mg/day, 69 on combined metformin 1,000 mg/day plus rosiglitazone 4 mg/day) over 6 months. After treatment, most participants showed improved menstrual patterns along with significant decreases in acne scores, weight, BMI, waist circumference, waist-to-hip ratio, and serum testosterone, with metabolic indexes of insulin, carbohydrates, and lipids improved across all groups. While metformin (1,500 mg/day) produced greater weight reductions, rosiglitazone users—whether alone or combined with low-dose metformin—showed a more notable decline in total cholesterol and triglyceride levels, leading the authors to recommend rosiglitazone (alone or with low-dose metformin) plus lifestyle modification for PCOS patients with abnormal lipid profiles.'
 WHERE id = '0fe335f2-38cb-4b77-b186-40b017757f89'
   AND key_finding_excerpt IS NULL;

-- pubmed/19619148 (Botulinum Toxin A (Botox, 20 IU) / Vulvodynia)
UPDATE sources
   SET key_finding_excerpt = 'This randomized, double-blinded, placebo-controlled trial evaluated Botox (20 IU injected into the musculus bulbospongiosus) versus saline placebo in 64 women with vestibulodynia, with 60 (94%) completing 6-month follow-up. Both groups showed significant pain reduction on the VAS (P < 0.001), but there was no significant difference between Botox and placebo at 6 months (P = 0.984), and no significant difference in FSFI improvement (P = 0.635). The placebo group actually showed significantly greater reduction in sexual distress than the Botox group (P = 0.044), and no significant between-group differences were found in SF-36 quality of life scores. The authors concluded that 20 IU Botox injection does not reduce pain, improve sexual functioning, or impact quality of life compared to placebo in women with vestibulodynia.'
 WHERE id = '50f350d1-c545-491b-abdd-928c3acd2d64'
   AND key_finding_excerpt IS NULL;

-- pubmed/19619148 (AbobotulinumtoxinA (aboBoNT-A) / Vulvodynia)
UPDATE sources
   SET key_finding_excerpt = 'This randomized, double-blinded, placebo-controlled trial (N=64, 60 completing 6-month follow-up) evaluated Botulinum toxin A (20 I.E.) injected into the musculus bulbospongiosus versus saline placebo for vestibulodynia. Both groups showed significant pain reduction (P<0.001), but there was no significant difference in VAS pain scores between Botox and placebo at 6 months (P=0.984), and no significant difference in FSFI improvement (P=0.635). The placebo group actually showed a significantly larger reduction in sexual distress than the Botox group (P=0.044), with no significant differences in SF-36 quality of life scores. The authors concluded that 20 I.E. Botox injection did not reduce pain, improve sexual functioning, or impact quality of life compared to placebo at 3 and 6 months follow-up.'
 WHERE id = '60906299-ace3-4e84-8115-3c2dad0eac80'
   AND key_finding_excerpt IS NULL;

-- pubmed/27459523 (Pavinetant / PCOS)
UPDATE sources
   SET key_finding_excerpt = 'This double-blind, double-dummy, placebo-controlled phase 2 trial evaluated AZD4901 (pavinetant), a neurokinin-3 receptor antagonist, in women aged 18-45 with PCOS (67 randomized, 65 evaluable). At the 80 mg/day dose, day 7 results showed a 52.0% reduction in LH area under the curve (95% CI, 29.6-67.3%), a 28.7% reduction in total testosterone concentration (95% CI, 13.9-40.9%), and a reduction of 3.55 LH pulses per 8 hours (95% CI, 2.0-5.1), all with nominal P < .05 relative to placebo. The authors concluded that NK3 receptor antagonism with AZD4901 specifically reduced LH pulse frequency and subsequent LH and testosterone concentrations, presenting a potential approach to treating the central neuroendocrine pathophysiology of PCOS.'
 WHERE id = 'd6aa7818-a1d3-41d1-ba15-ab1cb5f7a12b'
   AND key_finding_excerpt IS NULL;

-- pubmed/21782166 (Raloxifene / PCOS)
UPDATE sources
   SET key_finding_excerpt = 'This double-blind, randomized superiority trial compared raloxifene to clomiphene citrate (CC) for inducing ovulation in women with PCOS and ovulatory dysfunction (n=82; CC n=40, raloxifene n=42). Ovulation rates by ultrasound were 21 of 40 with CC versus 17 of 42 with raloxifene, and by progesterone levels were 16 of 40 with CC versus 11 of 42 with raloxifene, with no statistically significant differences between groups. No serious adverse events occurred in either group, and the authors concluded there was no significant difference in ovulation between raloxifene and CC in this population.'
 WHERE id = 'df0d3c82-78ba-4d30-bf77-ab961c1c3f44'
   AND key_finding_excerpt IS NULL;

-- pubmed/36614868 (Spironolactone / PCOS)
UPDATE sources
   SET key_finding_excerpt = 'This systematic literature review (covering studies from January 1998 to September 2022) identified spironolactone as one of several non-hormonal, off-label anti-androgen agents used to treat menstrual irregularities in adolescents with PCOS, alongside finasteride and flutamide. However, the review noted that only a few of the identified treatments partly demonstrated beneficial effects on improving menstrual frequency, and the summary of effective therapies for regulating menstrual cycles highlighted metformin, GLP-1 analogues, and supplements rather than spironolactone specifically. The source did not report specific efficacy data or outcomes for spironolactone in this population.'
 WHERE id = '24c6fafd-cac5-4592-a277-ddc7de28566e'
   AND key_finding_excerpt IS NULL;

-- reddit/endometriosis (Meloxicam / Endometriosis)
UPDATE sources
   SET key_finding_excerpt = 'A Reddit user posting to an endometriosis-focused community described meloxicam as "a miracle drug and no one is talking about it." No further details, dosing information, or specific outcomes were provided in the source text.'
 WHERE id = '14b43925-156b-4860-a326-322a487e2d63'
   AND key_finding_excerpt IS NULL;

COMMIT;

-- Verification query (run after COMMIT). Expected: high percentage of
-- free-text sources now have a key_finding_excerpt.
--
--   SELECT source_type, COUNT(*) AS total,
--          COUNT(key_finding_excerpt) AS with_excerpt
--     FROM sources
--    WHERE source_type IN ('pubmed', 'clinical_trial', 'reddit')
--    GROUP BY source_type;
