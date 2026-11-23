# Search Log

**Search date:** 2026-10-31  
**Review:** Noesis evidence review v1.0  
**Raw records:** `docs/research/records/`  
**Screening table:** `docs/research/analysis/screening_reviews.csv`

All counts are point-in-time. A later run will differ.

---

## 1. PubMed scoping searches

| Query | Hits | Retrieved | Saved file |
|---|---:|---:|---|
| cct | 2,951 | 300 | `pubmed_cct.json` |
| neurofeedback | 639 | 300 | `pubmed_neurofeedback.json` |
| ave | 102 | 102 | `pubmed_ave.json` |
| multimodal | 256 | 255 | `pubmed_multimodal.json` |
| adhd | 217 | 217 | `pubmed_adhd.json` |
| older | 1,092 | 300 | `pubmed_older.json` |
| safety | 817 | 298 | `pubmed_safety.json` |
| engagement | 258 | 258 | `pubmed_engagement.json` |
| transfer | 62 | 62 | `pubmed_transfer.json` |
| clinical | 1,196 | 300 | `pubmed_clinical.json` |
| **Total** | **7,590** | **2,392** | `pubmed_summary.json` |

The 300-record cap was a first-pass limit. It was not used as the review denominator.

## 2. Complete PubMed review corpus

| Query | Hits | Retrieved | Saved file |
|---|---:|---:|---|
| Initial modality block AND (`systematic review[pt] OR meta-analysis[pt]`) | 997 | 997 | `pubmed_reviews_full.json` |
| Expanded modality block AND (`systematic review[pt] OR meta-analysis[pt]`) | 1,495 | 1,495 | `pubmed_reviews_expanded.json` |

The expanded set is the denominator for the umbrella review. The initial 997-review query omitted working-memory training, cognitive stimulation/rehabilitation, serious games and VR-cognitive terms; this was detected during screening and corrected (D10). The initial file is retained as an intermediate record.

## 3. OpenAlex

| Layer | Records | Note |
|---|---:|---|
| Citation chasing, 8 seed PMIDs | 112 | 7 seeds matched; 100-record cap per seed |
| Keyword searches, 4 terms | 400 | 387 unique titles |
| **Total OpenAlex** | **512** | 475 new titles after cross-source dedup |

Saved as `openalex_citations.json` and `supplemental.json`.

## 4. ClinicalTrials.gov

| Term | Records |
|---|---:|
| cognitive training | 100 |
| neurofeedback | 100 |
| binaural beats | 66 |
| exergame cognition | 100 |
| **Total** | **366** (363 unique) |

- 24 records had posted results.
- 177 completed; 59 recruiting; 57 unknown; 41 not yet recruiting; 13 active not recruiting; 9 withdrawn; 7 enrolling by invitation; 3 terminated.
- 350 interventional; 16 observational.

Saved in `supplemental.json`.

## 5. Landmark retrieval

| Item | Count |
|---|---:|
| Requested landmarks | 14 |
| First-pass accepted | 8 |
| Completed with targeted queries | 6 |
| Records returned | 15 (one duplicate of an included review) |
| Unique landmarks added | 14 |

Saved as `landmarks.json`.

## 6. Deduplication

| Step | Count |
|---|---:|
| PubMed scoping records retrieved | 2,392 |
| Unique PubMed titles | 1,885 |
| OpenAlex records | 512 |
| New OpenAlex titles | 475 |
| **Unique bibliographic records** | **2,360** |
| Trial-registry records | 363 |
| PubMed review corpus | 1,495 (subset) |

## 7. Screening

| Step | Count |
|---|---:|
| Unique bibliographic records | 2,360 |
| Review corpus (expanded PubMed SR/MA) | 1,495 |
| Rule-excluded reviews | 457 |
| — recovered by targeted retrieval and extracted | 11 |
| — not extracted | 446 |
| Rule-eligible reviews | 1,038 |
| — extracted | 65 |
| — not extracted | 973 |
| Extracted from the review corpus | 76 |
| Extracted records outside the review corpus (landmarks and older reviews) | 8 |
| **Extracted into the evidence table** | **84** |
| — primary synthesis | 62 |
| — context only | 22 |
| Trial-registry records logged | 363 |
| Trials with results | 24 |

Reasons for non-extraction of the 973 rule-eligible reviews and 446 rule-excluded reviews:

- overlap with an extracted review covering the same modality × population × outcome cell;
- co-intervention or exercise-only focus that does not isolate a Noesis modality;
- lower relevance to the review questions after title/abstract triage;
- no extractable effect estimate in the abstract;
- the rule screen excluded the record, and targeted retrieval did not recover it.

These records are retained in `analysis/screening_reviews.csv`; they were not full-text assessed. This is a documented deviation from a full systematic review (see [PROTOCOL.md](PROTOCOL.md) §18).

## 8. Evidence table composition

| Dimension | Count |
|---|---:|
| Records | 144 |
| Outcomes | 340 |
| Primary outcomes | 258 |
| Systematic reviews/meta-analyses | 90 |
| Network meta-analyses | 18 |
| Other systematic reviews | 26 |
| RCTs | 8 |
| Umbrella reviews | 2 |
| DOI verified | 133 |
| DOI is a preprint | 4 |
| DOI unverified (PMID only) | 7 |
| Publication years | 2002-2026 |

By modality:

| Modality | Records |
|---|---:|
| cct | 60 |
| multimodal | 17 |
| neurofeedback | 17 |
| ave | 6 |
| multi_intervention | 6 |
| safety | 8 |
| engagement | 30 |

## 9. Metadata verification

Crossref title matching was used to confirm identifiers. PubMed DOI fields were not trusted directly because several were inconsistent with the article metadata (for example, a 2026 gerontology review carrying a 2023 BMC Geriatrics DOI).

Final table status:

| Status | Records |
|---|---:|
| DOI verified | 133 |
| DOI matches a preprint version | 4 |
| DOI unverified (cited by PMID only) | 7 |
| **Total** | **144** |

The verification files are `records/metadata_verification*.json`. A verified DOI is not evidence of inclusion; it only confirms the record's identity.

Six gaming-disorder engagement records (PMIDs 33028074, 37256740, 36571943, 40115446, 41317410, 41659171) were added 2026-11-02 as a targeted update: PubMed E-utilities `esearch` by title/DOI, PMCID-to-PMID resolution via the ID converter, and MEDLINE record confirmation via `esummary`. All six are MEDLINE-indexed; DOIs confirmed against the esummary article IDs.

Four further records closed dangling DESIGN_IMPLICATIONS citations the same day: three photosensitivity safety records (PMIDs 16146438, 16146439, 41283196; Epilepsy Foundation consensus and reviews grounding R14/R15) and one gamification meta-analysis (PMID 34982715, Hedges g 0.42, grounding R31). Identifiers confirmed via `esummary`; the gamification k/n and effect sizes were read from the PubMed abstract record. Two mechanism reviews stayed narrative-only by design: Clark 2009 near-miss (PMID 19217383, a primary experiment outside the umbrella-review scope) and Kahneman & Tversky 1979 (a book).

Three incentive-design records joined the table the same day (PMIDs 36367428, 24618584, 25933128): identifiers confirmed via `esummary`, DOIs matched. Two further mechanism sources stayed narrative-only by the same rule: the reward-memory review (PMID 26657967, structured narrative review) and the deposit-contract app RCT (PMID 36201384, a primary trial whose loss-frame-backfire and low-uptake warnings shaped R39).

Three goal-setting records joined the table the same day (PMIDs 38560998, 26445201, 30427874): specific goals (g=1.11), multi-component goal setting (d=0.55, daily-plus-weekly best) and implementation intentions with reinforcement (SMD 0.25). The goal-gradient mechanism (Kivetz et al., primary studies) stays narrative-only by the same rule and shapes the one-session-short nudge in R40.

Two retrieval-practice records joined the table the same day (PMIDs 25150680, 16719566): testing beats restudy (g=0.50) and spaced beats massed at every retention interval. Two education-journal reviews stayed narrative-only (Adesope 2017; Latimier et al. 2020: no MEDLINE record) but converge on the same prescription with moderators that shaped R41: stronger effects when test lags study by more than a day, and mixed recall-recognition formats best.

Two habit records joined the table the same day (PMIDs 39685110, 21626256): habit strength improves with intervention (SMD 0.69, ~2 months to start) and correlates with frequency at r=0.46. Lally et al. 2009 (single misses do not reset formation) and the habit-tracking guidelines stay narrative-only by the same rule and shape R42.

One planning-interventions record joined the table the same day (PMID 35742582, 41 RCTs, SMD 0.35, stronger with reinforcement). The HAPA meta-analysis and the Cochrane-style action/coping planning review stay narrative by rule (models and effect-modifier syntheses rather than new trial evidence); the coping-planning effect sizes (d≈0.6 self-report) they report shape R45 directly.

Two mental-contrasting records joined the table the same day (PMIDs 34054628, 30879403): MCII improves goal attainment (g=0.34) and mental contrasting alone improves health behaviour (g=0.28); interactive formation (g=0.47) beats document delivery (g=0.28), which calibrates the app-facing claims in R47.

One test-anxiety record joined the table the same day (PMID 29156362, 238 studies): anxiety is negatively related to performance and perceived pressure raises it; untimed beats timed, most for anxious test-takers. It grounds R50 (hide the clock) and the low-stakes framing throughout.

A 2026-11-08 targeted UX update added two self-determination-theory meta-analyses as context records: Sheeran et al. 2020 (PMID 32437175; 56 articles, 65 tests, d+=0.23, corrected d+>=0.15; autonomous motivation and perceived competence mediated) and Ntoumanis et al. 2021 (PMID 31983293; 73 studies; small-to-medium changes in need support, autonomous motivation and health behaviour). Both DOIs were checked against Crossref and both stay `context` because they measure engagement design, not cognitive-training efficacy. They ground R54 (practice menu with explicit choice) and R55 (brief autonomy-supportive test explanations). The same update added the literature note [PRACTICE_MENU_AND_BRIEFING.md](PRACTICE_MENU_AND_BRIEFING.md).

A 2026-11-08 data-collection update added two e-consent systematic reviews as context records: Cohen et al. 2023 (PMID 37656499; 35 studies, 13,281 participants; eConsent was better or not worse than paper for comprehension, acceptability and usability, no study favoured paper, cycle time increased) and Mazzochi et al. 2023 (PMID 36810093; 12 studies, 8,864 participants; enrolment effects mixed, comprehension/recall may improve, high heterogeneity). Both DOIs were checked against Crossref. The 2026 perspective on digital-phenotyping data banking (PMID 42443473) and the data-sharing measurement review (PMID 41813053) stayed narrative-only in [DATA_COLLECTION_AND_CONSENT.md](DATA_COLLECTION_AND_CONSENT.md): the first is a Perspective and the second found low-certainty survey measurement. These sources ground R57-R59.

The FAIR Guiding Principles (PMID 26978244; DOI 10.1038/sdata.2016.18) stayed narrative-only in [DATA_EXPORT_AND_REUSE.md](DATA_EXPORT_AND_REUSE.md): it is a principles paper, not an eligible systematic review, RCT or umbrella review. It grounds R61 (analysis-ready CSV companions) and R62 (self-describing manifest and data dictionary).

A 2026-11-08 new-game search added two executive-function context records: Nguyen et al. 2019 (PMID 30998045; 64 studies, 3,594 older adults; small near- and far-transfer effects, maintained at follow-up) and Basak et al. 2020 (PMID 32011155; 215 training studies; overall g=0.28, near g=0.37, far g=0.22; single-component EF training was most effective on near/far transfer, while multicomponent training also transferred and improved everyday functioning). They ground the experimental Task Switch focus test. Action-game and commercial brain-training meta-analyses (PMIDs 29172564, 37531408, 34251578) stayed narrative-only in [NEW_MECHANIC_CANDIDATES.md](NEW_MECHANIC_CANDIDATES.md): action-game genres conflict with the no-flashing safety posture, and the commercial-program review is not specific to a single task paradigm.

A 2026-11-08 spatial-span search added one context record: Olegário et al. 2025 (PMID 37822255; 31 trials in the systematic review, 13 in the meta-analysis; cognitive training improved Corsi Block working memory in healthy older adults, d=0.16, p=.002, while Digit Span backward and N-back were not significant). The DOI and metadata were verified via PubMed esummary. It grounds the experimental Spatial Span focus test (R65, ADR-047). Two task-specific working-memory reviews stayed narrative-only in [NEW_MECHANIC_CANDIDATES.md](NEW_MECHANIC_CANDIDATES.md): Melby-Lervåg and Hulme 2013 (PMID 22612437) found short-term visuospatial near transfer with limited maintenance, and their 2016 meta-analysis (PMID 27474138) found no convincing far transfer against treated controls. The 2026 spatial-memory rehabilitation review (PMID 41570544) is narrative-only because it has eight heterogeneous studies and no meta-analysis.

A 2026-11-08 mental-rotation search added one context record: Uttal et al. 2013 (PMID 22663761; 217 training studies; average spatial-training effect g=0.47, stable over delays and transferred to untrained spatial tasks). The DOI and metadata were verified via PubMed esummary. It grounds the experimental Mental Rotation focus test (R66, ADR-048). Hawes et al. 2022 (PMID 35073120; 29 studies, N=3,765, k=89; spatial thinking g=0.49, mathematics g=0.28) stayed narrative-only in the candidate note because its mathematics effect favoured concrete materials over computerized training; Sala and Gobet 2017 (PMID 29276344) also stayed narrative-only as a general far-transfer caution.

A 2026-11-08 scope search evaluated the remaining UFOV/visual-search and stop-signal candidates; both stayed out of scope and narrative-only (ADR-049). Edwards et al. 2018 (PMID 29175362) reviewed 44 UFOV-training studies from 17 RCTs: speed/attention and everyday-function gains, durable across ten years, adaptive better than non-adaptive, but no transfer to other neuropsychological outcomes. Woutersen et al. 2017 (PMID 29270605) found the UFOV subtests are not construct-pure, and UFOV remains a proprietary protocol with brief adaptive presentation. McGreen et al. 2024 (PMID 38309625) meta-analysed 32 Go/No-Go and Stop-Signal studies for appetitive behaviour (g=-0.21), not cognitive-training transfer; Go/No-Go already covers inhibition. No evidence-table record was added, so the review remained at 120 records and 282 outcomes.

A 2026-11-08 prospective-memory search added one context record: Tse et al. 2023 (PMID 35543836; 48 studies in the systematic review, 29 RCTs in the meta-analysis; immediate prospective-memory training effect g=0.54, long-term g=0.20 and not significant). The DOI and metadata were verified via PubMed esummary. It grounds the experimental Prospective Memory focus test (R67, ADR-050). The review is now 121 records and 283 outcomes, revision v1.5.

A 2026-11-08 paired-associates search added one context record: Chen et al. 2022 (PMID 36301274; 21 RCTs, 4,149 healthy older adults; mnemonic training improved episodic memory immediately g=0.408 and at follow-up g=0.418). The DOI and metadata were verified via PubMed esummary. It grounds the experimental Paired Associates focus test (R68, ADR-051). Gross et al. 2012 (PMID 22423647; 35 studies, g=0.31) stayed narrative-only as broader memory-strategy evidence. The review is now 122 records and 284 outcomes, revision v1.6.

A 2026-11-08 dual-task scope search kept cognitive-motor dual-task training narrative-only (ADR-052). Gao and Liu 2025 (PMID 40410069) found gait, balance, executive-function and fall-risk gains in community older adults; Hao et al. 2025 (PMID 40304821) network meta-analysed 32 RCTs in MCI/dementia and found dual cognitive-task training best for global cognition. Both are clinical or motor-cognitive populations, so no dual-task mechanic was added. The same update added an optional mnemonic strategy hint to Paired Associates, based on the Chen 2022 strategy-training evidence; it does not change scoring.

A 2026-11-08 verbal-fluency and face-name search kept both candidates out of scope (ADR-053). No eligible verbal-fluency training meta-analysis was found, and open-ended generation cannot be scored deterministically. Kelly et al. 2014 (PMID 24607830; 31 RCTs, 1,806 cognitive-training participants) reported face-name recall (p=0.02) and paired associates (p=0.001) gains versus no intervention, but it is not an active-control face-name meta-analysis and a validated face stimulus set would need privacy and consent handling. The Paired Associates mnemonic hint was also surfaced in the pre-test briefing as an optional Strategy tip.

A 2026-11-08 metacognition search found no confidence-calibration training meta-analysis. Sella et al. 2023 (PMID 36218025; 25 studies, 1,768 older adults; metacognitive training memory d=0.52, strategic training d=0.44, limited methodological quality) stayed narrative-only. An optional Low/Medium/High confidence check was added to the pre-test briefing and echoed on the result card with an explicit "not scored, not diagnostic" note (ADR-054); it is a reflection prompt, not metacognitive training. The check is now persisted per block in the session snapshot and completed result, and Menu History summarizes confidence versus accuracy within each mechanic level. Sessions CSV gains a `confidence` column.

A 2026-11-08 visual working-memory search found no eligible change-detection training meta-analysis. The broader working-memory/executive-function training records (PMIDs 30998045, 32011155) already in the corpus stayed the quantitative basis. Change Detection was added as an experimental focus test with an explicit task-specific evidence exception (R69, ADR-055), using a static coloured grid and one brief change; no evidence-table record was added.

A 2026-11-08 judgments-of-learning search added one context record: Ingendahl et al. 2025 (PMID 40875340; *Psychological Bulletin*; 344 effect sizes from 175 experiments, N=15,079; immediate JOL reactivity g=0.22, 95% CI [0.17, 0.27]; related pairs g=0.44, unrelated pairs g=-0.09; publication bias indicated). The DOI and metadata were verified via PubMed esummary/efetch. It bounds the optional confidence check: the app now states in the briefing that item-level confidence judgments can subtly change memory and that confidence is often a weak predictor, and it labels the block-level prompt as a reflection rather than a validated memory intervention (ADR-056). Double et al. 2018 (PMID 29161973) and Hu et al. 2025 (PMID 40845062) stayed narrative-only. The review is now 123 records and 285 outcomes, revision v1.7.

A 2026-11-08 targeted n-back search added one task-specific context record: Soveri et al. 2017 (PMID 28116702; *Psychonomic Bulletin & Review*; 203 effect sizes from 33 published randomized controlled n-back training trials in healthy adults; medium transfer to untrained n-back tasks, but very small effects on other working-memory tasks, fluid intelligence and cognitive control; no moderation by age, dose, single versus dual training, or verbal versus visuospatial content). The DOI and metadata were verified via PubMed esummary/efetch. It becomes the first N-back citation and tightens the core mechanic's brief, claim and qualifier from "closely related working-memory tasks" to "untrained n-back tasks, with little transfer beyond the task". The 2026 asymmetry meta-analysis (PMID 42711482) remains a supporting citation. The review is now 124 records and 286 outcomes, revision v1.8.

A 2026-11-08 complex-span and sustained-attention scan found no eligible training meta-analysis for either candidate. Complex span is normally an outcome measure, and the app already has three working-memory tasks; sustained attention is already embedded in Go/No-Go and Speed Tap. Both candidates stayed out of scope (ADR-058). The same update added a domain filter to the Choose-a-test page so the eleven-test list can be narrowed by construct; it changes presentation only and supports the existing explicit-choice design (R54). No evidence-table record was added, so the review remains at 124 records and 286 outcomes, revision v1.8.

A 2026-11-08 Go/No-Go and processing-speed scan found no eligible task-specific cognitive-training meta-analysis. Go/No-Go training records concern appetitive behaviour change rather than cognitive transfer; the existing inhibitory-control network meta-analysis (PMID 40398202) remains the basis. Processing-speed evidence is covered by the broad cognitive-training meta-analysis (PMID 32011155), and Speed Tap is not UFOV. Both candidates stayed out of scope (ADR-059). The same update adds signal-detection sensitivity (d′) to Go/No-Go results and a response-bias note; no evidence-table record was added, so the review remains at 124 records and 286 outcomes, revision v1.8.

A 2026-11-22 targeted extraction took eight reviews from the 973 rule-eligible but not previously extracted PubMed records (deviation D7), chosen to fill the working-memory transfer and durability cells: Hou et al. 2020 (PMID 32507890; 22 RCTs in adults 63.8-80.1; long-term updating g=0.45 [0.253-0.648], shifting 0.447 [0.246-0.648], inhibition 0.387 [0.228-0.547], maintenance 0.486 [0.352-0.620]), Karbach & Verhaeghen 2014 (PMID 25298292; 49 articles/61 samples, adults over 60; significant near transfer and smaller but significant far transfer, no adaptivity or dose moderation), Sala & Gobet 2020 (PMID 31939109; 41 studies, k=393, N=2,375; small-to-medium near transfer, far transfer to intelligence and attainment null, active-control g=0.001, SE=0.055), Wang et al. 2023 (PMID 36958492; 19 trials, n=1,051; anxiety Hedges g=-0.392, p=.009), Ophey et al. 2020 (PMID 33173503; 16 studies, n=675; no validated responder profile, context role), Pappa et al. 2020 (PMID 32738262; large training effect, moderate near transfer, non-significant far transfer, frontoparietal decreases), Spencer-Smith & Klingberg 2015 (PMID 25793607; 12 Cogmed studies; daily inattention SMD=-0.47 [-0.65,-0.29], follow-up -0.33 [-0.57,-0.09], visuospatial WM 0.66 [0.43,0.89], verbal WM 0.40 [0.18,0.62]), and Kassai et al. 2019 (PMID 30652908; children; near g=0.44, k=43, far g=0.11, k=17, p=.11). Each PMID, title, journal, year and DOI was re-read from the PubMed MEDLINE record with NCBI E-utilities `efetch`; all eight DOIs were already Crossref-verified in the table vocabulary and remain `verified`. Only estimates printed in the abstract were entered; where the abstract gave no magnitude the outcome keeps a null value with a narrative note. The 2026-11-08 Soveri n-back record (PMID 28116702) was already extracted and was not re-added. Seven records are primary and the methodological predictor review is context. The review is now 132 records and 308 outcomes, revision v1.9; 965 eligible residual reviews remain unextracted, so D7 is partially closed rather than resolved.

A 2026-11-23 targeted visual-search update added one context record: Zhang et al. 2022 (PMID 35838486, *Journal of Vision*; DOI 10.1167/jov.22.8.7), read from the PubMed MEDLINE record with E-utilities `efetch`. Five controlled experiments trained healthy adults on a conjunction search; training improved search behaviour, reduced saccade count and total scan time, and increased the target-locked N2pc. No pooled effect size is printed in the abstract, so the two outcomes keep null values with narrative notes and the record is `context`, not a source for a product claim. Two further sources stayed narrative-only in [NEW_MECHANIC_CANDIDATES.md](NEW_MECHANIC_CANDIDATES.md): Vialatte et al. 2023 (PMID 36922549) found a reading-accuracy gain from a symbol-search serious game in 21 children with reading disorders, and Bueichekú et al. 2019 (PMID 30859709) found resting-state connectivity change after 30 minutes of search training in 42 adults. This record grounds the experimental Visual Search focus test; D7 is unchanged. The review is now 133 records and 310 outcomes, revision v2.0.

A 2026-11-23 adherence update added one primary record from the residual eligible pool: Li et al. 2024 (PMID 38266127, *Age and Ageing*; DOI 10.1093/ageing/afad247), read from the PubMed MEDLINE record with E-utilities `efetch`. Fifty-five RCTs with 4,455 participants (mean age 73.9) gave a cross-domain training effect of Hedges g=0.286 (95% CI 0.224-0.348); subgroup analyses found significant effects when engagement or persistence exceeded 60% or adherence exceeded 80%, with higher persistence needed for memory, visuospatial and reasoning outcomes than for executive function, attention and language. The thresholds are observational moderators, not dose targets, so the app's adherence card presents them as study-level context with an explicit not-a-target caveat (R71, ADR-062). Buyle et al. 2022 (PMID 35989930) stayed narrative-only: its motivation findings concern exergame fall-prevention programmes, not cognitive-training adherence. The review is now 134 records and 312 outcomes, revision v2.1.

A 2026-11-23 everyday-function update added two primary records from the residual eligible pool, both read via E-utilities `efetch`. Kelly et al. 2014 (PMID 24607830, *Ageing Research Reviews*; DOI 10.1016/j.arr.2014.02.004) pooled 31 RCTs (1,806 training plus 386 mental-stimulation participants) and found executive-function gains against active controls (working memory p=0.04, processing speed p<0.0001, composite p=0.001) and memory gains against no intervention, while reporting that everyday functioning is largely under-investigated; transfer and maintenance were most often reported with adaptive training, at least ten sessions and long-term follow-up. Chandler et al. 2016 (PMID 27632385, *Neuropsychology Review*; DOI 10.1007/s11065-016-9330-4) pooled 30 controlled studies in MCI and found small median effects on ADLs (d=0.23), mood (d=0.16) and metacognition (d=0.30), but not quality of life (d=0.10), with computerized studies benefiting mood most. No pooled everyday-function estimate exists for healthy adults, so the Results screen now cites Kelly 2014 next to an explicit under-investigation caveat (ADR-063). The review is now 136 records and 319 outcomes, revision v2.2.

A 2026-11-23 clinical-boundary update added one primary record from the residual eligible pool: Westwood et al. 2023 (PMID 36977764, *Molecular Psychiatry*; DOI 10.1038/s41380-023-02000-7), verified from the PubMed MEDLINE record. Thirty-six RCTs (17 working-memory training) found no probably-blinded effect on ADHD total or hyperactivity/impulsivity symptoms; inattention showed a small SMD 0.17 (0.02-0.31) that doubled in the delivery setting, while verbal and visuospatial working memory improved (SMD 0.38, 0.24-0.53 and SMD 0.49, 0.31-0.67) and reading/arithmetic did not. The abstract prints reversed confidence bounds for the null symptom outcomes, so only the magnitude was entered and the inconsistency flagged. This record anchors a linked "what the review does not support" list on the Evidence screen (R73, ADR-064). The review is now 137 records and 324 outcomes, revision v2.3.

A 2026-11-23 game-design update added one primary record from the residual eligible pool: Wang et al. 2021 (PMID 32980574, *Archives of Gerontology and Geriatrics*; DOI 10.1016/j.archger.2020.104260), verified via E-utilities `efetch`. Fifteen RCTs with 759 community-dwelling older adults found small gains in processing speed (g=0.23), selective attention (g=0.40) and short-term memory (g=0.35); subgroup analyses favoured non-time-pressure games, multiplayer, computer platform, provider support, and sessions at most three times a week for at most 60 minutes, and game design moderated processing speed (beta=0.211, p=0.008). These are group-level design observations, not a dose prescription, so the Settings clock note presents them as context (R75, ADR-065). The review is now 138 records and 328 outcomes, revision v2.4.

A 2026-11-23 multimodal update added one primary record from the residual eligible pool: Wu et al. 2023 (PMID 37065695, *PeerJ*; DOI 10.7717/peerj.15108), verified via E-utilities `efetch`. Twenty-one RCTs found combined exercise and cognitive training better than no intervention on working memory (SMD 0.29, 0.14-0.44), but not different from exercise alone (SMD 0.16, -0.04-0.35) or cognitive training alone (SMD 0.08, -0.13-0.30), so synergy remains unproven. This becomes a fourth linked claim boundary on the Evidence screen (ADR-066). The review is now 139 records and 331 outcomes, revision v2.5.

A 2026-11-23 expectancy update added one context record from a targeted PubMed title search: Motter et al. 2024 (PMID 38230719, *Journal of Prevention of Alzheimer's Disease*; DOI 10.14283/jpad.2023.62), verified via E-utilities `efetch`. In a two-site RCT of 107 patients with MCI, expectancy was higher for computerized training than crosswords but was not associated with 78-week change in global cognition, everyday function or hippocampal volume, and did not interact with treatment. Baseline expectancy is therefore not a validated responder predictor, which becomes a fifth linked claim boundary on the Evidence screen (ADR-067). The record comes from a targeted search, not the residual corpus, so D7 is unchanged. The review is now 140 records and 333 outcomes, revision v2.6.

A 2026-11-23 clinical-mood update added one context record: Woolf et al. 2022 (PMID 33913064, *Neuropsychology Review*; DOI 10.1007/s11065-021-09487-3), verified via E-utilities `efetch`. Nine controlled studies in adults with diagnosed major depressive disorder produced moderate pooled cognitive and affective effects, but very few examined transfer to everyday functioning. The result is clinical and population-specific, so it becomes a sixth linked claim boundary: no mood-disorder treatment claim for a consumer app (ADR-068). This record came from a targeted search, so D7 is unchanged. The review is now 141 records and 336 outcomes, revision v2.7.

A 2026-11-23 serious-games update added one context record from the residual eligible pool: Abd-Alrazaq et al. 2023 (PMID 37043277, *Journal of Medical Internet Research*; DOI 10.2196/43607), verified via E-utilities `efetch`. Eleven RCTs in older adults with cognitive impairment showed verbal and nonverbal learning gains versus no/sham controls (P=.04 and P=.03) and nonverbal gains versus conventional cognitive training (P<.001), but only 2-5 trials entered each pool, 6 of 8 pooled studies were small, and the authors concluded that serious games should supplement rather than replace established interventions. The record is context only and its caveat is recorded in NEW_MECHANIC_CANDIDATES.md (ADR-070). D7 residuals fall to 958; the review is now 142 records and 338 outcomes, revision v2.8.

A 2026-11-23 data-reuse update resolved the two narrative-only citations in DATA_EXPORT_AND_REUSE.md into context records, both verified via E-utilities `efetch`. Wilkinson et al. 2016 (PMID 26978244, *Scientific Data*; DOI 10.1038/sdata.2016.18) defines the FAIR principles for documented, machine-readable, reusable data. Maxwell et al. 2026 (PMID 41813053, *BMJ Open*; DOI 10.1136/bmjopen-2025-100314) reviewed 60 data-sharing KAP surveys and found weak development and reporting, so data-sharing willingness cannot be inferred reliably. The research export panel now links the FAIR paper (ADR-073). These came from a targeted search, so D7 is unchanged. The review is now 144 records and 340 outcomes, revision v2.9.

One engagement-prompts record joined the table the same day (PMID 26747176, 14 trials, RR 1.27 with caution): technology prompts beat no strategy, best for new content sent early. No push channel is built: the evidence is borderline-heterogeneous and unsolicited push would trade against the autonomy the design protects; the in-app notices (milestones, far-check due, goal nudges) already implement the supported mechanism. See BEHAVIORAL 6.24.

One interleaving record joined the table the same day (PMID 31556629, 59 studies, g=0.42, blocking wins for word lists at g=-0.39): identifier confirmed via esummary, DOI matched. It grounds the default mixed lineup and the blocked far-check study phase (R52).

One adherence record joined the table the same day (PMID 35612886, 99 studies, engagement/primary/verified): personalization, reminders and stability support adherence while technical difficulties are the top barrier. It joins R53 alongside PMID 26747176; the in-app notices (milestones, far-check due, goal nudges) already implement the supported prompt mechanism with no push channel built. See BEHAVIORAL 6.24.

## 10. Tooling and commands

- PubMed: NCBI E-utilities (`esearch.fcgi`, `efetch.fcgi`), XML parsing with `xml.etree.ElementTree`.
- OpenAlex: `api.openalex.org/works`, `filter=pmid:`, `filter=cites:`.
- ClinicalTrials.gov: `clinicaltrials.gov/api/v2/studies`.
- Crossref: `api.crossref.org/works`, title and DOI lookups.
- No API keys were used. No credentials are stored.
- The one-off collector scripts are not part of the product; the exact queries above reproduce the search layer.

## 11. Deviations recorded during execution

| # | Deviation | Reason | Impact |
|---|---|---|---|
| D1 | External protocol registration not completed | PROSPERO requires an accountable human investigator and account | Protocol is internally versioned, not externally registered |
| D2 | No independent human dual screening | AI-assisted review; no second human reviewer available | Single-pass AI screening; rule-based checks and targeted verification instead |
| D3 | 20% double-screening sample not executed | Same constraint as D2 | Agreement statistics (kappa) cannot be reported |
| D4 | Independent GRADE not performed | Certainty would require full-text appraisal of every review | Certainty is recorded **as reported by the source** and is provisional |
| D5 | PsycINFO, Embase, CINAHL and ERIC not searched directly | No institutional access in this environment | OpenAlex and PubMed citation coverage mitigate but do not close the gap |
| D6 | English-language restriction | Feasibility | Language bias cannot be excluded |
| D7 | 973 rule-eligible and 446 rule-excluded reviews not extracted; 15 eligible reviews extracted 2026-11-22/23 (8 WM, 1 adherence, 2 everyday-function, 1 ADHD, 1 game-design, 1 multimodal, 1 serious-games) | Prioritisation by modality × population × outcome cell | 958 eligible reviews remain logged but not synthesised; partially closed |
| D8 | PubMed DOI fields unreliable | XML metadata inconsistency | Crossref verification used; 7 records are PMID-only and 4 carry preprint DOIs |
| D9 | Preprint identifiers retained for four records | Crossref matched a preprint version | Flagged `preprint`; conclusions do not rely solely on them |
| D10 | Initial 997-review corpus query omitted working-memory training, cognitive stimulation/rehabilitation, serious-game and VR-cognitive terms | Gap detected during screening | Query expanded to 1,495 reviews; final denominator and screening counts use the expanded corpus |
