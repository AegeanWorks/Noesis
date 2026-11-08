# New Mechanic Candidates from the Literature

**Status:** game-search addendum to the Noesis evidence review, 2026-11-08
**Scope:** candidate cognitive-training tasks; no new efficacy claim
**Evidence table:** [analysis/evidence_table.json](analysis/evidence_table.json)

---

## 1. Question

Noesis has four core mechanics: N-back, Go/No-Go, Reasoning and Speed Tap. Which additional
game-like tasks are supported by the literature, which are safe in a static visual app, and
which one should be added first?

The search looked for task paradigms and game genres, not for "brain training" marketing. The
useful distinction is between a **specific task** (a trainable construct with a measurable
near-transfer task) and a **genre label** (e.g. "action game") that pools heterogeneous games.

---

## 2. Search

PubMed E-utilities searches on 2026-11-08 included:

- `task-switching training`, `set-shifting training older adults`;
- `executive control training transfer meta-analysis older adults`;
- `action video game training cognitive meta-analysis`;
- `visual search training processing speed older adults`;
- `spatial navigation training cognitive older adults meta-analysis`;
- `commercial brain training programs meta-analysis`.

Two executive-function meta-analyses were added to the evidence table as context records:

| PMID | Record | Key result |
|---|---|---|
| 30998045 | Nguyen et al. (2019), *Psychol Bull* | 64 studies / 3,594 older adults; core-EF training produced large trained-task effects and small near- and far-transfer effects, maintained at follow-up |
| 32011155 | Basak et al. (2020), *Psychol Aging* | 215 training studies; overall g=0.28, near g=0.37, far g=0.22; single-component EF training was most effective on near/far transfer, while multicomponent training also transferred and improved everyday functioning |

The following sources stayed narrative-only:

- Bediou et al. (2018), PMID 29172564: action-video-game intervention g=0.34, with robust
  effects on top-down attention and spatial cognition; publication bias remains.
- Smith & Basak (2023), PMID 37531408: 63 studies; overall g=0.25; gameplay **features**
  predicted transfer better than genre labels.
- Nguyen et al. (2022), PMID 34251578: 43 studies of commercial programs; small near transfer,
  no robust objective far transfer after bias adjustment.

---

## 3. Candidate matrix

| Candidate | Construct | Evidence | Safety / fit | Decision |
|---|---|---|---|---|
| **Task Switch** | Set-shifting / cognitive flexibility | Core-EF meta-analyses show small near and far transfer; single-component EF training was most effective in one analysis, while multicomponent training also transferred and improved everyday functioning (30998045, 32011155) | Static coloured shapes; no flashing; easy deterministic state machine | **Implement as experimental focus test** |
| Flanker | Interference control | No eligible task-specific meta-analysis in this search; flanker is a standard inhibition paradigm | Static arrows; safe | Candidate, not implemented |
| Stop-signal | Response inhibition / cancellation | Strong paradigm, but Go/No-Go already covers inhibition in the core lineup | Static go/stop cues; safe | Candidate, not implemented |
| Spatial span / Corsi | Visuospatial working memory | Near transfer is plausible; less evidence for broad transfer | Grid sequence; safe | Candidate, not implemented |
| Mental rotation | Spatial ability | Training improves spatial tasks; far transfer to academic outcomes is not established | Static 2D/3D shapes; safe | Candidate, not implemented |
| Visual search / UFOV-like | Processing speed / attention | ACTIVE supports speed training, but this app's Speed Tap is not UFOV and a simple search task would not be the validated protocol | Static search array; safe | Candidate, not implemented |
| Action video game | Attention / spatial cognition | g=0.34 intervention (29172564), but genre is broad and often fast/flashing | Conflicts with the no-flashing safety posture | Do not build a flashing action game |
| Commercial brain-training suite | Mixed | Small near transfer; no robust objective far transfer (34251578) | Program-specific, not a task | Do not copy a commercial suite |

The game-factor review (37531408) supports designing around **features** — adaptive demand,
feedback, changing rules — rather than claiming a genre. Task Switch uses rule changes and
immediate feedback, which is the feature-level rationale for choosing it first.

A task-specific training study stayed narrative-only: Karbach and Kray (2009, PMID 19840052)
found near transfer of task-switching training in all age groups, especially children and
older adults, plus far transfer to executive tasks and fluid intelligence in a single
developmental sample. The app treats the near-transfer result as supporting the task and does
not claim the far-transfer result as established; the two meta-analyses above remain the
quantitative basis.

---

## 4. Task Switch implementation

- A static coloured shape appears with a cue: **Colour** or **Shape**.
- The cue alternates on a seeded schedule, so the same shape can require a different answer
  after a switch.
- Two answer buttons show only the current rule (Red/Blue or Circle/Square); keys 1 and 2 work.
- Metrics: accuracy, switch/repeat accuracy, mean response time, switch cost, timeouts and
  streaks. The result card explains switch cost as the switch-trial mean minus the repeat-trial
  mean; a negative value means switching was faster in that block and is descriptive, not a
  diagnosis. The Choose-a-test card shows the latest same-level switch cost and trend; the
  result and History cards compare only blocks at the same level and label the latest block as
  improved, worsened or unchanged versus the previous block at that level; the first block at a
  level has no delta.
- It is available from the Menu as a three-block focus test. The default standard session stays
  the validated four-core lineup; Task Switch is not silently mixed in.
- No general-intelligence, academic, dementia-prevention or everyday-function claim.

---

## 5. Requirement and limits

- **R63:** Task Switch is an experimental focus test with a static colour/shape rule switch,
  switch/repeat accuracy and switch-cost metrics, no flashing, and no general-intelligence or
  everyday-function claim. It is not in the default four-block lineup until the lineup is
  revalidated.

Limits: the evidence is for executive-function training broadly, not for this exact
colour/shape task. Both meta-analyses also report benefits from multicomponent training,
including everyday functioning in Basak et al., and Nguyen et al. recommend adaptive
multidomain training. Task Switch is therefore a conservative single-task focus test, not
evidence that single-component training is superior, and it does not replace the core lineup.
The task is a practice and measurement instrument, not a diagnostic test. Future candidates
should be selected by task-specific evidence and safety, not by genre labels.
