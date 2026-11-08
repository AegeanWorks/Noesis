# Session Adherence Logging

**Status:** measurement addendum to the Noesis evidence review, 2026-11-08
**Scope:** session starts, completions and early endings; not a new efficacy claim
**Evidence table:** [analysis/evidence_table.json](analysis/evidence_table.json)

---

## 1. Question

How can a local-only app measure adherence and dropout without adding a server or an
analytics pipeline? The existing history stores only completed sessions, so a participant who
starts and abandons a session is invisible. That makes the app unsuitable as a data collector
for adherence or dose-response articles.

---

## 2. Literature basis

The review already makes adherence a primary product metric: dropout and sustained use decide
real-world dose (R22; PMID 40779747). The adherence review of mHealth apps identifies
personalization, reminders and stable usable design as drivers, with technical difficulties as
the top barrier (PMID 35612886). Neither source supports a hidden analytics channel; they
support measuring the behaviour that actually happens.

A targeted PubMed search on 2026-11-08 found a pilot RCT of home-based computerized executive
function training in combat veterans with PTSD (PMID 30881315). Dropout was 38.5% in the active
training arm and 57.1% in the placebo arm; baseline clinical severity and neural reactivity
predicted completion. The trial is a primary experiment rather than an umbrella review, so it
stays narrative-only by the review's existing rule. Its practical lesson is direct: a product
that records only completers cannot estimate the dropout that decides whether the training was
delivered.

---

## 3. Design

| Decision | Reason |
|---|---|
| Log a start event when a session begins | A start is the denominator for completion and dropout |
| Log a completion event with blocks completed | Completion rate and dose are separate outcomes |
| Log an early ending with blocks completed | A participant can stop after one block; that is not the same as never starting |
| Close dangling starts when a new session begins | Closing the app without an explicit end must not leave an open event forever |
| Store seed, start/end timestamps, block count and study arm | Lets the study team link the event to the session and arm without storing a name or email |
| Show a neutral local summary in Settings and Menu History | Transparency: the participant can see what is recorded before exporting; completion is framed as information, not a failure |
| Include the log in every JSON export | The study team gets adherence without a separate analytics service |
| Delete it with **Delete local data** | Local-first retention and withdrawal control |

The log does not change the session engine, scoring or timing. It adds no prompt and no extra
tap. A session that is started and then abandoned by closing the app is marked aborted with
zero completed blocks when the next session starts; the exact close time is unknown, which is
recorded as a limitation rather than guessed.

---

## 4. Requirement added

- **R60:** Every session start is logged with its seed, block count, study arm and timestamp.
  Completion and early ending update the same event with the ending timestamp and the number
  of blocks completed. The log is shown in Settings and included in JSON exports. It contains
  no name, email address or account identifier; **Delete local data** clears it.

---

## 5. Limits

- The log is device-local and does not merge across devices or browsers.
- A force-closed session is closed as aborted when the next session starts; its exact end time
  is not known.
- The log measures session-level behaviour, not the reason for stopping.
- It does not replace a trial protocol's own adherence definition or source-data verification.
