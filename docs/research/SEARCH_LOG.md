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
| Records | 122 |
| Outcomes | 284 |
| Primary outcomes | 226 |
| Systematic reviews/meta-analyses | 73 |
| Network meta-analyses | 18 |
| Other systematic reviews | 23 |
| RCTs | 6 |
| Umbrella reviews | 2 |
| DOI verified | 111 |
| DOI is a preprint | 4 |
| DOI unverified (PMID only) | 7 |
| Publication years | 2002-2026 |

By modality:

| Modality | Records |
|---|---:|
| cct | 43 |
| multimodal | 17 |
| neurofeedback | 17 |
| ave | 6 |
| multi_intervention | 5 |
| safety | 8 |
| engagement | 26 |

## 9. Metadata verification

Crossref title matching was used to confirm identifiers. PubMed DOI fields were not trusted directly because several were inconsistent with the article metadata (for example, a 2026 gerontology review carrying a 2023 BMC Geriatrics DOI).

Final table status:

| Status | Records |
|---|---:|
| DOI verified | 111 |
| DOI matches a preprint version | 4 |
| DOI unverified (cited by PMID only) | 7 |
| **Total** | **122** |

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
| D7 | 973 rule-eligible and 446 rule-excluded reviews not extracted | Prioritisation by modality × population × outcome cell | Residual evidence is logged, not synthesised |
| D8 | PubMed DOI fields unreliable | XML metadata inconsistency | Crossref verification used; 7 records are PMID-only and 4 carry preprint DOIs |
| D9 | Preprint identifiers retained for four records | Crossref matched a preprint version | Flagged `preprint`; conclusions do not rely solely on them |
| D10 | Initial 997-review corpus query omitted working-memory training, cognitive stimulation/rehabilitation, serious-game and VR-cognitive terms | Gap detected during screening | Query expanded to 1,495 reviews; final denominator and screening counts use the expanded corpus |
