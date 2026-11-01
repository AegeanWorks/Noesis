"""Modality-by-population synthesis used by the review report.

The matrix is a navigation aid, not a pooled estimate. It never merges clinical
conditions, and a row is only labelled `supported` when no integrity flag casts
doubt on its best-certainty source.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Iterable

from .evidence_schema import Entry, Outcome

CERTAINTY_RANK = {"high": 4, "moderate": 3, "low": 2, "very_low": 1, "not_reported": 0}
INTERVENTION_MODALITIES = ("cct", "neurofeedback", "ave", "multimodal")
CROSS_CUTTING_MODALITIES = ("engagement", "safety")
SUPPORT_BLOCKING_FLAGS = frozenset({
    "certainty_conflict", "implausible_effect_size", "active_equals_passive",
    "trivial_effect_size", "composite_driven", "do_not_pool", "control_superior",
    "source_sign_inconsistency",
})


@dataclass(frozen=True)
class SummaryRow:
    modality: str
    population: str
    entries: int
    benefit_outcomes: int
    null_outcomes: int
    harm_outcomes: int
    best_certainty: str
    stance: str
    domains: tuple[str, ...]


def _best_certainty(outcomes: Iterable[Outcome]) -> str:
    return max((o.certainty for o in outcomes), key=lambda c: CERTAINTY_RANK.get(c, 0),
               default="not_reported")


def _stance(group: list[Entry], benefit: int, null: int, harm: int, best: str) -> str:
    blocking = any(SUPPORT_BLOCKING_FLAGS.intersection(e.flags) for e in group)
    if harm and not benefit:
        return "harm_signal"
    if benefit and (null or harm):
        return "mixed"
    if not benefit:
        return "no_effect"
    if best in {"high", "moderate"} and len(group) >= 2 and not blocking:
        return "supported"
    return "experimental"


def summarize(entries: Iterable[Entry]) -> tuple[SummaryRow, ...]:
    """One row per intervention modality and exact population stratum."""
    groups: dict[tuple[str, str], list[Entry]] = {}
    for entry in entries:
        if entry.synthesis_role != "primary":
            continue
        if entry.modality not in INTERVENTION_MODALITIES:
            continue
        for label in entry.populations:
            groups.setdefault((entry.modality, label), []).append(entry)
    rows: list[SummaryRow] = []
    for (modality, population), group in sorted(groups.items(), key=_sort_key):
        outcomes = [o for entry in group for o in entry.outcomes]
        benefit = sum(1 for o in outcomes if o.favors == "intervention")
        null = sum(1 for o in outcomes if o.favors in {"neither", "control"})
        harm = sum(1 for o in outcomes if o.favors == "harm")
        best = _best_certainty(outcomes)
        rows.append(SummaryRow(
            modality=modality,
            population=population,
            entries=len(group),
            benefit_outcomes=benefit,
            null_outcomes=null,
            harm_outcomes=harm,
            best_certainty=best,
            stance=_stance(group, benefit, null, harm, best),
            domains=tuple(sorted({o.domain for o in outcomes})),
        ))
    return tuple(rows)


def _sort_key(item: tuple[tuple[str, str], list[Entry]]) -> tuple[int, str, str]:
    (modality, population) = item[0]
    clinical = 1 if population.startswith("clinical:") else 0
    modality_rank = INTERVENTION_MODALITIES.index(modality)
    return (modality_rank, clinical, population)


def cross_cutting(entries: Iterable[Entry]) -> tuple[Entry, ...]:
    """Engagement and safety rows, reported separately from efficacy claims."""
    return tuple(
        e for e in entries
        if e.synthesis_role == "primary" and e.modality in CROSS_CUTTING_MODALITIES
    )


def render_matrix(rows: Iterable[SummaryRow]) -> str:
    """Render the intervention matrix as a compact fixed-width table."""
    ordered = list(rows)
    if not ordered:
        return "No primary evidence rows."
    header = (f"{'modality':<14}{'population':<20}{'k':>3}{'benefit':>9}"
              f"{'null':>6}{'harm':>6}{'certainty':>13}  stance")
    lines = [header, "-" * len(header)]
    for row in ordered:
        lines.append(
            f"{row.modality:<14}{row.population:<20}{row.entries:>3}"
            f"{row.benefit_outcomes:>9}{row.null_outcomes:>6}{row.harm_outcomes:>6}"
            f"{row.best_certainty:>13}  {row.stance}"
        )
    return "\n".join(lines)
