# Noesis Investigational Use: Trial Dossier (v1.0, 2026-11-02; data-sharing update 2026-11-08)

This document is for investigators running a randomised controlled trial with
Noesis. It states what each trial arm does, what each record carries and how
safety is monitored. It makes no efficacy claim: every between-arm and
pre-post difference is a hypothesis the trial tests, not a finding.

## 1. Trial arms

| | Control | Engagement |
|---|---|---|
| Bonus schedule | 70% steady, 20% boost, 10% rare | 60% steady, 25% boost, 15% rare |
| Finisher bonus | none | +15 momentum for completing every block |
| Streak reminder | none | daily streak card once a day is trained |
| Everything else | identical | identical |

Both arms share: the same four core mechanics, fixed session structure, opt-in
Motivation mode with identical risk rules, adaptive difficulty (opt-in),
weekly day-goals, far checks, adverse-event capture, heavy-use monitoring
and the Motivation pause. The experimental Task Switch, Flanker, Spatial Span, Mental Rotation, Prospective Memory and Paired Associates are Menu focus tests
and is not in the trial lineup unless the protocol adds it explicitly. The engagement arm differs only in incentive
delivery (R39, R51, ADR-015, ADR-027).

Arm assignment is protocol-side. The app records the assigned arm per session
and in the export; it never randomises (R38, ADR-014).

## 2. Data schema (JSON export, one file)

- `sessions[]`: `{ id, finishedAt, seed, results[], arm, motivation? }`.
  `motivation`, when Motivation mode was on, carries `{ banked, schedule,
  completionBonus, tiers[] }` — the full engagement exposure for that
  session, including which schedule was in force.
- `farChecks[]`: `{ id, finishedAt, seed, studied, tested, hits, falseAlarms,
  accuracy, arm }` — monthly word-recognition probe, separate store.
- `adverseEvents[]`: `{ id, reportedAt, sessionId, symptoms[], severity,
  note, stoppedSession }` — per-session symptom check-ins.
- `adaptationLog[]`: `{ at, mechanic, from, to, accuracy }` — the adaptive
  difficulty trajectory for dose-response analysis.
- `adherence[]`: `{ id, seed, startedAt, endedAt, status, blocksCompleted,
  blockCount, arm }` — every session start, completion and early ending, for
  dropout and dose analysis (R60).
- `study`: `{ studyId, arm, consentedAt }` or `null` outside a study.
- `research`: `{ participantCode, consentVersion, consentedAt, withdrawnAt,
  scopes, language }` or `null` when research consent was not given. The
  study contact email is deliberately not written into the file (R57).

Export also includes a copyable plain-text weekly summary for adherence
reporting. All data lives on-device until exported, copied or emailed by the
user; there are no accounts and no servers (R49, R57-R59, ADR-025,
ADR-041). The email hand-off downloads a JSON file and prepares a mailto
draft; the user attaches the file and sends it.

Settings also offers two analysis-ready CSV companions generated from the same
local stores: one row per session block (with `metrics_json` and
`motivation_json` preserved) and one row per adherence event (R61, ADR-043).
The CSV files contain no name, email address or account identifier.

The JSON export carries a `manifest` with the app version, export schema
version, evidence-review version, data-dictionary version, consent version
and record counts. [DATA_DICTIONARY.md](DATA_DICTIONARY.md) documents every
JSON field and both CSV layouts (R62, ADR-044).

## 3. Safety monitoring (all arms)

- Pre-training photosensitivity screen with hard content limits (R14, R15).
- Post-session symptom check-in with stop rules; severe or repeated moderate
  symptoms advise rest (R18, ADR-010).
- Heavy-use detection (4+ sessions/day, back-to-back sessions, 45+ minute
  days) with a caring check-in and one-tap Motivation pause; nothing ever
  locks the user out (R36, ADR-011).
- Symptom reports and heavy-use signals are stored locally and included in
  the export for safety analysis.

## 4. What the trial still must establish

- Whether the volatile schedule and finisher bonus change adherence or dose
  (the app logs exposure; it does not assert an effect).
- Whether training transfers beyond trained tasks (the far check measures
  word recognition only; broad far transfer is not established — R7, R41).
- Durable effects after training ends (no follow-up data are collected
  in-app; the protocol must schedule them).
- Clinical populations and clinician-supervised use remain Phase 2/3 scope
  (see DESIGN_IMPLICATIONS).

## 5. Informed consent notes for the protocol

In-app enrollment requires an investigator-provided trial ID, an assigned arm
and an explicit consent checkbox, and withdrawal is one tap with data kept
(R38, ADR-014). This in-app step records consent for data tagging; it does
not replace the trial's own informed-consent process or ethics approval.

Research data sharing has a second, separate consent: the bilingual
English/Turkish informed-consent screen records a random participant code, a
consent version, the two scopes (current study and future articles) and a
withdrawal timestamp (R58, ADR-041). The study team must configure a contact
email in Settings before consent can be given. Withdrawal stops future email
drafts but cannot recall data already sent. The ethics committee or IRB must
review the consent text, the contact details and the retention plan before
the app is used for data collection.
