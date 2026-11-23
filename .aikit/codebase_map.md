# Codebase Map & Symbol Catalog 🗺️

> **AUTO-GENERATED & VERIFIED BY `scripts/update_knowledge_base.py`**
> This document catalogues Python modules, classes, and exported functions. See Map Coverage for any stack it does not index.

---

## 📊 Codebase Metrics
- **Total Python Modules**: `9`
- **Total Classes**: `9`
- **Total Top-Level Functions**: `20`
- **Total Class Methods**: `34`
- **Total Source Lines**: `795`

## 🧭 Map Coverage
- **Indexed**: python (`9` module(s))
- **Not indexed by this map**: java (`3` file(s)), typescript (`150` file(s))

> Only Python symbols are catalogued. A language above is reported as not indexed, never as verified by this map.

---

## 📦 Modules & Exported Symbols

### [`noesis/__init__.py`](noesis/__init__.py)
> *Noesis: an evidence-led multimodal brain-training platform.*

**Size**: `3` lines

---

### [`noesis/__main__.py`](noesis/__main__.py)
> *Command line entry point: `python -m noesis review <command>`.*

**Size**: `87` lines

**Functions:**
- `def _build_parser()`
- `def _report(error)`
- `def _check(table_path)`
- `def _summary(table_path, as_json)`
- `def main(argv)`

---

### [`noesis/review/__init__.py`](noesis/review/__init__.py)
> *Evidence review tooling: schema, validation and summaries.*

**Size**: `1` lines

---

### [`noesis/review/evidence_schema.py`](noesis/review/evidence_schema.py)
> *Controlled vocabulary and record types for the Noesis evidence table.*

**Size**: `152` lines

**Classes:**
- `class EvidenceError` - *Raised when the evidence table cannot be read or breaks the schema.*
  - Method `.__init__(message, why, fix)`
- `class Outcome`
- `class Entry`

**Functions:**
- `def load_table(path)` - *Read the evidence table JSON, or raise EvidenceError with a repair hint.*
- `def parse_entry(raw)` - *Convert one raw record into an Entry; missing required fields raise KeyError.*
- `def parse_entries(table)` - *Parse every record; an incomplete record raises EvidenceError.*

---

### [`noesis/review/evidence_summary.py`](noesis/review/evidence_summary.py)
> *Modality-by-population synthesis used by the review report.*

**Size**: `116` lines

**Classes:**
- `class SummaryRow`

**Functions:**
- `def _best_certainty(outcomes)`
- `def _stance(group, benefit, null, harm, best)`
- `def summarize(entries)` - *One row per intervention modality and exact population stratum.*
- `def _sort_key(item)`
- `def cross_cutting(entries)` - *Engagement and safety rows, reported separately from efficacy claims.*
- `def render_matrix(rows)` - *Render the intervention matrix as a compact fixed-width table.*

---

### [`noesis/review/evidence_validate.py`](noesis/review/evidence_validate.py)
> *Structural and integrity checks for the Noesis evidence table.*

**Size**: `104` lines

**Functions:**
- `def _check_vocab(entry, problems)`
- `def _check_outcomes(entry, problems)`
- `def _check_integrity(entry, problems)`
- `def validate_table(table)` - *Return every schema or integrity problem; an empty list means the table passes.*
- `def primary_entries(entries)` - *Rows allowed to drive product requirements.*

---

### [`tests/__init__.py`](tests/__init__.py)
> *Noesis test package.*

**Size**: `1` lines

---

### [`tests/test_evidence.py`](tests/test_evidence.py)
> *Tests for the Noesis evidence table and synthesis matrix.*

**Size**: `210` lines

**Classes:**
- `class RealTableTest`
  - Method `.test_shipped_table_is_valid()`
  - Method `.test_shipped_table_has_expected_shape()`
  - Method `.test_every_primary_row_has_a_product_use()`
- `class SchemaTest`
  - Method `.test_wrong_schema_version_is_reported()`
  - Method `.test_duplicate_pmid_is_reported()`
  - Method `.test_unknown_modality_is_reported()`
  - Method `.test_unknown_certainty_is_reported()`
  - Method `.test_verified_doi_is_required()`
  - Method `.test_unverified_row_must_not_carry_a_doi()`
  - Method `.test_year_outside_window_is_reported()`
  - Method `.test_missing_outcomes_is_reported()`
  - Method `.test_reversed_confidence_bounds_are_reported()`
  - Method `.test_point_estimate_outside_interval_is_reported()`
  - Method `.test_implausible_effect_forces_context_role()`
  - Method `.test_short_product_use_is_reported()`
- `class LoadTest`
  - Method `.test_missing_table_raises_with_repair_hint()`
  - Method `.test_invalid_json_raises_with_repair_hint()`
- `class SummaryTest`
  - Method `.test_clinical_conditions_are_not_merged()`
  - Method `.test_context_rows_are_excluded_from_the_matrix()`
  - Method `.test_conflicting_certainty_blocks_supported_stance()`
  - Method `.test_two_clean_entries_reach_supported()`
  - Method `.test_null_outcome_produces_mixed_stance()`

**Functions:**
- `def table_with(*entries)`

---

### [`tests/test_review_snapshot.py`](tests/test_review_snapshot.py)
> *Snapshot checks for the current evidence review.*

**Size**: `121` lines

**Classes:**
- `class ReviewSnapshotTest`
  - Method `.setUpClass()`
  - Method `.test_trial_dossier_lists_every_focus_test()`
  - Method `.test_data_dictionary_defines_span_metrics()`
  - Method `.test_research_readme_counts_match_the_table()`
  - Method `.test_record_and_outcome_totals()`
  - Method `.test_synthesis_role_split()`
  - Method `.test_modality_split()`
  - Method `.test_identifier_status_split()`
  - Method `.test_no_duplicate_pmids()`
  - Method `.test_references_cover_every_table_record()`
  - Method `.test_bibtex_entry_count_matches_table()`

---
