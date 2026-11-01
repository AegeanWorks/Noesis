# PRISMA 2020 Flow and Checklist

**Review:** Noesis evidence review v1.0  
**Search date:** 2026-10-31  
**Protocol:** [PROTOCOL.md](PROTOCOL.md)  
**Status:** AI-assisted; not a human-led clinical systematic review

---

## 1. Flow of records

### Identification

| Source | Records retrieved | Unique after dedup |
|---|---:|---:|
| PubMed scoping searches (10 queries) | 2,392 | 1,885 |
| OpenAlex citation chasing (8 seeds) | 112 | — |
| OpenAlex keyword searches (4 terms) | 400 | — |
| OpenAlex combined | 512 | 475 new titles |
| **Bibliographic total** | **2,904** | **2,360** |
| ClinicalTrials.gov (4 terms) | 366 | 363 |
| PubMed review corpus (expanded SR/MA) | 1,495 | 1,495 (subset) |

Duplicates removed at the bibliographic level: **544**.

### Screening

| Stream | Screened | Excluded | Included in synthesis |
|---|---:|---:|---:|
| Bibliographic records | 2,360 | 2,276 | 84 |
| — of which SR/MA review corpus | 1,495 | 1,419 | 76 |
| — of which other records | 865 | 857 | 8 |
| Trial-registry records | 363 | 363 | 0 |
| **Total** | **2,723** | **2,639** | **84** |

Review-corpus exclusions:

| Reason | Count |
|---|---:|
| Rule-excluded and not recovered by targeted retrieval | 446 |
| Rule-eligible but not extracted (overlap, co-intervention, no extractable estimate) | 973 |
| **Total** | **1,419** |

Review-corpus inclusions:

| Route | Count |
|---|---:|
| Passed the rule screen and extracted | 65 |
| Recovered by targeted retrieval after the rule screen excluded them | 11 |
| **Total extracted from the review corpus** | **76** |

Of the 76, 57 are primary and 19 are context. The 8 records outside the corpus are older landmark RCTs and reviews (five primary, three context), retrieved by known-item search.

Trial-registry outcomes:

| Status | Count |
|---|---:|
| Completed | 177 |
| Recruiting | 59 |
| Unknown | 57 |
| Not yet recruiting | 41 |
| Active, not recruiting | 13 |
| Withdrawn | 9 |
| Enrolling by invitation | 7 |
| Terminated | 3 |
| With posted results | 24 |

Trials were logged as ongoing/unpublished evidence and were **not** included in efficacy synthesis.

### Included

| Category | Count |
|---|---:|
| Evidence-table records | 84 |
| Primary synthesis | 62 |
| Context only | 22 |
| Systematic reviews/meta-analyses | 45 |
| Network meta-analyses | 17 |
| Other systematic reviews | 14 |
| RCTs | 6 |
| Umbrella reviews | 2 |
| Outcomes extracted | 241 |
| Primary outcomes | 190 |

---

## 2. PRISMA 2020 checklist

Status: **Met** = fully done; **Partial** = done with a stated limitation; **Not met** = not done.

| # | Item | Status | Where / why |
|---|---|---|---|
| 1 | Title identifies the report as a systematic review | Met | Title and header |
| 2 | Structured abstract | Met | `SYNTHESIS.md` §1 |
| 3 | Rationale | Met | `PROTOCOL.md` §1 |
| 4 | Objectives | Met | `PROTOCOL.md` §2 |
| 5 | Eligibility criteria | Met | `PROTOCOL.md` §4 |
| 6 | Information sources | Partial | PubMed, OpenAlex, ClinicalTrials.gov, Crossref; no PsycINFO/Embase/CINAHL/ERIC (D5) |
| 7 | Search strategy | Met | `SEARCH_STRATEGY.md` |
| 8 | Selection process | Partial | Rule-based AI screening; no independent human dual screen (D2, D3) |
| 9 | Data collection process | Partial | AI extraction; no 20% double extraction (D3) |
| 10 | Data items | Met | `PROTOCOL.md` §8; `analysis/evidence_table.json` |
| 11 | Study risk of bias | Partial | Source-reported risk of bias recorded; no independent RoB 2/AMSTAR 2 re-rating |
| 12 | Effect measures | Met | SMD, Hedges g, MD, OR, SUCRA, narrative; sign and direction recorded |
| 13 | Synthesis methods | Met | `PROTOCOL.md` §10; no pooled meta-analysis performed |
| 14 | Reporting bias | Partial | Source reviews' publication-bias findings recorded; no independent funnel-plot analysis |
| 15 | Certainty assessment | Partial | Certainty recorded as reported by source; independent GRADE not performed (D4) |
| 16 | Study selection results | Met | This document §1 |
| 17 | Study characteristics | Met | `analysis/evidence_table.json` |
| 18 | Risk of bias in studies | Partial | Source-reported only |
| 19 | Results of individual studies | Met | `analysis/evidence_table.json` |
| 20 | Results of syntheses | Met | `SYNTHESIS.md` §4-§6 |
| 21 | Reporting biases | Partial | Described; not independently tested |
| 22 | Certainty of evidence | Partial | Provisional, source-reported |
| 23 | Discussion | Met | `SYNTHESIS.md` §7-§9 |
| 24 | Registration and protocol | Partial | Internally versioned protocol; not externally registered (D1) |
| 25 | Support | Met | No external funding |
| 26 | Competing interests | Met | None declared |
| 27 | Availability of data and code | Met | Records, evidence table, validator, and tests are in the project |

### Items that a human-led review must still complete

1. External protocol registration (PROSPERO or OSF).
2. Independent dual title/abstract and full-text screening with agreement statistics.
3. Full-text assessment of the 684 eligible-but-unextracted reviews.
4. Independent AMSTAR 2 and RoB 2 ratings.
5. Independent GRADE assessment for every modality × population × outcome comparison.
6. Direct searches of PsycINFO, Embase, CINAHL and ERIC.
7. Non-English literature.

---

## 3. Interpretation of the flow

The review is **systematic in search and extraction**, but **AI-assisted and prioritised in screening**. It is suitable for:

- product strategy and claim boundaries;
- identifying which modalities deserve prototyping;
- defining a measurement plan;
- exposing conflicts in the literature;
- planning a human-led clinical review.

It is **not** suitable for:

- a regulatory submission;
- a clinical guideline;
- a public medical claim;
- proving efficacy for any indication.

Those uses require the seven items above.
