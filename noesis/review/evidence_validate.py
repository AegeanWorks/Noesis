"""Structural and integrity checks for the Noesis evidence table."""

from __future__ import annotations

from typing import Any, Iterable, Mapping

from .evidence_schema import (
    CERTAINTIES,
    DESIGNS,
    DOI_STATUSES,
    DOMAINS,
    FAVORS,
    MODALITIES,
    ROLES,
    SCHEMA_VERSION,
    TRANSFERS,
    Entry,
    parse_entries,
)

CONTEXT_ONLY_FLAGS = frozenset({"implausible_effect_size", "do_not_pool"})
MIN_PRODUCT_USE = 20


def _check_vocab(entry: Entry, problems: list[str]) -> None:
    if entry.modality not in MODALITIES:
        problems.append(f"{entry.pmid}: unknown modality '{entry.modality}'")
    if entry.design not in DESIGNS:
        problems.append(f"{entry.pmid}: unknown design '{entry.design}'")
    if entry.synthesis_role not in ROLES:
        problems.append(f"{entry.pmid}: unknown synthesis role '{entry.synthesis_role}'")
    if entry.doi_status not in DOI_STATUSES:
        problems.append(f"{entry.pmid}: unknown DOI status '{entry.doi_status}'")
    if not entry.populations:
        problems.append(f"{entry.pmid}: no population stratum")
    if len(entry.product_use.strip()) < MIN_PRODUCT_USE:
        problems.append(f"{entry.pmid}: product_use is too short to be meaningful")


def _check_outcomes(entry: Entry, problems: list[str]) -> None:
    if not entry.outcomes:
        problems.append(f"{entry.pmid}: no outcome recorded")
    for outcome in entry.outcomes:
        label = f"{entry.pmid}/{outcome.domain}"
        if outcome.domain not in DOMAINS:
            problems.append(f"{label}: unknown domain")
        if outcome.transfer not in TRANSFERS:
            problems.append(f"{label}: unknown transfer type '{outcome.transfer}'")
        if outcome.favors not in FAVORS:
            problems.append(f"{label}: unknown direction '{outcome.favors}'")
        if outcome.certainty not in CERTAINTIES:
            problems.append(f"{label}: unknown certainty '{outcome.certainty}'")
        low, high = outcome.ci_low, outcome.ci_high
        if (low is None) != (high is None):
            problems.append(f"{label}: only one confidence bound is recorded")
        if low is not None and high is not None and low > high:
            problems.append(f"{label}: confidence bounds are reversed")
        if outcome.value is not None and low is not None and high is not None:
            if not low <= outcome.value <= high:
                problems.append(f"{label}: point estimate lies outside its interval")


def _check_integrity(entry: Entry, problems: list[str]) -> None:
    if not entry.pmid.isdigit():
        problems.append(f"{entry.pmid}: PMID must be numeric")
    if not 2000 <= entry.year <= 2026:
        problems.append(f"{entry.pmid}: year {entry.year} is outside the review window")
    if entry.doi_status == "verified" and not entry.doi:
        problems.append(f"{entry.pmid}: verified DOI row has no DOI")
    if entry.doi_status != "verified" and entry.doi and entry.doi_status == "unverified":
        problems.append(f"{entry.pmid}: unverified row must not carry a DOI")
    context_flags = CONTEXT_ONLY_FLAGS.intersection(entry.flags)
    if context_flags and entry.synthesis_role != "context":
        problems.append(
            f"{entry.pmid}: flags {sorted(context_flags)} force synthesis_role 'context'"
        )


def validate_table(table: Mapping[str, Any]) -> list[str]:
    """Return every schema or integrity problem; an empty list means the table passes."""
    problems: list[str] = []
    if table.get("schema") != SCHEMA_VERSION:
        problems.append(f"schema must be {SCHEMA_VERSION}, found {table.get('schema')!r}")
    raw_entries = table.get("entries")
    if not isinstance(raw_entries, list) or not raw_entries:
        return problems + ["table has no entries"]
    try:
        entries = parse_entries(table)
    except Exception as exc:  # noqa: BLE001 - converted into a reported problem
        return problems + [str(exc)]
    seen: set[str] = set()
    for entry in entries:
        if entry.pmid in seen:
            problems.append(f"{entry.pmid}: duplicate PMID")
        seen.add(entry.pmid)
        _check_vocab(entry, problems)
        _check_integrity(entry, problems)
        _check_outcomes(entry, problems)
    return problems


def primary_entries(entries: Iterable[Entry]) -> tuple[Entry, ...]:
    """Rows allowed to drive product requirements."""
    return tuple(entry for entry in entries if entry.synthesis_role == "primary")
