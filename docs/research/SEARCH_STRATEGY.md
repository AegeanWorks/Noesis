# Search Strategy

**Review:** Noesis evidence review v1.0  
**Search date:** 2026-10-31  
**Protocol:** [PROTOCOL.md](PROTOCOL.md)  
**Canonical identifier:** PMID (DOI is recorded only when Crossref confirms it)

---

## 1. Design

The review is an umbrella review of systematic reviews and meta-analyses, supplemented by landmark randomised controlled trials (RCTs). Searches were run per modality because a single combined string produced an unmanageable and imprecise result set.

Five search layers were used:

1. **Scoping searches** across ten modality and population blocks (PubMed).
2. **A complete review corpus** for all eligible modalities (PubMed `systematic review[pt] OR meta-analysis[pt]`).
3. **Citation chasing** from eight verified seed records (OpenAlex).
4. **Trial-registry checks** (ClinicalTrials.gov).
5. **Known-item retrieval** for 15 landmark trials and meta-analyses.

The complete review corpus replaced the earlier 300-record relevance cap for the review layer, so the umbrella review is not limited to the first page of results.

---

## 2. PubMed scoping searches

Database: PubMed/MEDLINE via E-utilities (`esearch.fcgi`, `efetch.fcgi`).  
Retrieval: relevance-sorted, up to 300 records per query (first pass).  
Date filter: none in the string; the review window (2000-2026) was applied at screening.  
Language: English at screening.

```
cct:
("cognitive training"[tiab] OR "computerized cognitive training"[tiab] OR
 "computerised cognitive training"[tiab] OR "cognitive remediation"[tiab] OR
 "brain training"[tiab] OR "brain-training"[tiab] OR "cognitive game"[tiab] OR
 "cognitive games"[tiab] OR exergame[tiab] OR exergames[tiab])
AND (systematic review[pt] OR meta-analysis[pt] OR randomized controlled trial[pt]
     OR "systematic review"[tiab] OR "meta-analysis"[tiab])

neurofeedback:
("neurofeedback"[tiab] OR "EEG biofeedback"[tiab] OR "neuro-feedback"[tiab])
AND (systematic review[pt] OR meta-analysis[pt] OR randomized controlled trial[pt]
     OR "systematic review"[tiab] OR "meta-analysis"[tiab])

ave:
("binaural beat"[tiab] OR "binaural beats"[tiab] OR "monaural beat"[tiab] OR
 "isochronic tone"[tiab] OR "isochronic tones"[tiab] OR "audio-visual entrainment"[tiab] OR
 "photic stimulation"[tiab] OR "brainwave entrainment"[tiab])
AND (systematic review[pt] OR meta-analysis[pt] OR randomized controlled trial[pt]
     OR "systematic review"[tiab] OR "meta-analysis"[tiab])

multimodal:
(("cognitive training"[tiab] OR "brain training"[tiab] OR "cognitive remediation"[tiab])
 AND (neurofeedback[tiab] OR "physical exercise"[tiab] OR exergame[tiab] OR exergames[tiab]
      OR binaural[tiab] OR entrainment[tiab] OR HRV[tiab] OR sleep[tiab]))
AND (systematic review[pt] OR meta-analysis[pt] OR randomized controlled trial[pt]
     OR "systematic review"[tiab] OR "meta-analysis"[tiab])

adhd:
(ADHD[tiab] OR "attention deficit"[tiab] OR "attention-deficit"[tiab])
AND (neurofeedback[tiab] OR "cognitive training"[tiab] OR "brain training"[tiab]
     OR "cognitive remediation"[tiab])
AND (systematic review[pt] OR meta-analysis[pt] OR randomized controlled trial[pt])

older:
("older adults"[tiab] OR "older adult"[tiab] OR "mild cognitive impairment"[tiab]
 OR aged[MeSH Terms])
AND ("cognitive training"[tiab] OR "brain training"[tiab] OR "cognitive remediation"[tiab]
     OR neurofeedback[tiab])
AND (systematic review[pt] OR meta-analysis[pt] OR randomized controlled trial[pt])

safety:
(binaural[tiab] OR "photic stimulation"[tiab] OR neurofeedback[tiab] OR "brain training"[tiab])
AND (adverse[tiab] OR safety[tiab] OR seizure[tiab] OR epilepsy[tiab] OR photosensitive[tiab])

engagement:
("cognitive training"[tiab] OR "brain training"[tiab] OR "cognitive remediation"[tiab])
AND (gamification[tiab] OR adherence[tiab] OR engagement[tiab] OR motivation[tiab])
AND (systematic review[pt] OR meta-analysis[pt] OR randomized controlled trial[pt])

transfer:
("cognitive training"[tiab] OR "working memory training"[tiab] OR "brain training"[tiab])
AND ("far transfer"[tiab] OR "near transfer"[tiab] OR transfer[tiab])
AND (meta-analysis[pt] OR systematic review[pt])

clinical:
(schizophrenia[tiab] OR psychosis[tiab] OR stroke[tiab] OR "traumatic brain injury"[tiab]
 OR dementia[tiab] OR depression[tiab] OR anxiety[tiab])
AND ("cognitive training"[tiab] OR "cognitive remediation"[tiab] OR neurofeedback[tiab]
     OR "brain training"[tiab])
AND (systematic review[pt] OR meta-analysis[pt] OR randomized controlled trial[pt])
```

---

## 3. Complete PubMed review corpus

To avoid relevance-cap bias, the review layer was re-run without a retrieval cap. The first corpus query returned 997 reviews but omitted working-memory training, cognitive stimulation/rehabilitation, serious games and VR-cognitive terms. That gap was detected during screening, and the query was expanded before the final synthesis (deviation D10):

```
("cognitive training"[tiab] OR "computerized cognitive training"[tiab] OR
 "computerised cognitive training"[tiab] OR "cognitive remediation"[tiab] OR
 "brain training"[tiab] OR "brain-training"[tiab] OR "cognitive game"[tiab] OR
 "cognitive games"[tiab] OR "serious game"[tiab] OR "serious games"[tiab] OR
 "working memory training"[tiab] OR "memory training"[tiab] OR
 "cognitive stimulation"[tiab] OR "cognitive rehabilitation"[tiab] OR
 exergame[tiab] OR exergames[tiab] OR neurofeedback[tiab] OR "EEG biofeedback"[tiab] OR
 "binaural beat"[tiab] OR "binaural beats"[tiab] OR "monaural beat"[tiab] OR
 "isochronic tone"[tiab] OR "audio-visual entrainment"[tiab] OR
 "photic stimulation"[tiab] OR "brainwave entrainment"[tiab] OR
 "digital cognitive"[tiab] OR "computerized cognitive"[tiab] OR
 "virtual reality cognitive"[tiab] OR "VR cognitive"[tiab])
AND (systematic review[pt] OR meta-analysis[pt])
```

- Hits: **1,495**
- Retrieved: **1,495**
- Saved as: `records/pubmed_reviews_expanded.json`
- Intermediate 997-record set retained as: `records/pubmed_reviews_full.json`

The expanded set is the denominator for the umbrella review. The ten scoping searches remain the source for RCTs, safety records and population-specific trials.

---

## 4. OpenAlex citation chasing

Seed selection used PubMed IDs, not guessed DOIs. Seeds were chosen because they are recent, comprehensive syntheses across the main modalities:

| PMID | Seed |
|---|---|
| 39661381 | Neurofeedback for ADHD (JAMA Psychiatry 2025) |
| 40246295 | Consumer-grade neurofeedback with mindfulness (JMIR 2025) |
| 41016407 | Single and multidomain lifestyle interventions (Lancet Healthy Longevity 2025) |
| 42959097 | CCT transfer and durability in MCI (2026) |
| 42349368 | Theta binaural beats (Explore 2026) |
| 40581145 | Cogmed working-memory training (Neuroscience 2025) |
| 42711482 | Asymmetry of working-memory transfer (2026) |
| 37956054 | Cognitive training plus non-invasive brain stimulation (Psychological Bulletin 2024) |

Method:

```
GET https://api.openalex.org/works?filter=pmid:<PMID>
GET https://api.openalex.org/works?filter=cites:<openalex_work_id>&sort=cited_by_count:desc
```

- Seven of eight seeds matched an OpenAlex work.
- Forward citations retrieved: **112** (capped at 100 per seed).
- Saved as: `records/openalex_citations.json`

Four keyword searches were also run for coverage outside PubMed:

```
brain training cognition randomized
neurofeedback randomized sham
binaural beats cognition
multimodal cognitive training older adults
```

- Retrieved: **400** records (387 unique).
- Saved as: `records/supplemental.json`

OpenAlex was used for citation chasing and coverage, not as a second formal database. Its records were not independently screened with the same depth as PubMed.

---

## 5. ClinicalTrials.gov

Endpoint:

```
GET https://clinicaltrials.gov/api/v2/studies?query.term=<term>&pageSize=100
```

Search terms:

```
cognitive training
neurofeedback
binaural beats
exergame cognition
```

- Retrieved: **366** records, **363** unique.
- Intervention type: 350 interventional, 16 observational.
- Status: 177 completed, 59 recruiting, 57 unknown, 41 not yet recruiting, 13 active not recruiting, 9 withdrawn, 7 enrolling by invitation, 3 terminated.
- Records with results: **24**.
- Saved as: `records/supplemental.json` (trial block).

Registered trials without results were logged as ongoing and excluded from efficacy synthesis.

---

## 6. Known-item validation and landmark retrieval

A 14-item known-item list was used to test recall and to add the field's foundational trials:

| PMID | Landmark |
|---|---|
| 12424652 | Klingberg 2002, working-memory training in ADHD |
| 15689731 | Klingberg 2005, multicentre RCT |
| 17179457 | ACTIVE 5-year follow-up (Willis 2006) |
| 24417410 | ACTIVE 10-year follow-up (Rebok 2014) |
| 18443283 | Jaeggi 2008, n-back and fluid intelligence |
| 22612437 | Melby-Lervag & Hulme 2013 |
| 25102926 | Au 2015, n-back meta-analysis |
| 25771249 | FINGER multidomain trial (Ngandu 2015) |
| 26029120 | Chaieb 2015, auditory beat stimulation |
| 27238063 | Cortese 2016, neurofeedback for ADHD |
| 27474138 | Melby-Lervag, Redick & Hulme 2016 |
| 27697851 | Simons et al. 2016, best-practice review |
| 23360949 | Sonuga-Barke 2013, non-pharmacological ADHD |
| 30073406 | Garcia-Argibay 2019, binaural-beat meta-analysis |

Retrieval used author/topic queries and verified the returned title against the requested title. Eight of fourteen first-pass queries were accepted; the remainder were found with targeted author/year queries. The retrieval returned 15 records because one query resolved to the already-included JAMA Psychiatry review; that duplicate was not added twice. All accepted records are saved in `records/landmarks.json`.

---

## 7. Deduplication

- PubMed records were deduplicated by PMID, then by normalised title.
- Cross-source records were deduplicated by normalised title (lowercase, punctuation removed).
- DOI was not used as the primary dedupe key because several PubMed DOI fields were inconsistent with the article metadata.

Counts:

| Source | Records | Unique |
|---|---:|---:|
| PubMed scoping searches | 2,392 | 1,885 by title |
| OpenAlex citation + keyword | 494 | 475 new titles |
| **Bibliographic total** | — | **2,360** |
| ClinicalTrials.gov | 366 | 363 |
| PubMed review corpus | 997 | 997 (subset of the above) |

The review corpus is a subset of the PubMed scoping result set, not an additional source.

---

## 8. Screening rules

Title/abstract screening used the eligibility criteria in [PROTOCOL.md](PROTOCOL.md). The rule screen favoured sensitivity over specificity:

- **Include** if the record mentions an eligible modality, an eligible outcome, and a systematic review/meta-analysis/RCT design.
- **Exclude** bibliometric reviews, scoping reviews, narrative reviews, protocols, commentaries, errata and protocols without results.
- **Prioritise** records that cover a modality × population × outcome cell not already represented, plus records with a pre-registered protocol and a certainty assessment.

The rule screen is not a substitute for full-text review. The 84 extracted records are the synthesis set; the residual eligible records are logged in `analysis/screening_reviews.csv` for the next update.

---

## 9. Metadata verification

Every DOI in the evidence table was checked against Crossref:

- **73** verified (title similarity >= 0.90 against a Crossref record).
- **4** flagged as preprint versions (title matched a preprint, journal DOI unconfirmed).
- **7** unverified (no confident match); these are cited by PMID only.

The verification files are:

- `records/metadata_verification.json`
- `records/metadata_verification_extra.json`
- `records/metadata_verification_landmarks.json`
- `records/metadata_verification_landmarks_direct.json`
- `records/metadata_verification_gapfill.json`

A verified DOI is necessary but not sufficient for inclusion; the record must also pass eligibility.

---

## 10. Reproducibility notes

- All searches are HTTP GET requests to public APIs with no authentication.
- The exact strings are recorded above and in `records/*.json` (`term`/`query` fields).
- Counts are point-in-time; PubMed and OpenAlex indexes change.
- The collector scripts were one-off tools and are not part of the product. Re-running the strings above reproduces the search layer; the extraction table is the versioned artefact.
- Any future update must record the new date, new counts, changed conclusions and protocol deviations.
