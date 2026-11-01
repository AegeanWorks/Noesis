"""Command line entry point: `python -m noesis review <command>`."""

from __future__ import annotations

import argparse
import json
import sys
from typing import Sequence

from .review.evidence_schema import EvidenceError, load_table, parse_entries
from .review.evidence_summary import cross_cutting, render_matrix, summarize
from .review.evidence_validate import validate_table

EXIT_OK = 0
EXIT_INVALID = 1
EXIT_USAGE = 2


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="noesis", description="Noesis evidence review tools.")
    sub = parser.add_subparsers(dest="command", required=True)
    review = sub.add_parser("review", help="inspect and check the evidence table")
    review_sub = review.add_subparsers(dest="review_command", required=True)
    for name, help_text in (("check", "validate the evidence table"),
                            ("summary", "print the modality-by-population matrix")):
        cmd = review_sub.add_parser(name, help=help_text)
        cmd.add_argument("--table", default=None, help="path to evidence_table.json")
    review_sub.choices["summary"].add_argument("--json", action="store_true",
                                               help="emit machine-readable rows")
    return parser


def _report(error: EvidenceError) -> int:
    print(f"Error: {error.message}", file=sys.stderr)
    print(f"Why: {error.why}", file=sys.stderr)
    print(f"Fix: {error.fix}", file=sys.stderr)
    return EXIT_USAGE


def _check(table_path: str | None) -> int:
    table = load_table(table_path)
    problems = validate_table(table)
    if problems:
        print(f"Evidence table failed {len(problems)} check(s):", file=sys.stderr)
        for problem in problems:
            print(f"  - {problem}", file=sys.stderr)
        print("Fix: correct the records above, then rerun `python -m noesis review check`.",
              file=sys.stderr)
        return EXIT_INVALID
    entries = parse_entries(table)
    primary = sum(1 for e in entries if e.synthesis_role == "primary")
    print(f"[OK] {len(entries)} records validated ({primary} primary, "
          f"{len(entries) - primary} context).")
    return EXIT_OK


def _summary(table_path: str | None, as_json: bool) -> int:
    entries = parse_entries(load_table(table_path))
    rows = summarize(entries)
    extra = cross_cutting(entries)
    if as_json:
        payload = {
            "interventions": [row.__dict__ for row in rows],
            "cross_cutting": [
                {"pmid": e.pmid, "modality": e.modality, "title": e.title}
                for e in extra
            ],
        }
        print(json.dumps(payload, indent=2))
        return EXIT_OK
    print(render_matrix(rows))
    print(f"\nCross-cutting (not efficacy claims): {len(extra)} engagement/safety records")
    return EXIT_OK


def main(argv: Sequence[str] | None = None) -> int:
    args = _build_parser().parse_args(argv)
    try:
        if args.review_command == "check":
            return _check(args.table)
        return _summary(args.table, args.json)
    except EvidenceError as error:
        return _report(error)


if __name__ == "__main__":
    raise SystemExit(main())
