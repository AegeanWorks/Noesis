# Noesis Data Dictionary

**Version:** 2026-11-08
**Applies to:** JSON export `version: 1` and the sessions/adherence CSV companions
**Export manifest:** every JSON file carries `manifest.dataDictionaryVersion`

This dictionary describes the fields a study team receives. It does not replace the consent
record, the protocol or the pre-registered analysis plan.

---

## 1. JSON top level

| Field | Type | Meaning |
|---|---|---|
| `app` | `"noesis"` | Application identifier |
| `version` | `1` | Export payload version |
| `exportedAt` | ISO 8601 string | Time the file was generated |
| `sessionCount` | integer | Number of completed session records |
| `sessions` | array | Completed session records |
| `study` | object or `null` | Trial ID, arm and consent time |
| `farChecks` | array | Monthly word-recognition probes |
| `adverseEvents` | array | Post-session symptom reports |
| `adaptationLog` | array | Adaptive-difficulty changes |
| `adherence` | array | Session starts, completions and early endings |
| `research` | object or `null` | Research-consent metadata; never the study contact email |
| `manifest` | object | Provenance and counts for the file |

## 2. Manifest

| Field | Type | Meaning |
|---|---|---|
| `app` | `"noesis"` | Application identifier |
| `appVersion` | string | App release that produced the file |
| `exportSchemaVersion` | integer | Export schema version |
| `evidenceReview` | string | Evidence-review version used by the app |
| `dataDictionaryVersion` | string | Version of this dictionary |
| `exportedAt` | ISO 8601 string | Duplicate of the top-level timestamp |
| `consentVersion` | integer or `null` | Research-consent version at export time |
| `counts.sessions` | integer | Completed sessions |
| `counts.blocks` | integer | Scored blocks across completed sessions |
| `counts.farChecks` | integer | Far-check records |
| `counts.adverseEvents` | integer | Symptom reports |
| `counts.adherence` | integer | Adherence events |
| `counts.adaptationEvents` | integer | Adaptive-difficulty events |

## 3. Session record

| Field | Type | Meaning |
|---|---|---|
| `id` | string | Stable hash of seed plus results |
| `finishedAt` | ISO 8601 string | Completion time |
| `seed` | integer | Seeded RNG value |
| `results` | array | One `MechanicResult` per completed block |
| `arm` | `"control"`, `"engagement"` or absent | Study arm, when enrolled |
| `motivation` | object or absent | Engagement exposure when Motivation mode was on |

`motivation`: `banked`, `schedule` (`steadyUpTo`, `boostUpTo`), `completionBonus`, `tiers[]`.

## 4. MechanicResult

| Field | Type | Meaning |
|---|---|---|
| `mechanic` | `nback`, `gonogo`, `reasoning`, `speed`, `switching` | Task identity |
| `domain` | string | Target domain |
| `trials` | integer | Trials configured for the block |
| `durationMs` | integer | Block duration in milliseconds |
| `metrics` | object | Task-specific metrics (below) |
| `summary` | string | Human-readable result line |
| `seed` | integer | Block RNG seed |
| `stateHash` | 16-character string | Deterministic replay hash |
| `difficulty` | `1`, `2`, `3` or absent | Block level; absent in pre-level records |

### 4.1 N-back metrics

`trials_seen`, `targets`, `hits`, `misses`, `false_alarms`, `correct_rejections`,
`near_misses`, `accuracy` (0-1), `d_prime`, `mean_hit_reaction_ms`, `current_streak`,
`max_streak`.

### 4.2 Go / No-Go metrics

`trials_seen`, `go_trials`, `no_go_trials`, `hits`, `misses`, `commissions`,
`correct_rejections`, `go_accuracy` (0-1), `no_go_accuracy` (0-1), `accuracy` (0-1),
`mean_go_reaction_ms`, `current_streak`, `max_streak`.

### 4.3 Reasoning metrics

`items_seen`, `correct`, `incorrect`, `timed_out`, `accuracy` (0-1), `mean_response_ms`,
`current_streak`, `max_streak`, plus `items_total` on the final result.

### 4.4 Speed Tap metrics

`trials_seen`, `hits`, `misses`, `lapses` (reactions over 500 ms), `accuracy` (0-1),
`mean_reaction_ms`, `median_reaction_ms`, `fastest_reaction_ms`, `reaction_sd_ms`,
`current_streak`, `max_streak`.

### 4.5 Task Switch metrics

`trials_seen`, `correct`, `incorrect`, `timed_out`, `switch_trials`, `repeat_trials`,
`switch_correct`, `repeat_correct`, `switch_accuracy` (0-1), `repeat_accuracy` (0-1),
`accuracy` (0-1), `mean_response_ms`, `switch_mean_response_ms`, `repeat_mean_response_ms`,
`switch_cost_ms`, `current_streak`, `max_streak`. `switch_cost_ms` is the switch mean reaction
time minus the repeat mean reaction time; it can be negative and is 0 when either cell is empty.

## 5. Study, far checks, symptoms and adaptation

| Object | Fields |
|---|---|
| `study` | `studyId`, `arm`, `consentedAt` |
| `farChecks[]` | `id`, `finishedAt`, `seed`, `studied`, `tested`, `hits`, `falseAlarms`, `accuracy`, `arm` |
| `adverseEvents[]` | `id`, `reportedAt`, `sessionId`, `symptoms[]`, `severity`, `note`, `stoppedSession` |
| `adaptationLog[]` | `at`, `mechanic`, `from`, `to`, `accuracy` |
| `research` | `participantCode`, `consentVersion`, `consentedAt`, `withdrawnAt`, `scopes` (`dataSharing`, `futureArticles`), `language` (`en`/`tr`) |

## 6. Adherence event

| Field | Type | Meaning |
|---|---|---|
| `id` | string | Event identifier |
| `seed` | integer | Session seed |
| `startedAt` | ISO 8601 string | Start time |
| `endedAt` | ISO 8601 string or `null` | End time; `null` only while open |
| `status` | `started`, `completed`, `aborted` | Session outcome |
| `blocksCompleted` | integer | Blocks finished before ending |
| `blockCount` | integer | Blocks configured |
| `arm` | `"control"`, `"engagement"` or `null` | Study arm |

## 7. Sessions CSV

One row per block. Columns:
`session_id, finished_at, seed, arm, mechanic, domain, difficulty, trials, duration_ms,
accuracy, summary, state_hash, metrics_json, motivation_json`.

- `metrics_json` is the full metric object as a JSON string.
- `motivation_json` is the exposure object as a JSON string, or blank.
- `accuracy` is a proportion from 0 to 1, not a percentage.
- Missing optional values are blank, never `undefined`.

## 8. Adherence CSV

One row per event. Columns:
`event_id, seed, started_at, ended_at, status, blocks_completed, block_count, arm`.

## 9. Conventions

- All timestamps are ISO 8601 UTC strings.
- Accuracy values are proportions in `[0, 1]`; the UI rounds them to percentages.
- Reaction times and durations are milliseconds.
- Blank CSV cells mean the value is absent, not zero.
- The JSON export is the complete record; CSV files are flat analysis views.
- When a field changes, update this dictionary and `manifest.dataDictionaryVersion`.
