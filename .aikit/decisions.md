# Decisions

Why this project is built the way it is, oldest first. One entry per decision that changes a
contract, a dependency, a data format or the architecture; IDs are consecutive and never reused.

<!-- Entry format:
### ADR-NNN: <decision in one line>
- **Date**: YYYY-MM-DD
- **Status**: Accepted
- **Context**: <what forced the decision>
- **Decision**: <what was decided>
- **Consequences**: <what follows, including what it costs>
-->

### ADR-001: Build the evidence base before the engine
- **Date**: 2026-10-31
- **Status**: Accepted
- **Context**: The product is multimodal and targets multiple populations. The literature distinguishes trained-task gains, near transfer, far transfer and everyday function, and the best-controlled reviews disagree with commercial claims. Building first would encode unverified assumptions into the architecture.
- **Decision**: Complete a PRISMA 2020 umbrella review with landmark-RCT updates before writing engine code. Store the review as a versioned protocol, search log, PRISMA flow, machine-readable evidence table, synthesis, design implications and safety/regulatory analysis.
- **Consequences**: The first release is a review and a validation tool, not a product UI. Every future claim must trace to an evidence record. The review is AI-assisted, 84 records deep, and explicitly provisional; a human-led clinical review is still required before clinical claims.

### ADR-002: Deterministic engine contract with a JSON action stream
- **Date**: 2026-10-31
- **Status**: Accepted
- **Context**: The web UI, Android WebView, unit tests and AI test harness must exercise the same mechanics. UI-owned timers and `Math.random` would make runs irreproducible and let the simulator test a different system than the user sees.
- **Decision**: Every mechanic is a pure state machine over JSON state and JSON actions. Randomness is a seeded mulberry32 state stored in the mechanic; time is a logical clock advanced by `advance` actions; the UI only renders views and dispatches actions. A stable state hash makes replay verification possible.
- **Consequences**: New mechanics must be serializable and side-effect free. `window.__NOESIS__` can drive the real session for AI testing. The trade-off is that real-time input arrives as many small `advance` actions, and every mechanic needs replay and determinism tests.

### ADR-003: Capacitor 7 with JDK 21 for the Android export
- **Date**: 2026-10-31
- **Status**: Accepted
- **Context**: The app must remain web-based while exporting to Android. Capacitor 6 depends on `tar@6`, which conflicts with the patched `tar@7` required to clear a critical dev-dependency advisory. Capacitor 7 uses `tar@7` directly and fixes the CLI extraction interop.
- **Decision**: Use Capacitor 7.6, Android SDK 35 and JDK 21. The Android build script detects the SDK and a JDK 21 installation, writes `android/local.properties`, builds the web bundle, syncs Capacitor, and runs the Gradle debug build.
- **Consequences**: The Android build requires JDK 21 (Java 17 fails with `invalid source release: 21`). The script reports that with a `Why:`/`Fix:` message. Generated assets and build directories are gitignored; `android/` itself is committed so the wrapper is reproducible.

### ADR-004: Local-first practice history with explicit export and clearing
- **Date**: 2026-11-01
- **Status**: Accepted
- **Context**: The evidence review makes measurement the product's core asset, but the app has no account or server. Storing session results only in memory would make the practice summary vanish on reload; shipping them to a backend would add privacy, cost and compliance scope before the product has a reason to.
- **Decision**: Store completed session results in local browser storage, capped at 20 sessions, and expose per-mechanic last and best accuracy. Provide JSON export and a targeted clear-history action. Keep safety and display preferences under separate keys so clearing practice data does not reset consent.
- **Consequences**: Practice data is device-local and user-exportable. Cross-device sync, clinician dashboards and longitudinal analytics are explicitly deferred. Any future sync must add consent, encryption and retention rules rather than silently extending this store.

### ADR-005: Critical integration of CyberPulse behavioral mechanics
- **Date**: 2026-11-01
- **Status**: Accepted
- **Context**: CyberPulse documents an evidence-informed engagement layer built around variable-ratio rewards, near-miss feedback, loss aversion/push-your-luck, Zeigarnik tension, autonomy/competence, deadlines, combo streaks, narrative transportation and implementation intentions. Noesis is a training and measurement product, not an entertainment game. Copying those mechanics wholesale would import gambling-adjacent compulsion loops and make training data harder to interpret.
- **Decision**: Adopt only autonomy/competence supports, an optional when/where practice plan, clear per-domain progress feedback and a non-punitive weekly summary. Reject variable-ratio rewards, near-miss amplification, loss-framed stakes, artificial deadlines, combo multipliers, loot and streak loss. Document the audit, citations and design rules in `docs/research/BEHAVIORAL_ENGAGEMENT.md`.
- **Consequences**: Engagement is designed to support the user's own goal rather than maximize session count. A/B tests may explore plan prompts and difficulty choice, but any future engagement feature must pass the one-sentence explainability rule and the autonomy test. The rejected mechanics remain out of scope even if they increase retention.

### ADR-006: Resumable sessions via a validated local snapshot
- **Date**: 2026-11-01
- **Status**: Accepted
- **Context**: The app is wrapped for Android, where the WebView can be killed and the browser can reload at any time. Losing an in-progress block breaks the measurement loop and makes the one-click start feel unreliable. The deterministic engine already produces JSON-serializable state, so a snapshot is cheaper and more faithful than replaying a long `advance` action log.
- **Decision**: Persist a versioned session snapshot while a session is running or between blocks, at most every 1.5 seconds. Restore it only if a structural guard confirms a current mechanic, a valid config and a resumable phase. Clear the snapshot on completion, abort, new session or data deletion. The user resumes explicitly from the home screen.
- **Consequences**: Progress survives reloads and process kills without a server. The snapshot contains local practice state only; it is not exported with practice history. A corrupt or outdated snapshot is discarded rather than crashing the app. Future engine schema changes must bump the snapshot version or keep the additive guard compatible.

### ADR-007: Motivation mode supersedes the blanket rejection of CyberPulse mechanics
- **Date**: 2026-11-01
- **Status**: Accepted
- **Context**: ADR-005 rejected variable-ratio rewards, near-miss amplification, loss-framed risk and combo mechanics because of gambling-harm and measurement-validity concerns. The product owner directed that these mechanics be integrated for adult and older-adult engagement. A blanket rejection is no longer the product decision.
- **Decision**: Implement a bounded Motivation mode, default on and switchable in Settings. It uses 70/20/10 cosmetic bonus tiers, a x1-x3 streak multiplier, a real personal-best near-miss cue, optional bonus-only push-your-luck between blocks, and a non-punitive target time. Cognitive scores, stored results and core progress are never affected. Odds are disclosed and each block is capped at 100 momentum points.
- **Consequences**: The engagement mechanics are now product features, not rejected ideas. ADR-005 remains as history and its safety rationale still applies; ADR-007 supersedes only its rejection decision. Any future change to odds, caps, risk rules or default state must update this ADR, the evidence audit, and the tests.

### ADR-008: Older-adult accessibility, trend visibility and a daily break cue
- **Date**: 2026-11-01
- **Status**: Accepted
- **Context**: Motivation mode increases engagement, and the primary audience now includes older adults. Small text, low contrast, opaque progress and unbounded daily play are avoidable barriers or risks for that group. The app already stores local session history, so it can show trends without a server.
- **Decision**: Add user-selected larger text and higher contrast classes, per-mechanic accuracy sparklines with no composite score, and a non-blocking daily break cue after two completed sessions. All three are local-only and switchable or informational. The break cue never locks the user out.
- **Consequences**: Older adults get more readable controls and a clearer view of change over time. The daily cue is a gentle counterweight to Motivation mode, not a restriction. A future clinical or assisted-living deployment may need default-on large text and a configurable session cap, but this version keeps both under user control.

### ADR-009: Add Speed Tap as a fourth, experimental processing-speed block
- **Date**: 2026-11-01
- **Status**: Accepted
- **Context**: The ACTIVE trial's speed-of-processing arm showed the most durable cognitive maintenance in older adults (0.66 at 10 years for the trained ability), but the app only covered working memory, inhibition and reasoning. A simple reaction-time task is not the UFOV divided-attention protocol used in ACTIVE, so it cannot inherit that claim wholesale.
- **Decision**: Add Speed Tap as a fourth standard-session block. It uses seeded foreperiods, a single circle onset, a response window, and reports mean, median, fastest, variability and lapses. It is labelled experimental, with an explicit "not a substitute for UFOV training" boundary. Quick sessions remain two blocks.
- **Consequences**: Standard sessions are longer and now cover processing speed. The mechanic has its own deterministic policy, replay tests, AI simulation coverage and UI stage. It must not be marketed as general processing-speed training or as dementia prevention without a separate trial.

### ADR-010: Per-session adverse-event capture with stop rules
- **Date**: 2026-11-02
- **Status**: Accepted
- **Context**: DESIGN_IMPLICATIONS R18 requires adverse events to be captured every session with stop rules and a review queue; the review claims AE capture as implemented but no code existed. Consumer training studies routinely under-report harms, and a measurement product that ignores symptoms cannot claim a safety layer.
- **Decision**: Add a post-session symptom check-in (six symptoms, three severities, optional 280-char note) backed by a versioned local store capped at 50 entries. A pure stop-rule function advises rest on any severe symptom or a repeated moderate one; clean check-ins store nothing. Reports are listed and clearable in Settings and wiped by full data deletion.
- **Consequences**: The safety layer is now real: screen before, capture after, review in Settings. The log is local-only and never exported with practice history. Any future movement or audio module must extend the symptom list and its own stop rules rather than bypassing this check-in.

### ADR-011: Compulsive-use detection with a caring, non-coercive response
- **Date**: 2026-11-02
- **Status**: Accepted
- **Context**: The November 2026 gaming-disorder update added six engagement records (PMIDs 33028074, 37256740, 36571943, 40115446, 41317410, 41659171). The disorder base rate is highest exactly where engagement mechanics bite hardest: young heavy users and impulsive users, including users with attention difficulties. BEHAVIORAL_ENGAGEMENT open question 4 asked how the app should detect compulsive use and respond.
- **Decision**: Detect three heavy-use patterns from local history (4+ sessions in a day, sessions less than 30 minutes apart, 45+ training minutes in a day) and show a caring check-in on the home screen with rest framing, a one-tap Motivation pause that expires the next day, and a per-day dismissal. Nothing locks the user out; pausing only silences cosmetic bonuses. See R36.
- **Consequences**: Heavy use gets a response instead of silence, while autonomy is preserved: training stays available, the pause is reversible, and thresholds are documented heuristics, not diagnoses.

### ADR-012: Opt-in adaptive difficulty as a logged experiment
- **Date**: 2026-11-02
- **Status**: Accepted
- **Context**: R12 requires adaptive difficulty to be tested, not asserted: adaptivity has a mechanistic rationale but no consistent behavioural advantage. Fixed difficulty under-doses advanced users and over-doses struggling ones, but changing difficulty changes what accuracy means across sessions.
- **Decision**: Add an opt-in adaptive mode, default off. Each mechanic holds a level 1-3 starting at the user's chosen difficulty; a block at 80% or better steps up, below 60% steps down, applied to the next session. Every change is appended to a capped local adaptation log. UI copy calls it an experiment and forbids cross-level score comparison.
- **Consequences**: Accuracy series remain comparable only within a level; the adaptation log is the dose-response record for any future A/B analysis. The engine stays deterministic: levels are session inputs, not in-session mutations.

### ADR-013: Engagement pull through verified behaviour-change techniques
- **Date**: 2026-11-02
- **Status**: Accepted
- **Context**: The user asked for game addictiveness pointed at brain function rather than only restraint. The evidence supports the pull side through behaviour-change techniques (gamification g=0.42 while active in PMID 34982715; BCT count moderates effectiveness in PMID 40779747), while the disorder literature forbids gambling-like drivers (PMIDs 37256740, 36571943).
- **Decision**: Add pull only from the verified set: a 14-day consistency calendar, one-time milestones for session counts, practice-day streaks and adaptive level-ups, and personal-best highlights that require a genuinely beaten prior best. No loss framing, no manufactured near-miss, no random or purchasable rewards; caps, odds disclosure, the break cue and the Motivation pause stay exactly as they are. See R37.
- **Consequences**: The app gets stickier through goal-setting, self-monitoring and real-achievement feedback. Streaks celebrate showing up and never punish missing a day; milestones fire once and are dismissible; personal bests compare within the same task only.

### ADR-014: Protocol-gated study arms for the investigational RCT
- **Date**: 2026-11-02
- **Status**: Accepted
- **Context**: The device will be tested in a randomised controlled trial, which needs engagement variants to be testable per participant with full exposure traceability. The default product must stay the safe control experience.
- **Decision**: Add study enrollment keyed by investigator-provided trial ID plus protocol-assigned arm (control or engagement) plus explicit consent; the engagement arm adds a daily streak reminder; every session record carries its arm and the JSON export carries the enrollment. Randomisation stays with the trial protocol: the app records and discloses, never assigns. Withdrawal keeps all data. Adverse-event capture, heavy-use detection and the Motivation pause run unchanged in every arm as trial safety monitoring. See R38.
- **Consequences**: The trial can compare arms with per-session exposure data while ethics-relevant facts (consent timestamp, arm, withdrawal) live on-device and export with the record. Any future arm (e.g. a stronger variable-reward schedule) must be added as a new gated variant with its own disclosure, never by changing the default.

### ADR-015: Incentive gradient between arms (volatile schedule + finisher bonus)
- **Date**: 2026-11-02
- **Status**: Accepted
- **Context**: The engagement arm differed from control only by a streak reminder — too weak a gradient to test whether incentive design moves adherence and dose. New evidence: deposit contracts beat lotteries and persist (PMID 36367428), incentives fade after removal (PMID 24618584), all-or-nothing attendance terms aid retention (PMID 25933128), unexpected rewards drive consolidation via prediction error, and loss frames backfire versus gain frames (PMID 36201384).
- **Decision**: Engagement arm uses a 60/25/15 volatile bonus schedule (control stays 70/20/10) and earns a +15 finisher bonus for completing every block — attendance-contingent, framed as gain, nothing staked. Schedules are parameterized in the engine with per-arm disclosure in Settings; all tiers and the bonus are logged in the motivation state.
- **Consequences**: The trial now tests a real incentive gradient while the default product is byte-identical to before. Loss framing stays out by design; any future schedule variant follows the same arm-gated, disclosed pattern. See R39.

### ADR-016: Explicit weekly session goal with goal-gradient framing
- **Date**: 2026-11-02
- **Status**: Accepted
- **Context**: The review now holds that specific goals move behaviour strongly (g=1.11, PMID 38560998), daily-plus-weekly beats weekly-only (PMID 26445201), and implementation intentions need reinforcement (PMID 30427874). The goal-gradient mechanism says effort accelerates near the goal. The app had a per-session intention but no explicit weekly target and no proximity nudge.
- **Decision**: Add one adjustable weekly session goal (1-7, default 3) shown as progress in the practice summary, with a one-more-hits-it nudge exactly one session short and a met-goal acknowledgment that names rest as earned. No endowment tricks, no loss framing, no rewards attached — unrewarded specific goals are the supported configuration. Amended: the goal counts practice days, not sessions, because spaced days beat crammed sessions. See R40.
- **Consequences**: The when-where intention gains its reinforcement loop; the goal-gradient nudge concentrates motivation where the evidence says effort naturally accelerates. The goal is display-only progress derived from stored history.

### ADR-017: Retrieval practice and spacing as the stated core loop
- **Date**: 2026-11-02
- **Status**: Accepted
- **Context**: Two Psychological Bulletin meta-analyses describe exactly what the app does: testing beats restudy (g=0.50, PMID 25150680) and spaced beats massed at every retention interval (PMID 16719566). The product never stated its loop, and the weekly goal counted sessions, letting users cram.
- **Decision**: State the loop in the practice summary (every block tests and scores immediately; that retrieval is the training) and count the weekly goal in practice days. Spacing stays structural across the goal, the back-to-back check-in and the calendar. See R41.
- **Consequences**: The central product claim is now a cited, tested mechanism rather than a slogan; the goal unit matches the calendar and streak units, so the whole engagement layer speaks in days.

### ADR-018: Slip-tolerant habit framing with an honest horizon
- **Date**: 2026-11-02
- **Status**: Accepted
- **Context**: The review now holds that habit strength improves with intervention (SMD 0.69) but takes about two months to start (PMID 39685110), that habit correlates with frequency at r=0.46 via context-dependent repetition (PMID 21626256), and that a single miss does not materially affect formation (Lally et al. 2009). The app punished nothing but also said nothing after a slip.
- **Decision**: Show a recovery line when yesterday was missed but the week shows prior practice: yesterday slipped, that does not reset anything, one session today keeps it forming. Mention the ~2-month horizon in the same breath as the calendar so expectations stay honest. See R42.
- **Consequences**: Missed days get warmth instead of silence or shame; the calendar remains an accumulator that never subtracts.

### ADR-019: Per-mechanic focus sessions with a weakest-link suggestion
- **Date**: 2026-11-02
- **Status**: Accepted
- **Context**: Spacing and testing rows show retrieval with feedback beats restudy and massing (PMIDs 25150680, 16719566); Adesope 2017 and Latimier et al. 2020 add that delayed retest and mixed formats strengthen the effect. The app could only train all four mechanics at once, so weak material waited for the next full session.
- **Decision**: Add explicit per-mechanic focus sessions (three blocks, one task, same difficulty/adaptive/motivation machinery) plus a home suggestion naming the weakest recent link. Focus is a choice on every card and in the suggestion; the full mixed session stays the default and the only entry from Start. See R43.
- **Consequences**: Users re-test exactly what wobbles, spaced by days; history, export, motivation and adaptive logs treat focus sessions identically, so measurement stays clean.

### ADR-020: Optional temptation-bundling pairing in the plan
- **Date**: 2026-11-02
- **Status**: Accepted
- **Context**: Bundling training with an existing indulgence lifted gym visits 51% enforced and ~10-14% self-set (PMID 25843979 and a 6,792-person follow-up). The intention form captured when and where but never what to pair training with.
- **Decision**: Add an optional pairing line to the when-where plan, displayed alongside when self-set encouragement is all an app can honestly offer. Backward compatible: old plans load with an empty pairing. See R44.
- **Consequences**: Planning gains a self-set commitment device without enforcement machinery the app cannot and should not build.

### ADR-021: Coping-planning obstacle line completes the HAPA bundle
- **Date**: 2026-11-02
- **Status**: Accepted
- **Context**: Planning interventions work at SMD 0.35 and work better with reinforcement (PMID 35742582); action and coping planning show small-to-medium objective effects with self-set terms best. The plan held action cues and a temptation pairing but no barrier response.
- **Decision**: Add an optional "If I get stuck, I will…" line to the plan, displayed with the plan and stored verbatim. Backward compatible: old plans load with an empty obstacle. The weekly goal plus the summary reinforce all three planning elements. See R45.
- **Consequences**: The plan form now holds cue, indulgence and barrier response in one stored intention; four optional inputs is the ceiling — further planning constructs go to guidance copy, not more fields.

### ADR-022: Copyable week summary for accountability without accounts
- **Date**: 2026-11-02
- **Status**: Accepted
- **Context**: Social accountability supports adherence and the trial needs low-tech adherence reports, but accounts and servers are out of scope.
- **Decision**: Add a "Copy week summary" button in Settings that copies one human-readable line (week of date, days of goal, sessions, minutes). Clipboard-only; nothing is transmitted. See R46.
- **Consequences**: Users can paste their week to a coach, clinician or investigator; no new data leaves the device except by explicit user action.

### ADR-023: Document-delivered effect calibration for planning claims
- **Date**: 2026-11-02
- **Status**: Accepted
- **Context**: MCII meta-analyses show g=0.34 overall but document-delivered formats run ~0.28 versus 0.47 interactive (PMIDs 34054628, 30879403); mental contrasting alone matches MCII for health behaviour (g=0.28). An app is document delivery.
- **Decision**: Calibrate all planning claims to the document-delivered number; formation stays interactive in the only way an app can (user-typed, self-set wording); the saved plan keeps goal and obstacle visible together so the contrast is re-read, and the new goal-link line makes that explicit. See R47.
- **Consequences**: Planning copy can never drift into interactive-delivery effect sizes; any future planning feature inherits the same ceiling.

### ADR-024: Monthly word-recognition far check on a separate schedule
- **Date**: 2026-11-02
- **Status**: Accepted
- **Context**: R7 requires far transfer measured separately; the landmark reviews find it absent or fragile (PMIDs 27697851, 27474138). The app measured near transfer only, so it could neither detect nor honestly deny far transfer, and the RCT lacked a far outcome.
- **Decision**: Add an 8-word study plus 16-trial recognition check on its own screen, store (capped at 12) and 30-day schedule, triggered from a Home card only when due. Results never enter practice history, motivation, adaptive or weekly-goal math; sessions carry the trial arm. The copy states the base rate up front. See R48.
- **Consequences**: The app can now report "practice does not reach word memory (so far)" as a measured fact rather than a cited one; the check doubles as the trial's far outcome with zero changes.

### ADR-025: The export carries the whole record
- **Date**: 2026-11-02
- **Status**: Accepted
- **Context**: The portable export carried practice sessions only; far checks and symptom reports were stranded on-device despite R38/R46 promising a complete trial record.
- **Decision**: Add optional farChecks and adverseEvents arrays to the JSON export (additive, default empty; old exports parse unchanged) and fill them at export time. See R49.
- **Consequences**: One file is the complete portable record; trial analysis needs no device access beyond the user's own export.

### ADR-026: Optional clock hiding for anxious trainers
- **Date**: 2026-11-02
- **Status**: Accepted
- **Context**: Test anxiety is negatively related to performance and perceived time pressure raises it (238-study meta-analysis, PMID 29156362); untimed conditions beat timed ones, most for high-anxious trainers. The session always displayed elapsed/target time with no way to suppress it.
- **Decision**: Add an opt-in "Hide the session clock" display setting, default off. Timing still paces the session underneath; only the display is suppressed. See R50.
- **Consequences**: Anxious trainers can remove the ticking clock without changing what the session measures; the default experience is unchanged.

### ADR-027: Per-session engagement exposure and adaptation-log export
- **Date**: 2026-11-02
- **Status**: Accepted
- **Context**: The trial manipulates bonus schedules and finisher bonuses, but completed sessions recorded neither the schedule used nor the bonuses earned, and the adaptation log never left the device — the manipulation was unverifiable.
- **Decision**: Record per-session engagement exposure (schedule, banked total, finisher, per-block tiers) on every completed session and include the adaptation log in the export. Additive and backward compatible. See R51.
- **Consequences**: Arm differences are auditable per participant; dose-response analysis has the adaptation trajectory without extra collection.

### ADR-028: Interleaved default lineup, blocked focus sessions
- **Date**: 2026-11-02
- **Status**: Accepted
- **Context**: A 59-study meta-analysis finds interleaved schedules beat blocked ones for inductive learning (g=0.42), strongest for complex similar material — but word lists reverse the effect (PMID 31556629). The app already matches both halves without ever stating the rule.
- **Decision**: Record the lineup rule explicitly (R52): default sessions interleave the four mechanics; focus sessions deliberately block one; the far check studies its words blocked. No product change — the code already does this.
- **Consequences**: Any future refactor of session construction must preserve the interleaved default deliberately, not accidentally.

### ADR-029: In-app notices are the whole prompt layer
- **Date**: 2026-11-02
- **Status**: Accepted
- **Context**: Technology-based prompts beat no strategy (RR 1.27), best for new content sent early (PMID 26747176) — but the effect is borderline and heterogeneous, and unsolicited push would trade against the autonomy the whole design protects.
- **Decision**: No push channel, inbox or badge is built or planned. Milestones, far-check due cards and weekly-goal nudges already implement the supported mechanism with consent-by-opening. See R53.
- **Consequences**: Engagement prompts stay inside sessions the user opened; any future prompt proposal must clear both a stronger evidence bar and the autonomy test.

### ADR-030: Older-adult touch-target hardening with no claim change
- **Date**: 2026-11-03
- **Status**: Accepted
- **Context**: R33 requires interactive targets of at least 44px for older adults. Audit found `.btn` and mechanic buttons already pass (46-56px) but `.nav`, `.brand`, `.choice`, `.check` labels and unstyled Settings inputs did not guarantee 44px.
- **Decision**: CSS-only pass in `src/styles.css`: 44px minimum on nav/brand/choice/check labels and Settings text/select controls. No engine, storage, Motivation or copy change; display modes (large text, high contrast, reduced motion) and hide-clock behavior unchanged.
- **Consequences**: All touched screens meet the 44px floor without layout or claim drift. Future interactive controls must keep the same floor; verification is manual audit plus `ui:shots` screenshots, not jsdom computed styles.

### ADR-031: First screenshot keepers are the seeded ui:shots set
- **Date**: 2026-11-03
- **Status**: Accepted
- **Context**: No screenshots existed; the app is mobile-first with an Android export path, but no emulator is available here.
- **Decision**: Run the project's own `npm run ui:shots` (seeded safety/settings, driven full session) at commit `aa99b88` and register six keepers (desktop home plus mobile home/session/results/settings/evidence) in `.aikit/media.json` and the README `aegean:screenshots` block. The native Android shell stays uncaptured.
- **Consequences**: README proves home, driven play, measured results with claim boundaries, settings and evidence. Reproduce with: `npm run dev`, then `npm run ui:shots`.

### ADR-032: Restored block-boundary snapshots credit momentum once
- **Date**: 2026-11-07
- **Status**: Accepted
- **Context**: Session snapshots are saved at `block_complete` together with Motivation state. On reload the App restored both, then the block-completion layout effect ran with a fresh credited-block ref and credited the same block again: a scripted browser playthrough saved `Unbanked 100` and the resumed screen showed `Unbanked 200`, and a regression test saw 36 points where 18 were expected.
- **Decision**: Seed the credited-block ref from the boot snapshot when its motivation already contains an outcome for the restored block index; otherwise keep `-1` so a snapshot saved before the credit, including an unresolved risk, is processed normally once. No storage format or UI change.
- **Consequences**: Resume now shows the same momentum, bank prompt and banked total as the pre-reload session. The guard is per block index, so older snapshots and snapshots without that block's outcome behave as before; a resumed boundary can never silently grow its reward.

### ADR-033: Evidence citations are single 48px PubMed rows
- **Date**: 2026-11-07
- **Status**: Accepted
- **Context**: R33 requires 44px interactive targets for older adults, but the evidence screen rendered 13 inline citation links only 21px high, with the PMID outside the link and no row boundary. A 390x844 audit found five visible links under the floor and `allAtLeast44High: false`; the tap target was easy to miss on a phone.
- **Decision**: Render each citation as one anchor containing its label and PMID, styled as a bordered row with `min-height: 48px` and 8px vertical padding; `href`, `target="_blank"` and `rel="noreferrer"` are unchanged. Raise the PMID metadata from 0.74rem to 0.8rem. No evidence copy, route or storage change.
- **Consequences**: The same 13 sources are now 13 single tappable rows (59px minimum at 390px), each exposing its PMID in the accessible name and still opening the correct PubMed page. Claim badges remain at 11.52px; they are a later readability candidate, not part of this change.

### ADR-034: Feedback keeps the trial stimulus and tints the stage
- **Date**: 2026-11-07
- **Status**: Accepted
- **Context**: The feedback state blanked the trial stimulus, so `Hit` / `Impulse error` appeared over an empty stage with nothing tying the result to what was just shown. A scripted playthrough captured `stimulus: null` and no stage tone in both N-back and Go/No-Go feedback frames.
- **Decision**: Expose the trial stimulus during the `feedback` phase in N-back, Go/No-Go and Speed views, dim it to 55% via `data-phase="feedback"`, and add `data-feedback="correct|incorrect|neutral"` to every mechanic stage for a non-flashing green/red border tint. Scoring, timing, input gating and copy are unchanged; high contrast keeps the border and text while dropping the shadow.
- **Consequences**: Players can connect a result to the trial it belongs to, and feedback is redundant beyond colour (text + icon-free border). The dimmed stimulus is a 120ms opacity transition that reduced-motion disables; the next trial still blanks and resets normally.

### ADR-035: Go/No-Go prompts never name the current trial
- **Date**: 2026-11-07
- **Status**: Accepted
- **Context**: In the blank response window the prompt still said `Respond to the circle.` for go trials and `Do not respond to the square.` for no-go trials. A late response could therefore read the answer after the shape had gone, contaminating the inhibition measure; a scripted run recorded `promptsEqual: false` and still scored the late no-go response as a commission.
- **Decision**: Replace the trial-specific prompt with one static line in stimulus, response and feedback (`Circles: respond. Squares: withhold.`), `Get ready.` during the inter-trial interval and `Block complete` at the end. No timing, response window, scoring or input gating changes.
- **Consequences**: The blank response window carries no trial identity; only the shape shown earlier can guide a response. Headless scoring still records the late no-go response as a commission, and the new test asserts the go and no-go response-window prompts are identical.

### ADR-036: Quick sessions rotate the two-mechanic window
- **Date**: 2026-11-07
- **Status**: Accepted
- **Context**: Quick sessions always took the first two blocks of the four-mechanic lineup, so repeated short sessions only ever trained N-back and Go/No-Go. A scripted run under four fixed clocks recorded four identical `nback,gonogo` lineups and `allFourCovered: false`, leaving Reasoning and Speed Tap reachable only through standard or focus sessions.
- **Decision**: `sessionBlocks` accepts a rotation offset and rotates the mechanic list before taking the quick two-block window; `defaultSessionConfig` passes the normalized session seed for quick sessions only. Standard sessions keep the fixed four-block interleaved order and focus sessions are unchanged. README's one-click section states the rotation.
- **Consequences**: Four consecutive seeds now produce `nback,gonogo`, `gonogo,reasoning`, `reasoning,speed` and `speed,nback`, so repeated quick sessions cover all four tasks while staying two blocks. The lineup is still deterministic from the seed, and per-mechanic history stays comparable because scoring is per block.

### ADR-037: Results and sessions carry the block level
- **Date**: 2026-11-07
- **Status**: Accepted
- **Context**: Settings tells users to compare blocks only within the same level, and adaptive difficulty changes each task's level between sessions, but neither the session header nor the result cards showed the level. A fixed-clock adaptive run recorded `blockDifficulty: null`, `results[].difficulty: null` and no level badges even though the blocks were level 1 and level 3.
- **Decision**: `completeBlock` copies the block's difficulty into the `MechanicResult` (optional, so old records remain valid), `SessionView` exposes `blockDifficulty`, the session eyebrow reads `Block N of M · Level L`, and each result card carries a `Level L` badge. The export/history pick the field up automatically; no scoring, timing or storage-version change.
- **Consequences**: Adaptive level changes are visible during the session and preserved with the result, so later comparisons can be grouped by level. Pre-v0.2 records simply show no badge, and results remain valid without the field.

### ADR-038: Ending a paused session asks for confirmation
- **Date**: 2026-11-07
- **Status**: Accepted
- **Context**: The paused overlay's single **End session** button cleared the snapshot and aborted the session immediately. A scripted run recorded one click leading to the home screen with `store: null` and `snapshot: false`; a mis-tap loses every unfinished block with no recovery.
- **Decision**: The first **End session** click switches the same paused dialog to a confirmation state with **Keep practicing** and **End session**; only the second End calls the abort. The confirmation resets whenever the session is not paused. Copy states that unfinished blocks are not saved and completed sessions remain in history. No auto-save of partial sessions and no snapshot-format change.
- **Consequences**: An accidental end is recoverable without changing deliberate abort behavior or storage. Ending takes one extra tap by design; completed-session history is untouched.







