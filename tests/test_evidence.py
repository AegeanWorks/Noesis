"""Tests for the Noesis evidence table and synthesis matrix."""

from __future__ import annotations

import copy
import json
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from noesis.review.evidence_schema import (  # noqa: E402
    DEFAULT_TABLE,
    EvidenceError,
    load_table,
    parse_entries,
)
from noesis.review.evidence_summary import summarize  # noqa: E402
from noesis.review.evidence_validate import validate_table  # noqa: E402

BASE_ENTRY = {
    "pmid": "12345678",
    "doi": "10.1000/test",
    "doi_status": "verified",
    "year": 2025,
    "journal": "Test Journal",
    "title": "A test review",
    "modality": "cct",
    "design": "sr_ma",
    "populations": ["older_adults"],
    "k": 10,
    "n": 1000,
    "comparators": ["active"],
    "outcomes": [{
        "domain": "global_cognition",
        "transfer": "near",
        "measure": "SMD",
        "value": 0.4,
        "ci_low": 0.2,
        "ci_high": 0.6,
        "favors": "intervention",
        "certainty": "moderate",
        "note": "",
    }],
    "findings": ["finding"],
    "limitations": ["limitation"],
    "flags": [],
    "synthesis_role": "primary",
    "product_use": "Use this as a design constraint for the first release.",
}


def table_with(*entries: dict) -> dict:
    return {"schema": 1, "entries": [copy.deepcopy(e) for e in entries]}


class RealTableTest(unittest.TestCase):
    def test_shipped_table_is_valid(self):
        self.assertEqual(validate_table(load_table()), [])

    def test_shipped_table_has_expected_shape(self):
        entries = parse_entries(load_table())
        self.assertGreaterEqual(len(entries), 50)
        self.assertTrue(any(e.synthesis_role == "primary" for e in entries))
        self.assertTrue(any(e.modality == "neurofeedback" for e in entries))

    def test_every_primary_row_has_a_product_use(self):
        for entry in parse_entries(load_table()):
            self.assertGreaterEqual(len(entry.product_use), 20, entry.pmid)


class SchemaTest(unittest.TestCase):
    def test_wrong_schema_version_is_reported(self):
        table = table_with(BASE_ENTRY)
        table["schema"] = 2
        self.assertTrue(any("schema must be 1" in p for p in validate_table(table)))

    def test_duplicate_pmid_is_reported(self):
        problems = validate_table(table_with(BASE_ENTRY, BASE_ENTRY))
        self.assertTrue(any("duplicate PMID" in p for p in problems))

    def test_unknown_modality_is_reported(self):
        entry = copy.deepcopy(BASE_ENTRY)
        entry["modality"] = "telepathy"
        problems = validate_table(table_with(entry))
        self.assertTrue(any("unknown modality" in p for p in problems))

    def test_unknown_certainty_is_reported(self):
        entry = copy.deepcopy(BASE_ENTRY)
        entry["outcomes"][0]["certainty"] = "quite_sure"
        problems = validate_table(table_with(entry))
        self.assertTrue(any("unknown certainty" in p for p in problems))

    def test_verified_doi_is_required(self):
        entry = copy.deepcopy(BASE_ENTRY)
        entry["doi"] = None
        problems = validate_table(table_with(entry))
        self.assertTrue(any("verified DOI row has no DOI" in p for p in problems))

    def test_unverified_row_must_not_carry_a_doi(self):
        entry = copy.deepcopy(BASE_ENTRY)
        entry["doi_status"] = "unverified"
        problems = validate_table(table_with(entry))
        self.assertTrue(any("must not carry a DOI" in p for p in problems))

    def test_year_outside_window_is_reported(self):
        entry = copy.deepcopy(BASE_ENTRY)
        entry["year"] = 1999
        problems = validate_table(table_with(entry))
        self.assertTrue(any("outside the review window" in p for p in problems))

    def test_missing_outcomes_is_reported(self):
        entry = copy.deepcopy(BASE_ENTRY)
        entry["outcomes"] = []
        problems = validate_table(table_with(entry))
        self.assertTrue(any("no outcome recorded" in p for p in problems))

    def test_reversed_confidence_bounds_are_reported(self):
        entry = copy.deepcopy(BASE_ENTRY)
        entry["outcomes"][0].update({"ci_low": 0.8, "ci_high": 0.2})
        problems = validate_table(table_with(entry))
        self.assertTrue(any("bounds are reversed" in p for p in problems))

    def test_point_estimate_outside_interval_is_reported(self):
        entry = copy.deepcopy(BASE_ENTRY)
        entry["outcomes"][0]["value"] = 0.9
        problems = validate_table(table_with(entry))
        self.assertTrue(any("outside its interval" in p for p in problems))

    def test_implausible_effect_forces_context_role(self):
        entry = copy.deepcopy(BASE_ENTRY)
        entry["flags"] = ["implausible_effect_size"]
        problems = validate_table(table_with(entry))
        self.assertTrue(any("force synthesis_role 'context'" in p for p in problems))

    def test_short_product_use_is_reported(self):
        entry = copy.deepcopy(BASE_ENTRY)
        entry["product_use"] = "later"
        problems = validate_table(table_with(entry))
        self.assertTrue(any("product_use is too short" in p for p in problems))


class LoadTest(unittest.TestCase):
    def test_missing_table_raises_with_repair_hint(self):
        with tempfile.TemporaryDirectory() as tmp:
            missing = Path(tmp) / "absent.json"
            with self.assertRaises(EvidenceError) as caught:
                load_table(missing)
            self.assertIn("evidence_table.json", caught.exception.fix)
            self.assertTrue(caught.exception.why)

    def test_invalid_json_raises_with_repair_hint(self):
        with tempfile.TemporaryDirectory() as tmp:
            bad = Path(tmp) / "bad.json"
            bad.write_text("{not json", encoding="utf-8")
            with self.assertRaises(EvidenceError) as caught:
                load_table(bad)
            self.assertIn("invalid JSON", caught.exception.why)
            self.assertTrue(caught.exception.fix)


class SummaryTest(unittest.TestCase):
    def test_clinical_conditions_are_not_merged(self):
        a = copy.deepcopy(BASE_ENTRY)
        a["pmid"] = "11111111"
        a["populations"] = ["clinical:adhd"]
        b = copy.deepcopy(BASE_ENTRY)
        b["pmid"] = "22222222"
        b["populations"] = ["clinical:stroke"]
        rows = summarize(parse_entries(table_with(a, b)))
        self.assertEqual({row.population for row in rows}, {"clinical:adhd", "clinical:stroke"})

    def test_context_rows_are_excluded_from_the_matrix(self):
        entry = copy.deepcopy(BASE_ENTRY)
        entry["synthesis_role"] = "context"
        self.assertEqual(summarize(parse_entries(table_with(entry))), ())

    def test_conflicting_certainty_blocks_supported_stance(self):
        a = copy.deepcopy(BASE_ENTRY)
        a["pmid"] = "11111111"
        a["flags"] = ["certainty_conflict"]
        b = copy.deepcopy(BASE_ENTRY)
        b["pmid"] = "22222222"
        rows = summarize(parse_entries(table_with(a, b)))
        self.assertEqual(rows[0].stance, "experimental")

    def test_two_clean_entries_reach_supported(self):
        a = copy.deepcopy(BASE_ENTRY)
        a["pmid"] = "11111111"
        b = copy.deepcopy(BASE_ENTRY)
        b["pmid"] = "22222222"
        rows = summarize(parse_entries(table_with(a, b)))
        self.assertEqual(rows[0].stance, "supported")

    def test_null_outcome_produces_mixed_stance(self):
        a = copy.deepcopy(BASE_ENTRY)
        a["pmid"] = "11111111"
        a["outcomes"][0]["favors"] = "neither"
        b = copy.deepcopy(BASE_ENTRY)
        b["pmid"] = "22222222"
        rows = summarize(parse_entries(table_with(a, b)))
        self.assertEqual(rows[0].stance, "mixed")


if __name__ == "__main__":
    unittest.main()
