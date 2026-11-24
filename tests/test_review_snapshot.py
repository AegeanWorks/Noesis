"""Snapshot checks for the current evidence review.

These counts are quoted in the review prose. If the table changes, this test
must change deliberately in the same commit as the prose.
"""

from __future__ import annotations

import re
import sys
import unittest
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from noesis.review.evidence_schema import load_table, parse_entries  # noqa: E402


class ReviewSnapshotTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.entries = parse_entries(load_table())

    def test_trial_dossier_lists_every_focus_test(self):
        focus_tests = (
            "Task Switch",
            "Flanker",
            "Spatial Span",
            "Mental Rotation",
            "Prospective Memory",
            "Paired Associates",
            "Change Detection",
            "Visual Search",
            "Digit Symbol",
            "Digit Span",
        )
        for rel in (
            "docs/research/TRIAL_READINESS.md",
            "docs/research/DESIGN_IMPLICATIONS.md",
        ):
            doc = (ROOT / rel).read_text(encoding="utf-8")
            for name in focus_tests:
                self.assertIn(name, doc, f"{name} missing from {rel}")

    def test_data_dictionary_defines_span_metrics(self):
        dictionary = (ROOT / "docs" / "research" / "DATA_DICTIONARY.md").read_text(
            encoding="utf-8"
        )
        for field in (
            "mean_span",
            "max_span",
            "forward_accuracy",
            "backward_accuracy",
        ):
            self.assertIn(field, dictionary)

    def test_research_readme_counts_match_the_table(self):
        readme = (ROOT / "docs" / "research" / "README.md").read_text(encoding="utf-8")
        match = re.search(
            r"\*\*Records:\*\* (\d+) included \((\d+) primary, (\d+) context\), (\d+) outcomes",
            readme,
        )
        self.assertIsNotNone(match, "records line missing from research README")
        assert match is not None
        roles = Counter(entry.synthesis_role for entry in self.entries)
        self.assertEqual(
            (int(match.group(1)), int(match.group(4))),
            (len(self.entries), sum(len(entry.outcomes) for entry in self.entries)),
        )
        self.assertEqual(
            (int(match.group(2)), int(match.group(3))),
            (roles["primary"], roles["context"]),
        )

    def test_record_and_outcome_totals(self):
        self.assertEqual(len(self.entries), 223)
        self.assertEqual(sum(len(entry.outcomes) for entry in self.entries), 488)

    def test_synthesis_role_split(self):
        roles = Counter(entry.synthesis_role for entry in self.entries)
        self.assertEqual(roles["primary"], 103)
        self.assertEqual(roles["context"], 120)

    def test_modality_split(self):
        modalities = Counter(entry.modality for entry in self.entries)
        self.assertEqual(modalities["cct"], 106)
        self.assertEqual(modalities["neurofeedback"], 21)
        self.assertEqual(modalities["multimodal"], 19)
        self.assertEqual(modalities["ave"], 7)
        self.assertEqual(modalities["multi_intervention"], 16)
        self.assertEqual(modalities["safety"], 8)
        self.assertEqual(modalities["engagement"], 46)

    def test_identifier_status_split(self):
        status = Counter(entry.doi_status for entry in self.entries)
        self.assertEqual(status["verified"], 212)
        self.assertEqual(status["preprint"], 4)
        self.assertEqual(status["unverified"], 7)

    def test_no_duplicate_pmids(self):
        pmids = [entry.pmid for entry in self.entries]
        self.assertEqual(len(pmids), len(set(pmids)))

    def test_references_cover_every_table_record(self):
        text = (ROOT / "docs" / "research" / "REFERENCES.md").read_text(encoding="utf-8")
        cited = set(re.findall(r"PMID: \[(\d+)\]", text))
        table_pmids = {entry.pmid for entry in self.entries}
        self.assertEqual(cited, table_pmids)

    def test_bibtex_entry_count_matches_table(self):
        text = (ROOT / "docs" / "research" / "REFERENCES.bib").read_text(encoding="utf-8")
        self.assertEqual(text.count("@article{"), len(self.entries))


if __name__ == "__main__":
    unittest.main()


