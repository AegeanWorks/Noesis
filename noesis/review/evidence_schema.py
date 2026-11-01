"""Controlled vocabulary and record types for the Noesis evidence table."""

from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Mapping

SCHEMA_VERSION = 1
DEFAULT_TABLE = (
    Path(__file__).resolve().parents[2]
    / "docs"
    / "research"
    / "analysis"
    / "evidence_table.json"
)

MODALITIES = frozenset({
    "cct", "neurofeedback", "ave", "multimodal",
    "multi_intervention", "engagement", "safety",
})
DESIGNS = frozenset({"sr_ma", "nma", "sr", "umbrella", "rct"})
TRANSFERS = frozenset({"near", "far", "na"})
FAVORS = frozenset({"intervention", "control", "neither", "mixed", "harm"})
CERTAINTIES = frozenset({"high", "moderate", "low", "very_low", "not_reported"})
ROLES = frozenset({"primary", "context"})
DOI_STATUSES = frozenset({"verified", "preprint", "unverified"})
DOMAINS = frozenset({
    "global_cognition", "working_memory", "verbal_memory", "episodic_memory",
    "visuospatial_memory", "attention", "inhibition", "executive_function",
    "processing_speed", "language", "academic", "daily_function", "quality_of_life",
    "depression", "anxiety", "rumination", "adhd_symptoms", "ptsd_symptoms",
    "clinical_symptoms", "sleep", "pain",
    "autonomic", "gait_balance", "motor_function", "frailty", "caregiver_burden",
    "physical_activity", "adherence", "adverse_events", "sport_performance",
    "neural", "behaviour", "mindfulness",
})


class EvidenceError(Exception):
    """Raised when the evidence table cannot be read or breaks the schema."""

    def __init__(self, message: str, why: str, fix: str) -> None:
        super().__init__(message)
        self.message = message
        self.why = why
        self.fix = fix


@dataclass(frozen=True)
class Outcome:
    domain: str
    transfer: str
    measure: str
    value: float | None
    ci_low: float | None
    ci_high: float | None
    favors: str
    certainty: str
    note: str


@dataclass(frozen=True)
class Entry:
    pmid: str
    doi: str | None
    doi_status: str
    year: int
    journal: str
    title: str
    modality: str
    design: str
    populations: tuple[str, ...]
    k: int | None
    n: int | None
    comparators: tuple[str, ...]
    outcomes: tuple[Outcome, ...]
    findings: tuple[str, ...]
    limitations: tuple[str, ...]
    flags: tuple[str, ...]
    synthesis_role: str
    product_use: str


def load_table(path: Path | str | None = None) -> dict[str, Any]:
    """Read the evidence table JSON, or raise EvidenceError with a repair hint."""
    table_path = Path(path) if path is not None else DEFAULT_TABLE
    if not table_path.is_file():
        raise EvidenceError(
            f"Evidence table not found: {table_path}",
            "the review cannot be checked without its machine-readable table.",
            "restore docs/research/analysis/evidence_table.json or pass --table.",
        )
    try:
        return json.loads(table_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise EvidenceError(
            f"Evidence table is unreadable: {exc}",
            "invalid JSON makes every downstream count and claim untraceable.",
            "fix the JSON syntax at the reported position, then rerun the check.",
        ) from exc


def parse_entry(raw: Mapping[str, Any]) -> Entry:
    """Convert one raw record into an Entry; missing required fields raise KeyError."""
    outcomes = tuple(
        Outcome(
            domain=str(item["domain"]),
            transfer=str(item["transfer"]),
            measure=str(item["measure"]),
            value=item.get("value"),
            ci_low=item.get("ci_low"),
            ci_high=item.get("ci_high"),
            favors=str(item["favors"]),
            certainty=str(item["certainty"]),
            note=str(item.get("note", "")),
        )
        for item in raw["outcomes"]
    )
    return Entry(
        pmid=str(raw["pmid"]),
        doi=raw.get("doi"),
        doi_status=str(raw["doi_status"]),
        year=int(raw["year"]),
        journal=str(raw["journal"]),
        title=str(raw["title"]),
        modality=str(raw["modality"]),
        design=str(raw["design"]),
        populations=tuple(str(p) for p in raw["populations"]),
        k=raw.get("k"),
        n=raw.get("n"),
        comparators=tuple(str(c) for c in raw["comparators"]),
        outcomes=outcomes,
        findings=tuple(str(f) for f in raw["findings"]),
        limitations=tuple(str(lim) for lim in raw["limitations"]),
        flags=tuple(str(f) for f in raw["flags"]),
        synthesis_role=str(raw["synthesis_role"]),
        product_use=str(raw["product_use"]),
    )


def parse_entries(table: Mapping[str, Any]) -> tuple[Entry, ...]:
    """Parse every record; an incomplete record raises EvidenceError."""
    try:
        return tuple(parse_entry(raw) for raw in table["entries"])
    except (KeyError, TypeError, ValueError) as exc:
        raise EvidenceError(
            f"Evidence record is incomplete: {exc}",
            "every synthesis row must carry its identifier, design, outcomes and product use.",
            "add the missing field to the record named in the error, then rerun the check.",
        ) from exc
