# Design Implications

**Source:** [SYNTHESIS.md](SYNTHESIS.md)  
**Evidence table:** [analysis/evidence_table.json](analysis/evidence_table.json)  
**Status:** Product requirements derived from the review. Phase 1 measurement core is implemented in the app as of 2026-10-31.

---

## 0. Implementation status

The first vertical slice implements:

- four core mechanics (N-back, Go/No-Go, Reasoning, Speed Tap) as deterministic state machines, plus experimental Task Switch, Flanker, Spatial Span, Mental Rotation, Prospective Memory, Paired Associates and Change Detection focus tests;
- a one-click start that begins the first block immediately;
- a session runner with per-block scoring and no composite score;
- local practice history with per-mechanic last/best accuracy, JSON export and targeted clearing;
- a practice menu that selects a single test or the interleaved session and shows the full block history;
- a literature-based briefing before every test block, with the clock paused until the user begins;
- an optional bilingual research consent flow with a random participant code and versioned consent record;
- a local email hand-off that downloads the JSON export and prepares a mailto draft for the study team;
- a session adherence log that records starts, completions and early endings for dropout analysis;
- analysis-ready CSV exports for session blocks and adherence events, alongside the JSON record;
- a self-describing export manifest and a field-level data dictionary;
- an experimental Task Switch focus test for set-shifting and switch-cost measurement;
- an experimental Flanker focus test for interference control and interference-cost measurement;
- an experimental Spatial Span focus test for visuospatial working-memory span measurement;
- an experimental Mental Rotation focus test for spatial-reasoning practice;
- an experimental Prospective Memory focus test for delayed-intention practice;
- an experimental Paired Associates focus test for verbal episodic-memory practice;
- an experimental Change Detection focus test for visual working-memory practice;
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
| R3 | A far-transfer claim is allowed only after a pre-registered, actively controlled, blinded trial. | Far transfer is absent or fragile in the best-controlled reviews. | 22612437, 27474138, 27697851, 31939109, 30652908, 32738262 |
| R4 | The evidence registry tags each activity with modality, domain, evidence level, allowed claim and safety flags. | Makes claim drift a build error, not a marketing decision. | Review-wide |
| R5 | Prohibited claims are blocked at content authoring: IQ, intelligence, academic gain, dementia prevention, ADHD treatment, "brain age" reversal. | These claims are not supported and create regulatory risk. | 27474138, 39661381, 41016407 |
| R6 | Every claim shown to a user links to its evidence record and date. | The evidence is provisional and dated. | Protocol §15 |

### 3.2 Measurement and trials

| ID | Requirement | Rationale | Evidence |
|---|---|---|---|
| R7 | Near transfer, far transfer, everyday function, adherence and safety are measured on separate schedules. | The transfer gradient is the central finding. | 22612437, 27697851, 32507890, 25793607 |
| R8 | Any internal efficacy trial includes an active control and measures expectancy. | Passive controls inflate effects; expectancy can mimic neurofeedback. | 23360949, 40246295 |
| R9 | Outcome assessment is blinded or fully automated. | Blinding changes the ADHD and psychological-treatment results. | 39661381, 27238063 |
| R10 | A 3-month follow-up is mandatory for any durability claim. | Most effects fade; ACTIVE is the exception; WM subdomain effects can persist beyond six months. | 42959097, 24417410, 32507890, 25793607 |
| R11 | Dose (sessions, minutes, weeks) is recorded and dose-response is modelled, not assumed. | Dose is not linear or universal. | 42711482, 41772608, 36853526 |
| R12 | Adaptive difficulty is opt-in, experimental and logged; it is never marketed as superior without an A/B test. | Adaptivity has a mechanistic rationale but not a consistent behavioural advantage. | 41772608, 42711482, 25298292; ADR-012 |
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
| R52 | Default sessions interleave the four core mechanics; focus sessions are the deliberate blocked exception. The experimental Task Switch, Flanker, Spatial Span, Mental Rotation, Prospective Memory, Paired Associates and Change Detection are focus-only until the default lineup is revalidated. Interleaving beats blocking for inductive learning (g=0.42, strongest for complex similar material); word lists reverse it (blocking wins, g=-0.39), which the far checks blocked word-study respects. | Scheduling shapes inductive learning; material determines the direction. | 31556629; ADR-028; ADR-045; ADR-046; ADR-047; ADR-048; ADR-050; ADR-051; ADR-055 |
| R53 | In-app notices are the only engagement prompts: milestones, far-check due, weekly-goal nudges. No push channel is built or planned; unsolicited push would trade against autonomy, and adherence evidence names personalization, reminders and stable usable design as the drivers with technical difficulties the top barrier. See ADR-029. | Technology prompts beat no strategy (RR 1.27) with high heterogeneity; new-content prompts sent early work best. | 26747176; 35612886; ADR-029 |
| R46 | Settings offers a copyable one-line weekly summary (days, sessions, minutes, goal progress) for accountability reporting to a coach, clinician or investigator. Social support aids adherence; accounts do not exist, so the user pastes it themselves. | Self-monitoring plus social accountability support adherence; no new data leaves the device except by user action. | ADR-022 |
| R54 | A practice menu exposes every test and the complete local block history. Users can start one test, start or resume the interleaved session, or review past blocks. Explicit choice is autonomy support and is never marketed as a cognitive advantage. | SDT interventions have a small reliable behaviour effect mediated by autonomous motivation and perceived competence; focus sessions already provide the blocked exception. | 32437175; 31983293; ADR-040 |
| R55 | Before every test block, a brief explanation states the construct, the response rule, the supported claim, the explicit non-claims, a primary source and the safety note. The session clock does not run until the user begins. The briefing changes no score and is not itself efficacy evidence. | Test anxiety is negatively related to performance and perceived pressure raises it; predictable low-stakes framing plus claim transparency reduces avoidable ambiguity without adding a cognitive claim. | 29156362; ADR-040 |
| R56 | History reports each block separately with its mechanic, level, accuracy and summary. It never creates a composite score and never compares blocks across levels. | The review's measurement unit is the domain-specific block; composite scores can hide domain-specific nulls. | 40640327; 27697851; ADR-040 |
| R57 | Research data sharing is opt-in, consent-gated and pseudonymous. The export carries a random participant code and a versioned consent record, but no name, email address or account identifier. The study contact email is never written into the data file. | eConsent improves comprehension and auditability; data banking needs participant control and data minimisation. | 37656499; 36810093; 42443473; ADR-041 |
| R58 | Informed consent is a separate, bilingual (English/Turkish), versioned document covering purpose, data, hand-off, voluntariness, risks, benefits, confidentiality, retention, withdrawal and contact. Consent is blocked when the study contact is missing; withdrawal is available in Settings and stops future emails. | eConsent is better or not worse than paper for comprehension, acceptability and usability; a contact and a withdrawal path are part of an informed process. | 37656499; 36810093; ADR-041 |
| R59 | The email hand-off is user-triggered and local: the app downloads the JSON file and prepares a recipient/subject/body draft with attachment instructions. It never sends automatically, never stores an SMTP credential, and never uploads data to a Noesis server. | A server-backed upload would add a new controller and security surface; local-first portability is already required. | R49; 37656499; ADR-041 |
| R60 | Every session start is logged with its seed, block count, study arm and timestamp. Completion and early ending update the same event with the ending timestamp and the number of blocks completed. The log is shown in Settings and included in JSON exports; it contains no name, email address or account identifier, and Delete local data clears it. | Adherence is a primary outcome; a completed-session-only history cannot estimate dropout, and high dropout is documented in computerized training. | 40779747; 35612886; 30881315; ADR-042 |
| R61 | Settings offers local CSV exports for session blocks and adherence events. The sessions CSV has one row per block with stable headers and preserves the full metric and motivation objects as JSON strings; the adherence CSV has one row per event. Both are generated from the same local stores as the JSON export, use no server, and contain no name, email address or account identifier. | FAIR data stewardship calls for interoperable, reusable formats and machine-readable metadata; a nested JSON alone shifts flattening work and transcription risk to the study team. | 26978244; 41813053; R49; ADR-043 |
| R62 | Every JSON export carries a manifest with the app version, export schema version, evidence-review version, data-dictionary version, export timestamp, consent version and record counts. The data dictionary documents every JSON field and both CSV layouts; a field change updates the dictionary and its version in the same commit. | Reuse and reproducibility depend on provenance and documented field meanings; metadata must travel with the data. | 26978244; ADR-044 |
| R63 | Task Switch is an experimental focus test: a static coloured shape is answered under an alternating colour or shape rule, and the block reports accuracy, switch/repeat accuracy and switch cost. It is not in the default four-block lineup, makes no general-intelligence or everyday-function claim, and uses no flashing. | Executive-function training meta-analyses show small near- and far-transfer effects; single-component EF training was most effective in one analysis, while multicomponent training also transferred; the app adds one task without claiming superiority over multicomponent training or changing the validated core lineup. | 30998045; 32011155; ADR-045 |
| R64 | Flanker is an experimental focus test: a static five-arrow row asks for the centre arrow's direction under congruent or incongruent flankers, and the block reports accuracy, congruent/incongruent reaction time and interference cost. It is not in the default lineup, makes no general-intelligence or everyday-function claim, and uses no flashing. | No Flanker-specific training meta-analysis was eligible in this review; the standard interference-control paradigm is covered by the broader EF training evidence with small near transfer, so the app ships it as a claim-bounded experimental focus test. | 30998045; 32011155; ADR-046 |
| R65 | Spatial Span is an experimental focus test: a slow 3x3 grid sequence is reproduced by tapping, with an adaptive span and accuracy/mean-span/longest-span metrics. It is not in the default lineup, makes no general-intelligence, academic or everyday-function claim, and uses no flashing. | A 2025 meta-analysis found a small Corsi Block effect in healthy older adults (d=0.16); working-memory training reviews show short-term visuospatial near transfer but no convincing far transfer, so the app ships it as claim-bounded task practice. | 37822255; 22612437; 27474138; ADR-047 |
| R66 | Mental Rotation is an experimental focus test: two static block figures are compared as a rotation or a mirror image, with accuracy, same/mirror accuracy and reaction time. It is not in the default lineup, makes no mathematics, academic, general-intelligence or everyday-function claim, and uses no flashing. | A 2013 meta-analysis of 217 training studies found g=0.47 with stable transfer to untrained spatial tasks; a 2022 meta-analysis found a smaller mathematics effect that favoured concrete materials over computerized training, so only spatial-task practice is claimed. | 22663761; 35073120; 29276344; ADR-048 |
| R67 | Prospective Memory is an experimental focus test: an ongoing vowel/consonant classification runs while a Q cue requires a Remember response. It reports ongoing accuracy, cue hits/misses, false alarms and reaction time. It is not in the default lineup and makes no long-term, everyday-function or diagnostic claim. | A 2023 meta-analysis of 29 RCTs found a moderate immediate effect (g=0.54) but a non-significant long-term effect (g=0.20); methodological quality varied. | 35543836; ADR-050 |
| R68 | Paired Associates is an experimental focus test: a word pair is studied, then the partner is retrieved from four options, with accuracy and reaction-time metrics. It is not in the default lineup and makes no general-memory, academic, everyday-function or diagnostic claim. | A 2022 meta-analysis of 21 RCTs (n=4,149) found mnemonic training improved episodic memory immediately (g=0.408) and at follow-up (g=0.418), but the evidence is strategy-based, not this exact task. | 36301274; ADR-051 |
| R69 | Change Detection is an experimental focus test: a brief coloured array is held across a delay, then the changed square is selected, with accuracy, set-size and reaction-time metrics. It is not in the default lineup and makes no general-memory, academic, everyday-function or diagnostic claim. | No task-specific change-detection training meta-analysis was found; broader working-memory/executive-function training meta-analyses show short-term near transfer, so the claim is task practice only. | 30998045; 32011155; ADR-055 |
| R70 | Visual Search is an experimental focus test: a static conjunction grid (red-circle target among red squares and blue circles) with alternating small and large sets, reporting accuracy, reaction time and the within-session set-size cost. It is not in the default lineup and makes no general-attention, reading, academic or diagnostic claim. | Conjunction-search training improves the trained search and eye-movement efficiency, but no pooled healthy-adult transfer estimate exists; the two supporting clinical/neural sources are narrative-only. | 35838486; 36922549; 30859709; ADR-061 |
| R71 | The adherence card shows the local completion rate plus an evidence note: trial benefits appeared above study-level engagement/persistence of 60% or adherence of 80%, framed as context rather than a personal target or guarantee. | A 55-RCT meta-analysis (n=4,455) found g=0.286 cross-domain and significant effects only above those subgroup thresholds; they are observational moderators, not dose targets. | 38266127; ADR-062 |
| R72 | Every result card sits beside a linked caveat that everyday-function transfer is under-investigated in healthy adults and that trained-task/near-transfer gains do not establish a daily-life benefit. | Kelly 2014 (31 RCTs) found executive/memory gains but little everyday-function evidence; Chandler 2016 found only small ADL/mood effects in MCI, not a basis for a healthy-user claim. | 24607830; 27632385; ADR-063 |
| R73 | The Evidence screen lists three linked claim boundaries: no general-intelligence or academic gain, no ADHD symptom treatment, and no established everyday-function benefit in healthy adults. | Blinded-outcome CCT meta-analysis found no ADHD symptom effect (SMD 0.12) but working-memory gains (SMD 0.38-0.49); the working-memory and everyday-function reviews support the other two boundaries. | 22612437; 36977764; 24607830; ADR-064 |
| R74 | The Evidence screen's claim-boundary list states that combining exercise with cognitive training has not shown a reliable extra working-memory benefit over either component alone. | Wu 2023 (21 RCTs) found SMD 0.29 versus no intervention but 0.16 versus exercise and 0.08 versus cognitive training alone, both non-significant. | 37065695; ADR-066 |
| R75 | The clock option in Settings carries a linked note: game-training trials in older adults reported small near-domain gains and non-time-pressure formats among preferable design features, framed as group-level context, not a personal prescription. | Wang 2021 (15 RCTs, n=759) found g=0.23-0.40 near-domain effects and design-feature subgroups; those subgroups are observational, not a dose rule. | 32980574; ADR-065 |
| R76 | The Evidence screen's claim-boundary list states that baseline expectancy does not reliably predict training response, so the app does not personalise assignment by self-expectancy. | Motter 2024 (107-patient RCT) found no association between expectancy and 78-week cognition or everyday function and no expectancy-by-treatment interaction. | 38230719; ADR-067 |
| R78 | The Evidence screen's claim-boundary list states that no mood-disorder treatment claim follows from consumer brain training; the app logs symptoms for safety, not as a therapeutic outcome. | Woolf 2022 found moderate effects in diagnosed MDD with almost no everyday-transfer evidence, a clinical population unlike the app's users. | 33913064; ADR-068 |
| R79 | Digit Symbol is an experimental focus test: a static four-pair digit-shape legend, one target shape per trial and four digit buttons, reporting accuracy, response time and the within-block change. It is not in the default lineup and makes no general-speed, intelligence or everyday-function claim. | Broad training meta-analyses support small processing-speed near transfer; no task-specific digit-symbol training meta-analysis was found, so the record stays narrative-only. | 32011155; 32980574; 30998045; ADR-069 |
| R80 | The monthly far-check card links its no-transfer caveat to the underlying meta-analysis rather than stating it as unsupported assertion. | Melby-Lervåg & Hulme 2013 is in the corpus and reports reliable trained-task gains with no convincing generalization; a linked caveat keeps the app's central claim boundary verifiable. | 22612437; ADR-071 |
| R81 | The safety onboarding screen links its seizure and exercise questions to the corpus sources that justify them. | Epilepsy Foundation consensus and FINGER are in the corpus; linked citations make the safety posture auditable without adding medical advice. | 16146438; 25771249; ADR-072 |
| R82 | The research export panel links its documented, locally controlled file format to the FAIR principles, and consent stays explicit and revocable because data-sharing attitudes are not reliably measurable. | Wilkinson 2016 defines FAIR; Maxwell 2026 found weak measurement properties in 60 data-sharing surveys. | 26978244; 41813053; ADR-073 |
| R83 | The Evidence screen's near/far transfer explanation links the synthesis showing that effect sizes shrink with design quality and far transfer rarely occurs. | Sala & Gobet 2017 pooled chess, music and working-memory training meta-analyses and concluded that far transfer is rare. | 29276344; ADR-074 |
| R84 | When a confidence rating is shown, the result card links the metacognitive-training evidence and states that a one-item reflection prompt is not that intervention. | Sella 2023 found benefits from structured metacognitive training but often-limited study quality; the app's prompt is descriptive only. | 36218025; ADR-075 |
| R85 | Visual Search cites both the conjunction-search training study and the clinical symbol-search study, with the latter explicitly framed as context rather than a transfer claim for healthy users. | Zhang 2022 supports task-specific search gains; Vialatte 2023 is a 21-child single-group reading study with limited generalisability. | 35838486; 36922549; ADR-076 |
| R86 | The pre-test confidence note cites two independent JOL meta-analyses and keeps the prompt framed as reflection rather than a memory intervention. | Double 2018 found no overall reactivity (g=0.054) with material-dependent subgroups; Ingendahl 2025 found small immediate reactivity and publication bias. | 29161973; 40875340; ADR-077 |
| R87 | The Motivation safeguards cite the exergame motivation review alongside gaming-disorder sources, and rewards remain cosmetic because a game format alone does not establish outcomes. | Buyle 2022 found motivation components shape adherence but no cognitive or fall-risk benefit from the game format itself. | 35989930; ADR-078 |
| R88 | The Motivation safeguards also cite the game-factor meta-analysis, which reports small overall effects and feature-level rather than genre-level prediction. | Smith & Basak 2023 found g=0.25 across 63 studies and that gameplay features, not genre labels, predicted transfer; the app therefore promises task practice, not genre benefits. | 37531408; ADR-079 |
| R89 | Mental Rotation cites both spatial-training meta-analyses and keeps its no-academic-claim boundary, noting that computerized paradigms were weaker than concrete materials. | Hawes 2022 found spatial-thinking g=0.49 and math transfer g=0.28 with modality and transfer-distance moderators. | 22663761; 35073120; ADR-080 |
| R90 | The Motivation safeguards cite the action-game meta-analysis and keep action games excluded on flashing/fast-presentation safety grounds. | Bediou 2018 found g=0.55 for habitual players but only g=0.34 in interventions, with about 30 percent publication-bias inflation. | 29172564; ADR-081 |
| R91 | Go/No-Go cites the appetitive-behaviour meta-analysis and keeps its no-daily-impulse-control claim; Stop-Signal remains out of scope. | McGreen 2024 found g=-0.21 for food-related behaviour, not cognitive transfer. | 38309625; ADR-082 |
| R92 | Visual Search cites the neural training study explicitly as a mechanism finding, not evidence of user benefit. | Bueichekú 2019 found task-relevant resting-connectivity change after short training with no whole-network or everyday outcome. | 30859709; ADR-083 |
| R93 | Motivation mode uses cosmetic, capped rewards with gain framing and no real stakes; the safeguards cite the incentive-design RCT for the uptake and framing findings. | de Buisonjé 2022 found deposit contracts cut uptake and loss frames underperformed gain frames. | 36201384; ADR-084 |
| R94 | Motivation safeguards also cite the autonomy and reward-learning sources: rewards stay conspicuous and switchable, and never change scores, content or claims. | Faraoni 2023 links unperceived persuasion to loss of autonomy; Miendlarzewska 2016 shows reward can bias what is learned. | 37469930; 26657967; ADR-085 |
| R95 | The adherence card cites a second source showing that early endings are common in home-based training and that completers still report liking it. | Clausen 2019 found 38.5% and 57.1% dropout in two pilot arms; the app records early endings without judgement. | 30881315; ADR-086 |
| R96 | Visual Search cites the UFOV construct-purity meta-analysis to justify single-construct, block-level measurement rather than a composite score. | Woutersen 2017 found every domain correlated with every UFOV subtest and no subtest selectively sensitive to one construct. | 29270605; ADR-087 |
| R97 | The research export panel cites data-governance guidance beside FAIR: consent stays versioned and revocable so participation remains controllable. | O'Dea 2026 recommends harmonised standards and hybrid consent models that preserve participant control as analytics evolve. | 26978244; 42443473; ADR-088 |
| R98 | The pre-test confidence note cites three JOL sources, including monitoring-accuracy evidence, and keeps the prompt descriptive rather than diagnostic. | Hu 2025 found stronger learners were slightly poorer at monitoring their learning (N=2,406), so self-ratings cannot calibrate performance. | 40875340; 29161973; 40845062; ADR-089 |
| R99 | Visual Search cites both the positive UFOV training meta-analysis and the construct-purity critique, explaining the choice of transparent single-construct tasks over a proprietary composite. | Edwards 2018 found functional transfer and durability but no transfer to other neuropsychological outcomes; Woutersen 2017 found no subtest measures one construct. | 29175362; 29270605; ADR-090 |
| R100 | Motivation safeguards cite the I-PACE process model to justify avoiding variable stakes, loss cues and push notifications. | Brand 2016 identifies cue-reactivity and reduced executive control as maintenance mechanisms of excessive use. | 27590829; ADR-091 |

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
