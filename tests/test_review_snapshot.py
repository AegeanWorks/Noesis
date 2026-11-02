"""Snapshot checks for the frozen v1.0 evidence review.

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

    def test_record_and_outcome_totals(self):
        self.assertEqual(len(self.entries), 105)
        self.assertEqual(sum(len(entry.outcomes) for entry in self.entries), 266)

    def test_synthesis_role_split(self):
        roles = Counter(entry.synthesis_role for entry in self.entries)
        self.assertEqual(roles["primary"], 83)
        self.assertEqual(roles["context"], 22)

    def test_modality_split(self):
        modalities = Counter(entry.modality for entry in self.entries)
        self.assertEqual(modalities["cct"], 36)
        self.assertEqual(modalities["neurofeedback"], 17)
        self.assertEqual(modalities["multimodal"], 17)
        self.assertEqual(modalities["ave"], 6)
        self.assertEqual(modalities["multi_intervention"], 5)
        self.assertEqual(modalities["safety"], 6)
        self.assertEqual(modalities["engagement"], 18)

    def test_identifier_status_split(self):
        status = Counter(entry.doi_status for entry in self.entries)
        self.assertEqual(status["verified"], 94)
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
