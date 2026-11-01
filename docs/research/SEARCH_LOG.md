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
| Records | 84 |
| Outcomes | 241 |
| Primary outcomes | 190 |
| Systematic reviews/meta-analyses | 45 |
| Network meta-analyses | 17 |
| Other systematic reviews | 14 |
| RCTs | 6 |
| Umbrella reviews | 2 |
| DOI verified | 73 |
| DOI is a preprint | 4 |
| DOI unverified (PMID only) | 7 |
| Publication years | 2002-2026 |

By modality:

| Modality | Records |
|---|---:|
| cct | 34 |
| multimodal | 17 |
| neurofeedback | 17 |
| ave | 6 |
| multi_intervention | 5 |
| safety | 3 |
| engagement | 2 |

## 9. Metadata verification

Crossref title matching was used to confirm identifiers. PubMed DOI fields were not trusted directly because several were inconsistent with the article metadata (for example, a 2026 gerontology review carrying a 2023 BMC Geriatrics DOI).

Final table status:

| Status | Records |
|---|---:|
| DOI verified | 73 |
| DOI matches a preprint version | 4 |
| DOI unverified (cited by PMID only) | 7 |
| **Total** | **84** |

The verification files are `records/metadata_verification*.json`. A verified DOI is not evidence of inclusion; it only confirms the record's identity.

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
