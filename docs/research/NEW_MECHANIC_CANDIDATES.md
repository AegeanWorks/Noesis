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
| Flanker | Interference control | No eligible Flanker-specific training meta-analysis in this search; the standard interference-control paradigm is covered by broader EF training evidence with small near transfer (30998045, 32011155) | Static arrows; safe | **Implement as experimental focus test, claim-bounded** |
| Stop-signal | Response inhibition / cancellation | Inhibitory-control training meta-analyses target appetitive behaviour (38309625, g=-0.21) rather than cognitive-training transfer; Go/No-Go already covers inhibition in the core lineup | Static go/stop cues; safe | Do not implement (duplicate construct; behaviour-change evidence) |
| Spatial span / Corsi | Visuospatial working memory | A 2025 meta-analysis found a small Corsi Block effect (d=0.16) in healthy older adults; broader working-memory reviews show short-term near transfer but no convincing far transfer (37822255, 22612437, 27474138) | Grid sequence; safe | **Implement as experimental focus test, claim-bounded** |
| Mental rotation | Spatial ability | Training improved spatial skills (217 studies, g=0.47) and transferred to untrained spatial tasks (22663761); spatial training also improved mathematics (g=0.28), but concrete materials beat computerized training and near outcomes transferred more than distal ones (35073120) | Static block figures; safe | **Implement as experimental focus test, claim-bounded** |
| Prospective memory | Delayed intentions / episodic memory | 2023 meta-analysis of 29 RCTs: immediate prospective-memory training effect g=0.54, but long-term g=0.20 was not significant (35543836) | Static letter stream with one cue; safe | **Implement as experimental focus test, claim-bounded** |
| Paired associates | Verbal episodic memory | 2022 meta-analysis of 21 RCTs (n=4,149): mnemonic training improved episodic memory immediately (g=0.408) and at follow-up (g=0.418); strategy-based, not the exact task (36301274) | Static word pairs; safe | **Implement as experimental focus test, claim-bounded** |
| Change detection | Visual working memory | No task-specific change-detection training meta-analysis; working-memory/executive-function training meta-analyses show short-term near transfer (30998045, 32011155) | Static coloured grid, one brief change; safe | **Implement as experimental focus test, claim-bounded exception** |
| Visual search / UFOV-like | Processing speed / attention | UFOV training shows speed/attention and everyday-function gains (44 studies/17 RCTs; 29175362), but UFOV is a proprietary multi-subtest protocol and its subtests are not construct-pure (29270605); a simple search task is not the validated protocol | Brief adaptive presentation conflicts with the static no-flashing safety posture; Speed Tap is explicitly not UFOV | Out of scope for now (reason in section 6) |
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

### 4.1 Flanker implementation and evidence limit

- A five-character arrow row has a left- or right-pointing centre arrow; congruent flankers point
  the same way and incongruent flankers point the other way.
- Two answer buttons show **Left** and **Right**; keys 1 and 2 work.
- Metrics: accuracy, congruent/incongruent accuracy and reaction time, interference cost,
  timeouts and streaks. The result card explains interference cost as the incongruent-trial mean
  minus the congruent-trial mean; a negative value means conflicting flankers did not slow the
  user in that block, and the measure is descriptive, not a diagnosis. The Choose-a-test card
  shows the latest same-level interference cost and trend; the result and History cards compare
  only blocks at the same level and label the latest block as improved, worsened or unchanged
  versus the previous block at that level; the first block at a level has no delta.
- It is available from the Menu as a three-block focus test. It is not in the default lineup.
- **Evidence limit:** the review search found no eligible Flanker-specific training
  meta-analysis. The task is a standard interference-control paradigm and the broader
  executive-function training meta-analyses show small near transfer, so the app ships it as an
  experimental, claim-bounded focus test rather than a validated protocol. It makes no
  general-intelligence, academic, dementia-prevention or everyday-function claim.

### 4.2 Spatial Span implementation and evidence limit

- A 3x3 grid shows a sequence of highlighted blocks, one at a time, at a slow fixed pace.
- After a short gap, the user taps the blocks in the same order. A wrong tap ends the trial.
- The span starts at 3/4/5 by level and moves up after a correct trial and down after a miss,
  bounded at 2-8.
- Metrics: accuracy, mean span, longest correctly recalled span, timeouts and streaks. The
  Choose-a-test card shows the latest same-level mean and longest span; the result and History
  cards compare mean span only within the same level and label the latest block as improved,
  worsened or unchanged. Higher span is better; the first block at a level has no delta.
- It is available from the Menu as a three-block focus test. It is not in the default lineup.
- **Evidence:** the 2025 meta-analysis by Olegário et al. (PMID 37822255; 31 included trials,
  13 in the meta-analysis) found a small Corsi Block improvement in healthy older adults
  (d=0.16, p=.002) but no significant effects on Digit Span backward or N-back; it found no
  cognitive-flexibility effect. Melby-Lervåg and Hulme (2013, PMID 22612437) found short-term
  visuospatial near transfer with limited maintenance, and their 2016 review (PMID 27474138)
  found no convincing far transfer against treated controls. The app therefore claims
  visuospatial working-memory practice only, not a validated protocol, diagnostic, or
  general-intelligence/academic/everyday-function benefit.

### 4.3 Mental Rotation implementation and evidence limit

- Two static block figures appear side by side. The right figure is the same shape rotated by
  0/90/180/270 degrees, or a mirror image of it.
- Two answer buttons show **Same** and **Mirrored**; keys 1 and 2 work.
- Metrics: accuracy, same/mirror accuracy, mean response time, timeouts and streaks. The
  Choose-a-test card shows the latest same-level accuracy and response time; the result and
  History cards compare both metrics only within the same level. Higher accuracy and lower
  response time are better; the first block at a level has no delta.
- It is available from the Menu as a three-block focus test. It is not in the default lineup.
- **Evidence:** Uttal et al. (2013, PMID 22663761) meta-analysed 217 spatial-training studies
  and found an average effect of g=0.47, stable over delays and transferred to untrained spatial
  tasks. Hawes et al. (2022, PMID 35073120) found spatial training improved spatial thinking
  (g=0.49) and mathematics (g=0.28), but concrete materials outperformed computerized training
  and near mathematics outcomes transferred more than distal ones. Sala and Gobet (2017, PMID
  29276344) found far transfer rarely occurs. The app therefore claims spatial-task practice
  only, not mathematics, academic, general-intelligence or everyday-function benefit.

### 4.4 Prospective Memory implementation and evidence limit

- A stream of letters appears one at a time. Each is sorted as **Vowel** or **Consonant**; when
  the letter is **Q**, the correct action is **Remember** instead.
- Keys 1, 2 and 3 work. The cue is event-based and embedded in the ongoing task, not a separate
  reminder.
- Metrics: overall accuracy, ongoing accuracy, cue trials, cue hits/misses, false alarms,
  mean response time, timeouts and streaks. The Choose-a-test card shows the latest same-level
  ongoing accuracy, cue hits and false alarms; the result and History cards compare the same
  three measures only within the same level. Higher accuracy and cue hits are better; lower
  false alarms are better; the first block at a level has no delta.
- It is available from the Menu as a three-block focus test. It is not in the default lineup.
- **Evidence:** Tse et al. 2023 (PMID 35543836; *Neuropsychology Review*) reviewed 48 studies
  and meta-analysed 29 RCTs. Prospective-memory training produced a moderate immediate effect
  (Hedges g=0.54) in older adults, but the long-term effect (g=0.20) was not significant.
  Methodological quality varied and many non-randomised studies had serious or critical risk of
  bias. The app therefore claims delayed-intention practice only, not long-term, everyday-function
  or diagnostic benefit.

### 4.5 Paired Associates implementation and evidence limit

- A word pair is shown for a short study interval, then the first word appears as a cue and the
  user chooses its partner from four options.
- Keys 1-4 work. Feedback reveals the correct pair.
- Metrics: accuracy, mean response time, timeouts and streaks. The Choose-a-test card shows the
  latest same-level accuracy and response time; the result and History cards compare both
  metrics only within the same level. Higher accuracy and lower response time are better; the
  first block at a level has no delta.
- It is available from the Menu as a three-block focus test. It is not in the default lineup.
- **Evidence:** Chen et al. 2022 (PMID 36301274; *Psychology and Aging*) meta-analysed 21 RCTs
  with 4,149 healthy older adults. Mnemonic training improved episodic memory immediately
  (g=0.408) and at follow-up (g=0.418). The evidence is for mnemonic strategy training, not
  repeated paired-associate practice, so the app claims verbal episodic-memory practice only and
  makes no general-memory, academic, everyday-function or diagnostic claim.
- **Strategy hint:** the study screen offers a collapsed tip to link the two words in a vivid
  image or short sentence. This is a direct, optional application of the mnemonic-strategy
  evidence; it does not change scoring, and the app does not claim that the hint is a validated
  training protocol or that it produces far transfer.

### 4.6 Change Detection implementation and evidence limit

- A brief array of coloured squares appears, followed by a blank delay and the same array with
  one square changed. The user taps the changed square.
- Keys 1-9 work. Set size is 4/5/6 by level; study time shortens with level.
- Metrics: accuracy, set size, mean response time, timeouts and streaks. The Choose-a-test card
  shows the latest same-level accuracy, set size and response time; the result and History cards
  compare accuracy and response time only within the same level. Higher accuracy and lower
  response time are better; the first block at a level has no delta.
- It is available from the Menu as a three-block focus test. It is not in the default lineup.
- **Evidence limit:** the targeted search found no eligible change-detection training
  meta-analysis. The broader working-memory and executive-function training meta-analyses
  (30998045, 32011155) show short-term near transfer but no convincing far transfer, so this is
  an experimental visual working-memory focus test with a task-practice claim only. It makes no
  general-memory, academic, everyday-function or diagnostic claim.

---

## 5. Requirement and limits

- **R63:** Task Switch is an experimental focus test with a static colour/shape rule switch,
  switch/repeat accuracy and switch-cost metrics, no flashing, and no general-intelligence or
  everyday-function claim. It is not in the default four-block lineup until the lineup is
  revalidated.
- **R64:** Flanker is an experimental focus test with static arrows, congruent/incongruent
  accuracy and reaction time and interference cost. No Flanker-specific training meta-analysis
  was found; the claim is limited to task practice.
- **R65:** Spatial Span is an experimental focus test with a slow 3x3 sequence, adaptive span,
  and accuracy/mean-span/longest-span metrics. A small Corsi Block effect supports
  visuospatial working-memory practice only; far transfer is not claimed.
- **R66:** Mental Rotation is an experimental focus test with static block figures, a
  rotation-versus-mirror judgement and accuracy/reaction-time metrics. Spatial-training
  meta-analyses support near transfer to spatial tasks; mathematics, academic and
  general-intelligence gains are not claimed, especially for computerized training.
- **R67:** Prospective Memory is an experimental focus test: an ongoing vowel/consonant
  classification runs while a Q cue requires a Remember response. It reports ongoing accuracy,
  cue hits/misses, false alarms and reaction time. A 2023 meta-analysis supports a moderate
  immediate effect but not a significant long-term effect; no everyday-function or diagnostic
  claim is made.
- **R68:** Paired Associates is an experimental focus test: a word pair is studied, then the
  second word is retrieved from four options. It reports accuracy and reaction time. A 2022
  meta-analysis supports mnemonic training gains in episodic memory, but not this exact task;
  no general-memory, academic, everyday-function or diagnostic claim is made.
- **R69:** Change Detection is an experimental focus test: a brief coloured array is held across
  a delay, then the changed square is selected. No task-specific change-detection training
  meta-analysis exists, so the claim is limited to visual working-memory practice; no
  general-memory, academic or everyday-function claim is made.

Limits: the evidence is for executive-function, working-memory and spatial training broadly,
not for these exact colour/shape, arrow, grid or block-rotation tasks. The meta-analyses also
report benefits from multicomponent or hands-on training, and Nguyen et al. recommend adaptive
multidomain training. Task Switch, Flanker, Spatial Span and Mental Rotation are therefore
conservative single-task focus tests, not evidence that single-component or computerized
training is superior, and they do not replace the core lineup. Flanker has no task-specific
training meta-analysis in this review; its claim is limited to task practice. Spatial Span has
a small Corsi-specific pooled effect but no far-transfer evidence. Mental Rotation has
moderate spatial-training evidence but the mathematics effect favours concrete materials, so no
academic gain is claimed. The tasks are practice and measurement instruments, not diagnostic
tests. Future candidates should be selected by task-specific evidence and safety, not by genre
labels.

---

## 6. Out-of-scope candidates from the 2026-11-08 targeted search

Two remaining matrix candidates were researched and deliberately **not** implemented.

### 6.1 UFOV / visual search

- Edwards et al. 2018 (PMID 29175362; *Neuroscience & Biobehavioral Reviews*) systematically
  reviewed 44 UFOV-training studies from 17 randomized trials. UFOV training improved neural
  outcomes, speed of processing and attention; showed far transfer to everyday function;
  endured across ten years; and adaptive training outperformed non-adaptive. It did not transfer
  to other neuropsychological outcomes.
- Woutersen et al. 2017 (PMID 29270605; *Journal of Vision*) meta-analysed 116 correlations
  across 18 articles and found that none of the three UFOV subtests measures one clear
  construct; visual and cognitive functions are all involved.
- **Decision:** no UFOV-like mechanic. UFOV is a proprietary multi-subtest protocol, so a
  simplified central/peripheral search task would not be the validated intervention even if it
  shared stimuli. The paradigm also relies on brief, adaptively speeding visual presentation,
  which conflicts with this app's static, no-flashing safety posture and would require a
  separate photosensitivity and protocol review. The existing Speed Tap is explicitly labelled
  as not UFOV. Revisit only with a non-proprietary paradigm that has published task validation,
  a safety review for brief/adaptive visual presentation, and copy that does not claim to be
  UFOV.

### 6.2 Stop-signal

- McGreen et al. 2024 (PMID 38309625; *Appetite*) meta-analysed 32 studies of Go/No-Go and
  Stop-Signal training for food consumption or choice. The overall effect was small
  (g=-0.21, 95% CI [-0.31, -0.11]), and the individual effect held only for a single session of
  Go/No-Go training. The evidence concerns appetitive behaviour change, not cognitive-training
  transfer.
- **Decision:** no separate stop-signal mechanic. Go/No-Go already covers response inhibition in
  the core lineup, and adding a near-duplicate construct would not add a distinct measured
  outcome. The behaviour-change literature also does not support a cognitive or everyday-function
  claim for this app.

These decisions are recorded in ADR-049. They are scope decisions, not evidence that UFOV or
stop-signal training is ineffective.

### 6.3 Cognitive-motor dual-task training

- Gao and Liu 2025 (PMID 40410069; *Geriatric Nursing*) meta-analysed cognitive-motor dual-task
  training for falls prevention in community older adults. It improved gait, static and dynamic
  balance, executive function and fall risk versus traditional fall-prevention interventions;
  lower-limb strength and fear of falling were inconclusive.
- Hao et al. 2025 (PMID 40304821; *Aging Clinical and Experimental Research*) network
  meta-analysed 32 RCTs in older adults with mild cognitive impairment or dementia. Dual
  cognitive-task training ranked best for global cognition; motor-cognitive training improved
  executive function and daily living.
- **Decision:** no dual-task mechanic. The evidence is clinical (falls, MCI, dementia) and
  motor-cognitive, not healthy-adult cognitive training, and the app is sedentary and
  screen-only. A meaningful dual-task protocol would require a motor or continuous tracking
  component, which introduces safety and measurement problems outside this app's scope.
  Recorded in ADR-052.

These decisions are scope decisions, not evidence that the training modes are ineffective.

### 6.4 Verbal fluency and face-name associative memory

- A targeted verbal-fluency search found no eligible training meta-analysis; fluency is usually
  an outcome in broader trials, not a trained task. A deterministic text app cannot reliably
  score open-ended word generation without a validated dictionary and semantic rater.
- A face-name search found Kelly et al. 2014 (PMID 24607830; 31 RCTs, 1,806 cognitive-training
  participants), which reported face-name recall (p=0.02) and paired associates (p=0.001) gains
  versus no intervention in healthy older adults. This is task-relevant but not an active-control
  face-name training meta-analysis, and a proper face-name task needs a validated face stimulus
  set with privacy and consent handling. Paired Associates already covers the verbal
  associative-memory component.
- **Decision:** no verbal-fluency or face-name mechanic. The mnemonic strategy evidence is applied
  instead as an optional pre-test briefing tip for Paired Associates. Recorded in ADR-053.

### 6.5 Metacognitive/confidence-calibration training

- A targeted search found no confidence-calibration training meta-analysis. The closest eligible
  record is Sella et al. 2023 (PMID 36218025; *Aging & Mental Health*): 25 studies, 1,768 older
  adults; metacognitive training improved memory (d=0.52) and strategic metacognitive training
  improved memory (d=0.44), metacognitive beliefs, strategy use and some well-being outcomes, with
  limited methodological quality.
- **Applied feature, not a mechanic:** an optional **Confidence check** on the pre-test briefing
  records Low/Medium/High for the block, and the result card repeats the choice with an explicit
  note that it is a reflection, not scored and not a diagnostic calibration. The choice persists
  in the session snapshot, is stored on the completed result, and feeds a same-mechanic,
  same-level confidence-versus-accuracy summary in Menu History. The app does not claim that this
  prompt is metacognitive training or that it improves memory. Recorded in ADR-054.

These decisions are scope decisions, not evidence that the training modes are ineffective.
