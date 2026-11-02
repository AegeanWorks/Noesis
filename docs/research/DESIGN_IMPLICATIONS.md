# Design Implications

**Source:** [SYNTHESIS.md](SYNTHESIS.md)  
**Evidence table:** [analysis/evidence_table.json](analysis/evidence_table.json)  
**Status:** Product requirements derived from the review. Phase 1 measurement core is implemented in the app as of 2026-10-31.

---

## 0. Implementation status

The first vertical slice implements:

- four mechanics (N-back, Go/No-Go, Reasoning, Speed Tap) as deterministic state machines;
- a one-click start that begins the first block immediately;
- a session runner with per-block scoring and no composite score;
- local practice history with per-mechanic last/best accuracy, JSON export and targeted clearing;
- resumable sessions: a validated local snapshot survives reloads and Android WebView restarts;
- an optional when/where practice plan, user-selected session length and difficulty, and a non-punitive weekly summary;
- a bounded Motivation mode: cosmetic variable bonuses, streak multipliers, a real near-best cue, optional bonus-only risk and a target time;
- older-adult display controls (larger text, higher contrast, reduced motion), per-mechanic accuracy sparklines and a non-blocking daily break cue;
- safety onboarding, local-only storage and explicit non-claims;
- an evidence registry linking each mechanic to PMIDs and claim boundaries;
- an AI harness (`?ai=1`, `window.__NOESIS__`) and a seeded CLI simulator;
- a Capacitor 7 Android wrapper with a verified debug APK build.

Not implemented yet: movement sessions, audio relaxation, neurofeedback, visual entrainment, clinician dashboards, accounts, cloud sync, and any clinical claim.

Adverse-event capture (R18) landed 2026-11-02: a post-session symptom check-in with stop rules, a Settings review list and a prohibited-claim content lint (R5); see ADR-010.

---

## 1. Product principles

1. **Measure, don't assert.** The product's core asset is trustworthy repeated measurement, not a new game.
2. **Separate modalities.** Cognitive training, neurofeedback, audio-visual entrainment and movement have different evidence, safety and regulatory profiles.
3. **Claim only what survives blinding and active controls.** If an internal trial cannot beat an active control, the product must not claim an effect.
4. **Safety is a feature, not a disclaimer.** Photosensitivity, exercise, audio and data protection are engineering requirements.
5. **Near transfer is the default promise; far transfer is a research question.**
6. **No medical claim without a regulatory pathway.**

---

## 2. Modality decisions

| Modality | Decision | Evidence basis | Claim boundary |
|---|---|---|---|
| Cognitive training / games | **Build now** | Near transfer is reliable; domain-specific effects in older adults and clinical groups | "Practice and track this skill"; no IQ, academic or dementia claim |
| Movement + cognitive training | **Build as optional add-on** | Most consistent small effect in older adults (0.26); FINGER 0.022 Z/year; AEs 7% vs 1% | "Supports a healthy lifestyle"; no prevention claim |
| Audio relaxation / binaural beats | **Build as wellness module** | Anxiety/pain effects; cognition mixed and parameter-dependent | "May support relaxation"; no memory or intelligence claim |
| Neurofeedback | **Experimental only** | Blinded ADHD effect null; consumer devices no cognitive benefit | No ADHD, cognition or sleep claim; supervised research use only |
| Visual entrainment / photic stimulation | **Defer** | Weak cognitive evidence; photosensitive seizure risk | Not in MVP |
| Biometrics / sleep / stress | **Wellness only** | Indirect evidence; no validated training effect | No diagnosis or treatment claim |
| tDCS / TMS / other stimulation | **Do not build** | Combination evidence weak; not consumer-safe | Not a Noesis modality |

---

## 3. Requirements

### 3.1 Evidence and claims

| ID | Requirement | Rationale | Evidence |
|---|---|---|---|
| R1 | Every activity declares one primary cognitive domain and one near-transfer task. | Prevents a composite "brain score" from hiding domain-specific effects. | 27697851, 42959097, 40640327 |
| R2 | The product reports domain scores separately; no single composite score is the primary outcome. | Composite improvements can occur while domain tests do not. | 40640327 |
| R3 | A far-transfer claim is allowed only after a pre-registered, actively controlled, blinded trial. | Far transfer is absent or fragile in the best-controlled reviews. | 22612437, 27474138, 27697851 |
| R4 | The evidence registry tags each activity with modality, domain, evidence level, allowed claim and safety flags. | Makes claim drift a build error, not a marketing decision. | Review-wide |
| R5 | Prohibited claims are blocked at content authoring: IQ, intelligence, academic gain, dementia prevention, ADHD treatment, "brain age" reversal. | These claims are not supported and create regulatory risk. | 27474138, 39661381, 41016407 |
| R6 | Every claim shown to a user links to its evidence record and date. | The evidence is provisional and dated. | Protocol §15 |

### 3.2 Measurement and trials

| ID | Requirement | Rationale | Evidence |
|---|---|---|---|
| R7 | Near transfer, far transfer, everyday function, adherence and safety are measured on separate schedules. | The transfer gradient is the central finding. | 22612437, 27697851 |
| R8 | Any internal efficacy trial includes an active control and measures expectancy. | Passive controls inflate effects; expectancy can mimic neurofeedback. | 23360949, 40246295 |
| R9 | Outcome assessment is blinded or fully automated. | Blinding changes the ADHD and psychological-treatment results. | 39661381, 27238063 |
| R10 | A 3-month follow-up is mandatory for any durability claim. | Most effects fade; ACTIVE is the exception. | 42959097, 24417410 |
| R11 | Dose (sessions, minutes, weeks) is recorded and dose-response is modelled, not assumed. | Dose is not linear or universal. | 42711482, 41772608, 36853526 |
| R12 | Adaptive difficulty is opt-in, experimental and logged; it is never marketed as superior without an A/B test. | Adaptivity has a mechanistic rationale but not a consistent behavioural advantage. | 41772608, 42711482; ADR-012 |
| R13 | Trial protocols and analysis plans are pre-registered internally before data collection. | Protects against post-hoc claim construction. | Protocol §18 |

### 3.3 Safety

| ID | Requirement | Rationale | Evidence |
|---|---|---|---|
| R14 | A photosensitivity screen is required before any flashing or high-contrast visual content. | Photosensitivity affects 0.3-3%; 15-25 Hz is most provocative. | 16146439, 16146438, 41283196 |
| R15 | Visual content enforces luminance, frequency, red-flash and stripe-density limits, with an emergency stop. | Designer guidance specifies concrete limits. | 16146438, 41283196 |
| R16 | Movement content requires a health screen, progression limits and fall-risk controls. | Exercise increased AEs from 1% to 7% in FINGER. | 25771249 |
| R17 | Audio output enforces volume limits and hearing-safety guidance. | Binaural-beat reviews report hearing-related adverse events inconsistently. | 41176178 |
| R18 | Adverse events are captured every session, with stop rules and a review queue. | Consumer neurofeedback and game studies often do not assess harms. | 40246295, 40264083 |
| R19 | Neurofeedback is available only with validated hardware, learning metrics and a sham-controlled research protocol. | Consumer-grade devices show no cognitive benefit and no target modulation. | 40246295, 40275307 |
| R20 | Neural and biometric data require explicit consent, purpose limitation, retention limits and deletion. | EEG/biometric data are sensitive. | Safety review §9.4 |
| R21 | A regulatory triage is completed before any clinical claim or clinical population is targeted. | Clinical claims may create a medical-device obligation. | Safety review §9.5 |

### 3.4 Engagement and delivery

| ID | Requirement | Rationale | Evidence |
|---|---|---|---|
| R22 | Adherence is a primary product metric, not a secondary analytics event. | Dropout and sustained use decide real-world dose. | 40779747 |
| R23 | Use explicit behaviour-change techniques: goal setting, action planning, self-monitoring, instruction. | BCT count moderated exergame effectiveness. | 40779747 |
| R24 | Game framing is treated as a delivery layer; it is not evidence of efficacy. | Gamification evidence is mixed. | 39605199, 40474799 |
| R25 | Session length and frequency defaults are explicit and adjustable; no "more is better" messaging. | Dose effects are non-linear. | 42711482, 39028199 |
| R26 | The product distinguishes "training" from "assessment" in the UI. | Practice effects can masquerade as improvement. | 42897476 |
| R27 | Motivation mode confines variable bonuses, streak multipliers, near-best cues, corrective off-by-one feedback and optional risk to cosmetic momentum; cognitive scores are never affected. | These mechanisms are real but can distort training data or exploit loss aversion. | Clark 2009 (PMID 19217383); Kahneman & Tversky 1979 |
| R28 | Session length and difficulty are user-selected; no hidden difficulty adaptation is marketed as superior. | Autonomy support is low-risk; adaptivity claims are not established. | SDT (Ryan 2006); 41772608 |
| R29 | The when/where practice plan is optional, local-only and editable. | Implementation intentions support follow-through; coercion does not. | Gollwitzer & Sheeran 2006 |
| R30 | The weekly summary is informational and never creates a loss-framed streak. | Loss-framed summaries can encourage overtraining and anxiety. | Kahneman & Tversky 1979; 33028074 |
| R31 | Motivation mode is disclosed, switchable, capped at 100 points per block, and uses no real money or purchasable currency. | Transparency and removal protect autonomy and reduce compulsive-use risk. | 33028074; 34982715 |
| R32 | Core progress is banked before any risk; only bonus momentum can be lost. | The engagement layer must never endanger the measurement record. | ADR-007; 33028074 |
| R33 | Display controls include larger text and higher contrast; interactive targets stay at least 44px. | Older adults and low-vision users need readable, reachable controls. | ADR-008; WCAG target-size guidance |
| R34 | Trends are per-mechanic and never aggregated into a composite score. | Domain-specific change is the defensible measurement unit. | 40640327; 27697851 |
| R35 | The daily break cue is informational and never locks the user out. | Engagement must not become coercion; overuse is a documented risk. | 33028074; ADR-008 |
| R36 | Heavy-use patterns (many sessions in a day, back-to-back sessions, long daily totals) trigger a caring check-in with a one-tap Motivation pause for today; nothing ever locks the user out. | The disorder base rate is highest among heavy users and impulsive users; detection plus a non-coercive response is the proportional safeguard. | 33028074; 36571943; 37256740; 41659171; ADR-011 |
| R37 | Engagement pull uses verified behaviour-change techniques only: goal-setting, self-monitoring, feedback on behaviour and real-achievement celebration (consistency calendar, milestones, personal-best highlights). No loss framing, no random rewards, no purchasable currency. | Gamification moves behaviour while active (g=0.42) but fades after; BCT count moderates effectiveness. Pull must be re-earned each session, never extracted through compulsion drivers. | 34982715; 40779747; ADR-013 |
| R38 | Trial arms are protocol-gated, consented and logged: enrollment requires an investigator-provided trial ID, an assigned arm and explicit consent; every session carries its arm in the export; randomisation stays with the protocol, never in the app. The default product is always the control experience. | An investigational-device RCT must trace exposures per participant while keeping the marketed-safe default untouched; safety monitoring runs in every arm. | ADR-014 |
| R39 | The engagement arm differs by incentive design, not just reminders: a higher-variance bonus schedule (60/25/15) for stronger reward-prediction errors, and an attendance-contingent finisher bonus framed as gain. Schedules are disclosed per arm. | Deposit contracts beat lotteries and persist after removal; unexpected rewards drive dopaminergic consolidation; loss frames backfired versus gain frames, so the stake is attendance and the framing is gain. | 36367428; 24618584; 25933128; ADR-015 |
| R40 | The app sets one explicit weekly practice-day goal (default 3, adjustable 1-7) and shows progress with a goal-gradient nudge one day short and a met-goal acknowledgment. The per-session when-where intention stays as the daily companion; unrewarded specific goals are the supported configuration; days, not sessions, are counted because spaced days beat crammed sessions. | Specific goals move behaviour strongly (g=1.11), unrewarded goals beat rewarded ones, daily-plus-weekly beats weekly-only, and implementation intentions need reinforcement. | 38560998; 26445201; 30427874; 16719566; ADR-016 |
| R41 | Every block is retrieval practice with feedback, and the app says so: each task pulls an answer out of memory and scores it immediately. Spacing is structural (daily goal, back-to-back check-in, consistency calendar), not advisory. | Testing beats restudy (g=0.50, stronger with effortful recall and feedback); spaced retrieval beats massed at every retention interval. | 25150680; 16719566; ADR-017 |
| R42 | A slipped day gets a warm, evidence-true response, never a penalty: missing one day does not reset habit formation, and the habit horizon is about two months. The calendar shows the accumulation; nothing subtracts from it. | Habit strength improves with intervention (SMD 0.69) but takes ~2 months to start; single misses do not materially affect formation; habit correlates with frequency at r=0.46 and moderates intention. | 39685110; 21626256; ADR-018 |
| R43 | Each mechanic offers focused single-task sessions, and home suggests the weakest recent link: spaced retrieval works best on what you almost know, and delayed retest beats immediate restudy. Focus is explicit choice, never a lock-in. | Testing with feedback and spacing drive retention; mixed formats and delayed retest strengthen the effect. | 25150680; 16719566; ADR-019 |
| R44 | The plan form offers an optional temptation-bundling pairing (train with an existing indulgence). Bundling lifted gym visits 51% enforced and ~10-14% self-set; the self-set version is all an app can honestly offer. | Temptation bundling pairs a want with a should; effects fade, and most of the value is front-loaded. | 25843979; ADR-020 |
| R45 | The plan form completes the HAPA planning bundle: action cues (when/where), temptation-bundling pairing, and a coping response for obstacles. Planning interventions work at SMD 0.35 and work better with reinforcement. | Multi-component and coping planning show small-to-medium effects with reinforcement during follow-up; self-set terms work best. | 35742582; ADR-021 |
| R47 | planning copy and claims use document-delivered effect sizes (~0.28 for MCII, not the interactive 0.47); interactive formation means user-typed, self-set plans, and the saved plan keeps goal and obstacle visible together. | Mental contrasting works at g=0.28 and MCII at g=0.34, but document delivery runs lower; contrasting the future with the obstacle is itself effective. | 34054628; 30879403; ADR-022 |
| R48 | A monthly word-recognition far check runs on its own schedule and store, never mixed into practice metrics. It states plainly that reviews usually find no far transfer, so either answer is useful data; sessions carry the trial arm. | Far transfer is absent or fragile in the best-controlled reviews; a separate schedule keeps the measurement honest. | 27697851; 27474138; ADR-024 |
| R49 | The portable export is the complete trial record: practice sessions, far checks and symptom reports in one JSON file, each tagged with the study arm where applicable. Nothing stays stranded on-device. | Portability and analysis require the full record in one place. | ADR-025 |
| R50 | Sessions offer a hide-the-clock option for anxious trainers, default off with the clock shown. Anxiety impairs performance and perceived pressure raises anxiety; untimed beats timed, most for the anxious. | Test anxiety is small-to-moderate and negatively related to performance; self-esteem protects. | 29156362; ADR-026 |
| R51 | Every completed session records its engagement exposure (bonus schedule, banked total, finisher, per-block tiers) and the export carries the adaptation log, so the schedule manipulation is verifiable per participant. | A trial arm difference that cannot be audited in the data does not exist for analysis. | ADR-027 |
| R46 | Settings offers a copyable one-line weekly summary (days, sessions, minutes, goal progress) for accountability reporting to a coach, clinician or investigator. Social support aids adherence; accounts do not exist, so the user pastes it themselves. | Self-monitoring plus social accountability support adherence; no new data leaves the device except by user action. | ADR-022 |

---

## 4. Architecture implications

These are constraints on the future engine, not an implementation plan.

### 4.1 Evidence registry

A versioned registry that maps every activity to:

- modality (`cct`, `movement`, `audio`, `neurofeedback`);
- target domain;
- near-transfer task;
- evidence record IDs;
- evidence level (`supported`, `experimental`, `wellness_only`, `prohibited`);
- allowed claim text;
- safety flags and required screens;
- dose parameters;
- regulatory status.

The registry is the single source of truth for what the product may say. Content authoring fails closed: an activity without an allowed claim cannot ship.

### 4.2 Measurement service

- Separate batteries for near transfer, far transfer and everyday function.
- Alternate forms to reduce practice effects.
- Automated scoring and timestamped raw data.
- Baseline-adjusted analysis.
- Expectancy and blinding metadata.
- Pre-registration linkage.

### 4.3 Safety service

- Photosensitivity questionnaire and risk classification.
- Hard content limits enforced at render time, not by author discipline.
- Exercise screening and stop rules.
- Audio volume ceiling.
- Adverse-event capture with severity, causality and follow-up.
- Data consent and deletion workflow.

### 4.4 Personalization

- Adaptive difficulty is allowed as a hypothesis.
- The default progression must be explainable to the user.
- Adaptation logic must be logged so it can be audited.
- A fixed-difficulty arm must remain available for comparison.

### 4.5 Claim engine

- Every user-facing claim is generated from the registry, not typed ad hoc.
- Claims carry an evidence level and a date.
- Prohibited phrases are blocked in UI copy, store listings and marketing.
- A claim can be downgraded automatically when its evidence record is superseded.

---

## 5. MVP scope

### Phase 1 (weeks 0-12): measurement and cognitive core

- Evidence registry and claim engine.
- Near-transfer battery for working memory, attention and reasoning/speed.
- Four core modules: adaptive updating, sustained attention, reasoning strategy and simple reaction time.
- Safety layer: photosensitivity screen, AE capture, data consent.
- Adherence instrumentation.
- Internal pilot with an active control.

**Not in Phase 1:** neurofeedback, visual entrainment, clinical claims, dementia prevention, ADHD.

### Phase 2 (weeks 12-24): movement and relaxation

- Optional movement+cognition sessions with screening and progression limits.
- Audio relaxation module with parameter transparency and volume limits.
- Behaviour-change techniques for adherence.
- 3-month follow-up in the pilot.
- Far-transfer battery.

### Phase 3 (weeks 24-52): experimental and clinical

- Neurofeedback research module only with validated hardware, learning metrics and sham control.
- Clinical adjunct study in a supervised rehabilitation setting.
- Regulatory triage before any clinical claim.
- No direct-to-consumer medical claims.

### Never build without new evidence

- A composite "brain age" or "IQ gain" score.
- Dementia-prevention claims.
- ADHD-treatment claims.
- Consumer EEG cognitive-enhancement claims.
- Photic stimulation without a photosensitivity layer.

---

## 6. Pilot design

A defensible first study:

| Element | Choice |
|---|---|
| Population | Adults 50-75 with subjective cognitive concerns, not diagnosed MCI |
| Arms | Adaptive CCT, fixed-difficulty CCT, active control (novelty-matched computer activities) |
| Duration | 12 weeks, 3 sessions/week, 30 minutes |
| Primary outcome | Near-transfer composite in the trained domain |
| Secondary outcomes | Far-transfer composite, everyday function, adherence, adverse events |
| Follow-up | 3 months |
| Blinding | Automated cognitive outcomes; blinded assessor for functional outcomes |
| Analysis | Baseline-adjusted ANCOVA, intention-to-treat, pre-registered |
| Power | Pilot powered for feasibility and effect-size estimation, not confirmatory efficacy |
| Safety | Photosensitivity screen, AE capture, stop rules |

A pilot of 40 per arm is enough to estimate feasibility and variance; it is not enough to confirm a small far-transfer effect. A confirmatory trial should be powered for the smallest effect the product intends to claim.

---

## 7. Traceability

Every requirement above maps to at least one evidence record. The reverse mapping is maintained in the evidence table's `product_use` field. When a new review changes a record's conclusion:

1. update the evidence table;
2. rerun `python -m noesis review check`;
3. identify requirements whose evidence level changed;
4. update or withdraw the claim;
5. record the change in the project decisions log.

This is the mechanism that keeps the product honest as the literature evolves.
