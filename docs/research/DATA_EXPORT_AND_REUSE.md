# Data Export and Reuse

**Status:** data-reuse addendum to the Noesis evidence review, 2026-11-08
**Scope:** analysis-ready CSV exports; not a new efficacy claim
**Evidence table:** [analysis/evidence_table.json](analysis/evidence_table.json)

---

## 1. Question

The JSON export is the complete record, but nested session results and adherence events are not
directly analysis-ready in R, SPSS, Stata or a spreadsheet. How can the app make the same record
reusable without adding a server, an account or a second source of truth?

---

## 2. Literature basis

The FAIR Guiding Principles define scientific data stewardship as findable, accessible,
interoperable and reusable, with machine-readable metadata and standard formats
(PMID 26978244; DOI 10.1038/sdata.2016.18). The existing review already requires a portable
export (R49). A measurement review of data-sharing knowledge, attitudes and practices found
most surveys poorly developed, but the practical direction is stable: reuse depends on the data
being usable by the receiving team, not merely on the data existing (PMID 41813053;
narrative-only for quantity because certainty is low).

The product response is not a new data controller. It is a second, flat representation of the
same local record: one CSV for session blocks and one for adherence events.

---

## 3. Design

| Decision | Reason |
|---|---|
| Keep JSON as the complete source of truth | Nested arrays preserve the full record and future fields |
| Add a **sessions CSV** with one row per block | The block is the unit of scoring and the natural analysis row |
| Add an **adherence CSV** with one row per session event | Dropout and dose are session-level analyses |
| Use stable headers and RFC 4180-style quoting | Spreadsheet and statistical tools can read commas, quotes and newlines safely |
| Preserve the full metric object as `metrics_json` | A flat CSV cannot hold every mechanic-specific metric without a wide, sparse table |
| Preserve motivation exposure as `motivation_json` | Engagement exposure remains auditable without expanding the main table |
| Download from Settings, locally | No server, no account and no silent upload |
| Disable the buttons when the relevant store is empty | Avoid empty files that look like data loss |

### 3.1 Sessions CSV columns

`session_id, finished_at, seed, arm, mechanic, domain, difficulty, trials, duration_ms,
accuracy, summary, state_hash, metrics_json, motivation_json`

- One row per mechanic result, so a four-block session produces four rows.
- `arm` is blank outside a study.
- `difficulty` is blank for pre-level records.
- `metrics_json` and `motivation_json` are JSON strings escaped for CSV.

### 3.2 Adherence CSV columns

`event_id, seed, started_at, ended_at, status, blocks_completed, block_count, arm`

- One row per session start, completion or early ending (R60).
- `status` is `started`, `completed` or `aborted`.
- `ended_at` is blank only while a session is still open.

---

## 4. Requirement added

- **R61:** Settings offers local CSV exports for session blocks and adherence events. The
  sessions CSV has one row per block with stable headers and preserves the full metric and
  motivation objects as JSON strings; the adherence CSV has one row per event. Both are
  generated from the same local stores as the JSON export, use no server, and contain no name,
  email address or account identifier.

---

## 5. Limits

- CSV is a flat view; a researcher who needs every nested field should use the JSON export.
- The CSV does not include the permission or consent text; the consent record is in the JSON.
- The files are device-local until the user moves or emails them.
- The export is not a substitute for a pre-registered analysis plan or source-data verification.
