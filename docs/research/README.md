# Noesis Evidence Review

**Status:** v1.0 corpus complete; current review revision v2.64 (2026-11-24) with targeted UX, data-collection, export, new-game, working-memory residual-extraction, visual-search, adherence, everyday-function, clinical-boundary, game-design, multimodal, expectancy, clinical-mood, serious-game, data-reuse, far-transfer, metacognition, visual-search-context, JOL-reactivity, motivation, game-factor, spatial-training, action-game, inhibition-paradigm, visual-search-mechanism, incentive-design, autonomy, reward-context, dropout-feasibility, measure-validity, data-governance, monitoring-accuracy, UFOV-training, engagement-process, commercial-program, dual-task, dual-task-comparison, placebo, planning-cue, reward-mechanism, transfer-foundation, residual-transfer, active-control, clinical-claim, prospective-review, neuroimaging-mechanism and episodic-memory-review and child-age-boundary and game-design-context and mood-boundary and EF-taxonomy and prognostic-boundary and dementia-boundary and prospective-ecology and everyday-boundary and EF-subdomain and leisure-game and commercial-game and ADHD-boundary and neural-mechanism and child-WM and everyday-generalization and real-world and clinical-value and visual-safety and diagnostic-boundary and single-component and motor-boundary and exergaming-cognition, SCD-intervention and dementia-clinical-significance updates, AI-assisted, internally pre-registered
**Search date:** 2026-10-31; targeted updates 2026-11-08, 2026-11-22 and 2026-11-23
**Records:** 213 included (103 primary, 110 context), 468 outcomes
**Review type:** PRISMA 2020 systematic umbrella review with landmark-RCT update

---

## What this is

This folder is the evidence base for Noesis, a multimodal brain-training platform. It asks which modality produces which outcome, for whom, against which comparator, at what dose, with what certainty and safety constraints. It is deliberately conservative: it separates near transfer from far transfer, active from passive controls, and blinded from unblinded outcomes.

It is **not** a clinical guideline, a regulatory submission, or medical advice.

---

## Bottom line

- Cognitive training improves what it trains and produces short-term near transfer; broad far transfer is not established.
- Neurofeedback for ADHD has no significant probably blinded effect; consumer neurofeedback has no cognitive benefit.
- Binaural beats may reduce anxiety and pain; cognitive enhancement is not supported.
- Exercise plus cognitive training has the most consistent small effect in older adults, but is not proven to be synergistic.
- Photosensitive seizure risk is a hard design constraint.
- The defensible product is a measurement-rich, domain-specific system with narrow claims, not a "brain score" or an IQ booster.

Read [SYNTHESIS.md](SYNTHESIS.md) for the full argument.

---

## File map

| File | Purpose |
|---|---|
| [PROTOCOL.md](PROTOCOL.md) | Pre-registered review protocol, PICOs, eligibility, synthesis rules, deviations |
| [SEARCH_STRATEGY.md](SEARCH_STRATEGY.md) | Exact search strings, databases, dates, limits, dedupe rules |
| [SEARCH_LOG.md](SEARCH_LOG.md) | Execution counts, screening numbers, metadata verification, deviations |
| [PRISMA_FLOW.md](PRISMA_FLOW.md) | PRISMA 2020 flow and item-by-item checklist |
| [SYNTHESIS.md](SYNTHESIS.md) | Main evidence synthesis, population findings, claim ladder |
| [DESIGN_IMPLICATIONS.md](DESIGN_IMPLICATIONS.md) | Product requirements traceable to evidence |
| [BEHAVIORAL_ENGAGEMENT.md](BEHAVIORAL_ENGAGEMENT.md) | Bounded Motivation mode integration of Noesis behavioral mechanics, with evidence caveats and safeguards |
| [NEW_MECHANIC_CANDIDATES.md](NEW_MECHANIC_CANDIDATES.md) | Literature scan and decision matrix for new cognitive-training tasks |
| [PRACTICE_MENU_AND_BRIEFING.md](PRACTICE_MENU_AND_BRIEFING.md) | Literature basis for the test-selection menu, local history and pre-test briefing |
| [DATA_COLLECTION_AND_CONSENT.md](DATA_COLLECTION_AND_CONSENT.md) | Literature basis for e-consent, local research data sharing and the email return path |
| [ADHERENCE_LOGGING.md](ADHERENCE_LOGGING.md) | Literature basis for session starts, completions and early-ending logging |
| [DATA_EXPORT_AND_REUSE.md](DATA_EXPORT_AND_REUSE.md) | FAIR/data-reuse basis for the JSON manifest and CSV exports |
| [DATA_DICTIONARY.md](DATA_DICTIONARY.md) | Field-level dictionary for the JSON export and both CSV layouts |
| [TRIAL_READINESS.md](TRIAL_READINESS.md) | Investigator-facing trial dossier: arms, data schema, safety monitoring |
| [SAFETY_AND_REGULATION.md](SAFETY_AND_REGULATION.md) | Seizure, exercise, audio, EEG, data and regulatory constraints |
| [REFERENCES.md](REFERENCES.md) | All included records with PMIDs and verified DOIs |
| [REFERENCES.bib](REFERENCES.bib) | BibTeX for the included records |
| [analysis/evidence_table.json](analysis/evidence_table.json) | Machine-readable evidence table (213 records, 468 outcomes) |
| [analysis/screening_reviews.csv](analysis/screening_reviews.csv) | Rule-based screen of the 1,495-review PubMed corpus |
| [analysis/screening_summary.json](analysis/screening_summary.json) | Screening counts |
| [records/](records/) | Raw PubMed, OpenAlex, trial-registry and metadata-verification records |

---

## How to validate

From the project root:

```bash
python -m noesis review check
python -m noesis review summary
python -m unittest discover -s tests -t .
```

`review check` validates schema, vocabulary, identifiers, confidence intervals, effect-size plausibility flags and synthesis roles. `review summary` prints the modality-by-population matrix. The test suite covers the validator and the matrix logic.

The evidence table is the source of truth. If a count or claim in the Markdown disagrees with the table, the table wins and the prose is a bug.

---

## How to update

1. Add or change a record in `analysis/evidence_table.json`.
2. Verify the DOI against Crossref; set `doi_status` to `verified`, `preprint` or `unverified`.
3. Run `python -m noesis review check`.
4. Regenerate `REFERENCES.md` if identifiers changed.
5. Update `SYNTHESIS.md` and any affected requirement in `DESIGN_IMPLICATIONS.md`.
6. Record the change and the new search date in `SEARCH_LOG.md`.
7. If the conclusion changes, add an entry to the project decisions log.
8. If the research-consent text changes, increment `RESEARCH_CONSENT_VERSION` in
   `src/storage/researchConsent.ts`; stored records become stale and the user is asked to
   review the current version again. Record the change in `DATA_COLLECTION_AND_CONSENT.md`.

A quarterly update is planned. Each update must record the new search date, new records, changed conclusions and protocol deviations.

---

## Scope and limitations

- AI-assisted: no independent human dual screening, no independent GRADE, no full-text appraisal of all records.
- The 1,495-review PubMed corpus is screened by rule; 973 rule-eligible and 446 rule-excluded reviews were not extracted (logged, prioritised for the next update). The 2026-11-22 targeted update extracted eight working-memory reviews from that residual pool; 922 eligible reviews remain unextracted (deviation D7, partially closed).
- English-language only; no direct PsycINFO, Embase, CINAHL or ERIC search.
- Certainty is source-reported and provisional.
- Several included reviews report implausible effect sizes; they are flagged and excluded from planning.
- The field moves quickly; this is a 2026-10-31 snapshot.
