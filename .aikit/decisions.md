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

### ADR-039: Personal bests and near-best cues compare within a level
- **Date**: 2026-11-07
- **Status**: Accepted
- **Context**: Results now record their block level (ADR-037) and Settings says to compare only within the same level, but `bestAccuracyFor`, `detectNewBests` and the Motivation near-best cue still compared every historical accuracy regardless of level. A level-1 block at 83% could be measured against a level-3 best of 95%, suppressing both the near-best cue and the home "Best" value.
- **Decision**: `bestAccuracyFor(history, mechanic, difficulty?)` filters by exact result difficulty when a level is given; `detectNewBests` and the App's near-best lookup pass the current result's level; the home practice row derives the level from its last result and labels `Last L{level}` / `Best L{level}`. Legacy results without a level only participate when no level is requested; a first new-level block has no prior best and is not flagged.
- **Consequences**: Bests, new-best badges and near-best bonuses are honest within a level and cannot be inflated by an easier level. Old-history users see unlabelled comparisons until their next same-level block, then level-labelled ones.

### ADR-040: Practice menu and pre-test briefing
- **Date**: 2026-11-08
- **Status**: Accepted
- **Context**: The app exposed single-test focus buttons on Home and per-mechanic last/best values, but there was no single place to compare tests, choose one, and review completed blocks. The session also began scoring immediately after the one-click start, with only a one-line instruction; users had to infer the construct, claim boundary and source. The user asked for a test-selection/history menu and a brief explanation before every test. The literature supports explicit choice as autonomy support (SDT meta-analyses, PMID 32437175 and 31983293) and low-stakes, predictable framing for test anxiety (PMID 29156362), while the review's claim-transparency rule (R6) requires a source at the point of use.
- **Decision**: Add a **Menu** screen with Choose a test and History tabs. The Choose tab lists all four tests with a literature brief, supported claim, explicit non-claims, primary PMID link, and per-test last/best accuracy; it can start one test or the interleaved session. History lists every completed session block by block with mechanic, level, accuracy and summary, with no composite score. Add a **Before this test** card before every block stating what it measures, how to respond, the supported claim, the non-claims, the primary source and safety. The session clock is paused until **Begin test**; the briefing changes no engine state or score.
- **Consequences**: Test choice and history are discoverable without changing the engine, storage format or scoring. The pre-test briefing is repeated for every block, including repeated blocks in a focus session, so no block starts without its explanation. Screen changes reset the scroll position, so starting a test from a scrolled menu card lands on the top of the briefing rather than halfway down it. The browser proof records `scrollBeforeStartPx: 2557`, `scrollOnBriefingPx: 0`, `tickWhileBriefingMs: 0` and `tickAfterBeginMs: 911`; the UI audit records no console errors, no horizontal scroll, and all new source links at least 44px high.

### ADR-041: Research consent and local email data return
- **Date**: 2026-11-08
- **Status**: Accepted
- **Context**: The user wants Noesis to collect data for future articles. The app is local-only and has no server, account, SMTP credential or data controller. The literature says digital consent can improve comprehension, acceptability and usability compared with paper (PMID 37656499; 35 studies, 13,281 participants; no study favoured paper) while enrolment effects are mixed (PMID 36810093; 12 studies, 8,864 participants). A 2026 data-banking Perspective recommends hybrid broad-plus-dynamic consent, participant control and privacy-preserving governance (PMID 42443473). A simple "send data" button without consent, a contact and a withdrawal path would not be an informed process.
- **Decision**: Add a separate bilingual English/Turkish research-consent screen with five required confirmations, a random participant code, a consent version, the current-study and future-articles scopes, a consent timestamp and a withdrawal timestamp. Consent is blocked until the study team configures a valid contact email in Settings. Add a local email hand-off: **Send research data** builds the JSON export, downloads it, and prepares a recipient/subject/body `mailto` draft; the user must attach the file and send it. The app never sends automatically, stores no SMTP credential, and never uploads to a Noesis server. Withdrawal stops future drafts but cannot recall data already sent. The export carries consent metadata but not the study contact email. A changed study email requires re-consent.
- **Consequences**: Research participation is opt-in and auditable without changing the local-first data model. The email recipient and the participant's email address are visible only to the email provider and the study team, not to a Noesis backend. The user must make one extra attachment step by design. The consent text is a template and must be reviewed by the local ethics committee or IRB and adapted to KVKK/GDPR before data collection; the app does not replace that review. The browser proof records five consent checkboxes, a Turkish title, a participant code in the export, no study contact email in the file, a downloaded `noesis-research-*.json`, a `mailto:` draft, withdrawal disabling future sends, and no console errors.

### ADR-042: Session adherence log
- **Date**: 2026-11-08
- **Status**: Accepted
- **Context**: The review makes adherence a primary metric (R22; PMID 40779747) and the measurement plan lists sessions started/completed and dropout. The history store contained only completed sessions, so a participant who started and abandoned a session was invisible. A pilot RCT in computerized training reported 38.5% and 57.1% dropout in active and placebo arms (PMID 30881315), so a completers-only export would systematically overstate adherence.
- **Decision**: Add `noesis.adherence.v1` with one event per session: `id`, `seed`, `startedAt`, `endedAt`, `status` (`started`/`completed`/`aborted`), `blocksCompleted`, `blockCount` and `arm`. Log a start when a session begins; update the matching start on completion or an explicit early ending. Mark any still-open start as aborted when a new session begins, so closing the app does not leave an open event forever. Include the log in every JSON export and show a local summary in Settings. **Delete local data** clears it. No engine, scoring or timing change.
- **Consequences**: Dropout and dose are measurable without a server or a new prompt. A force-closed session is recorded as aborted when the next session starts, with zero completed blocks; the exact close time is unknown, which the research note records as a limitation. Direct engine-level aborts (used only in tests/simulators) do not update the log; the production end-session path does. Old exports remain valid because `adherence` defaults to `[]`. The Menu History tab and Settings show the same neutral started/completed/ended-early summary so the participant can see the recorded behaviour without loss framing.

### ADR-043: Analysis-ready CSV companions
- **Date**: 2026-11-08
- **Status**: Accepted
- **Context**: The JSON export is the complete record, but nested `results[]` and `adherence[]` arrays force the study team to flatten the data by hand before analysis in R, SPSS, Stata or a spreadsheet. FAIR data stewardship calls for interoperable, reusable formats and machine-readable metadata (PMID 26978244), and the review already requires a portable export (R49). A flat CSV must not replace the complete JSON or drop mechanic-specific metrics.
- **Decision**: Add two local CSV exports in Settings. The sessions CSV has one row per mechanic result with stable headers and preserves the full metric and motivation objects as escaped JSON strings. The adherence CSV has one row per start/completion/aborted event. Both are generated from the same local stores as the JSON export, use RFC 4180-style quoting, are date-stamped, and contain no name, email address or account identifier. Buttons are disabled when the relevant store is empty.
- **Consequences**: Researchers can open the main analysis tables directly while the JSON remains the source of truth for nested fields, consent and future schema additions. The CSV is a flat view; a metric that exists only in `metrics_json` must be parsed in the analysis tool. No server, storage format or scoring change.

### ADR-044: Self-describing export manifest and data dictionary
- **Date**: 2026-11-08
- **Status**: Accepted
- **Context**: The JSON export had a top-level `version` and a session count, but a receiving team could not tell which app release, evidence review or consent version produced a file, nor what each field meant. FAIR reuse requires metadata to travel with the data (PMID 26978244). The Settings footer also still said "evidence review v1.0" after two review updates.
- **Decision**: Add a `manifest` object to every JSON export with `appVersion`, `exportSchemaVersion`, `evidenceReview`, `dataDictionaryVersion`, `exportedAt`, `consentVersion` and counts for sessions, blocks, far checks, symptom reports, adherence events and adaptation events. Centralize app and review versions in `src/content/appMeta.ts`, and use them in the Settings footer. Add `docs/research/DATA_DICTIONARY.md` covering every JSON field and both CSV layouts. A field change must update the dictionary and `DATA_DICTIONARY_VERSION` in the same commit.
- **Consequences**: Every export is self-describing without requiring the app build, and the Settings footer no longer reports a stale review version. The manifest is additive, so old exports and consumers remain valid. The dictionary is manual prose, not generated; a missed update is a documentation defect, and the export tests assert the manifest shape and counts.

### ADR-045: Experimental Task Switch focus test
- **Date**: 2026-11-08
- **Status**: Accepted
- **Context**: The new-game literature search found two executive-function meta-analyses (PMID 30998045, 32011155) showing small near- and far-transfer effects in older adults, with single-component EF training most effective. The candidate matrix also considered Flanker, stop-signal, spatial span, mental rotation, visual search/UFOV, action games and commercial brain-training suites. Action games conflict with the no-flashing safety posture; the other tasks lack a task-specific meta-analysis in this search or duplicate an existing construct.
- **Decision**: Add an experimental **Task Switch** mechanic: a static coloured shape is answered under an alternating colour/shape rule, with switch/repeat accuracy and switch cost. It is available from the Menu as a three-block focus test. The default standard session stays the four-core lineup; Task Switch is not mixed in silently. It is `experimental`, uses no flashing, and carries no general-intelligence, academic, dementia-prevention or everyday-function claim.
- **Consequences**: The app gains a literature-selected cognitive-flexibility task and a new measurement outcome without changing the validated core session. `npm run ai:verify` grows from 400 to 500 deterministic simulations (5 mechanics × 50 seeds × 2 strategies). The candidate matrix and limits are in `docs/research/NEW_MECHANIC_CANDIDATES.md`; future tasks must be chosen by task-specific evidence and safety, not genre labels.

### ADR-046: Experimental Flanker focus test
- **Date**: 2026-11-08
- **Status**: Accepted
- **Context**: The user asked to continue from the candidate matrix. PubMed searches found no eligible Flanker-specific training meta-analysis; the broader executive-function training meta-analyses (PMID 30998045, 32011155) show small near-transfer effects in older adults, and Flanker is a standard interference-control paradigm. The matrix's preference for task-specific evidence therefore cannot be met exactly.
- **Decision**: Add an experimental **Flanker** focus test: a static five-arrow row with a left/right centre arrow and congruent or incongruent flankers; answer Left/Right; report accuracy, congruent/incongruent reaction time and interference cost. It is available from the Menu as a three-block focus test, not in the default lineup. The copy states explicitly that no Flanker-specific meta-analysis was found and that this is task practice, not a validated protocol, diagnostic, general-intelligence or everyday-function claim.
- **Consequences**: The app gains a sixth mechanic and `npm run ai:verify` grows to 600 simulations (6 × 50 × 2). The exception to the task-specific-evidence preference is recorded in the candidate matrix and this ADR; future candidates still need task-specific evidence or a similarly explicit, claim-bounded rationale.

### ADR-047: Experimental Spatial Span focus test
- **Date**: 2026-11-08
- **Status**: Accepted
- **Context**: The candidate matrix listed spatial span/Corsi as the next untested visuospatial working-memory candidate. A targeted PubMed search on 2026-11-08 found a 2025 systematic review and meta-analysis of cognitive training in healthy older adults (PMID 37822255; 31 included trials, 13 in the meta-analysis) with a small Corsi Block effect (d=0.16, p=.002), while Digit Span backward and N-back were not significant. Broader working-memory reviews (PMIDs 22612437, 27474138) show short-term visuospatial near transfer but no convincing far transfer. The effect is small and task-specific, not a validated protocol.
- **Decision**: Add an experimental **Spatial Span** focus test: a 3x3 grid presents a slow sequence of highlighted blocks, then the user taps the same order. The span starts at 3/4/5 by level and adapts after each trial. The block reports accuracy, mean span, longest correctly recalled span, timeouts and streaks. It is available from the Menu as a three-block focus test, not in the default lineup. Copy claims visuospatial working-memory practice only, not general intelligence, academic achievement, everyday function or a diagnostic result.
- **Consequences**: The app gains a seventh mechanic and `npm run ai:verify` grows to 700 simulations (7 × 50 × 2). The evidence table gains one context record (37822255), taking the review to 119 records and 281 outcomes and revision v1.3. The small Corsi effect and absent far-transfer evidence are stated in the candidate note and R65.

### ADR-048: Experimental Mental Rotation focus test
- **Date**: 2026-11-08
- **Status**: Accepted
- **Context**: The candidate matrix listed mental rotation as the remaining untested spatial candidate. A targeted PubMed search found Uttal et al. 2013 (PMID 22663761), a meta-analysis of 217 spatial-training studies with an average effect of g=0.47, stable over delays and transferred to untrained spatial tasks. Hawes et al. 2022 (PMID 35073120) found spatial training improved spatial thinking (g=0.49) and mathematics (g=0.28), but concrete materials outperformed computerized training and near mathematics outcomes transferred more than distal ones. Sala and Gobet (PMID 29276344) found far transfer rarely occurs.
- **Decision**: Add an experimental **Mental Rotation** focus test: two static block figures are shown, and the user decides whether the right figure is the same shape rotated or a mirror image. It reports accuracy, same/mirror accuracy, mean response time, timeouts and streaks. It is available from the Menu as a three-block focus test, not in the default lineup. Copy claims spatial-task practice only; mathematics, academic, general-intelligence and everyday-function gains are explicitly not claimed, especially for computerized training.
- **Consequences**: The app gains an eighth mechanic and `npm run ai:verify` grows to 800 simulations (8 × 50 × 2). The evidence table gains one context record (22663761), taking the review to 120 records and 282 outcomes and revision v1.4. The claim boundary is recorded in R66 and the candidate note.

### ADR-049: UFOV-like visual search and stop-signal remain out of scope
- **Date**: 2026-11-08
- **Status**: Accepted
- **Context**: The candidate matrix's remaining entries were a UFOV/visual-search task and a stop-signal task. A targeted PubMed search verified Edwards et al. 2018 (PMID 29175362; 44 UFOV studies from 17 RCTs; speed/attention and everyday-function gains, durable, adaptive better than non-adaptive, but no transfer to other neuropsychological outcomes) and Woutersen et al. 2017 (PMID 29270605; UFOV subtests are not construct-pure). McGreen et al. 2024 (PMID 38309625) meta-analysed 32 Go/No-Go and Stop-Signal studies and found a small appetitive-behaviour effect (g=-0.21), not cognitive-training transfer.
- **Decision**: Do not implement a UFOV-like visual-search mechanic or a separate stop-signal mechanic. UFOV is a proprietary multi-subtest protocol; a simplified task would not be the validated intervention, and its brief adaptive visual presentation conflicts with the app's static no-flashing safety posture. Stop-signal duplicates the Go/No-Go inhibition construct, and its training evidence is behaviour-change focused. Speed Tap remains explicitly not UFOV.
- **Consequences**: The review stays at 120 records and 282 outcomes; no new mechanic or evidence-table record is added. The rationale and revisit conditions are documented in section 6 of `NEW_MECHANIC_CANDIDATES.md`. Revisit UFOV only with a non-proprietary, separately validated paradigm and a photosensitivity/protocol review.

### ADR-050: Experimental Prospective Memory focus test
- **Date**: 2026-11-08
- **Status**: Accepted
- **Context**: The exhausted candidate matrix prompted a fresh scan outside it. Tse et al. 2023 (PMID 35543836; *Neuropsychology Review*) reviewed 48 prospective-memory training studies and meta-analysed 29 RCTs: immediate effect g=0.54 in older adults, but long-term effect g=0.20 and not significant; methodological quality varied. This is a distinct construct not covered by the existing mechanics.
- **Decision**: Add an experimental **Prospective Memory** focus test: an ongoing vowel/consonant classification with an event-based Q cue that requires a Remember response. It reports overall accuracy, ongoing accuracy, cue hits/misses, false alarms, mean response time, timeouts and streaks. It is available from the Menu as a three-block focus test, not in the default lineup. Copy claims delayed-intention practice only; no long-term, everyday-function or diagnostic claim.
- **Consequences**: The app gains a ninth mechanic and `npm run ai:verify` grows to 900 simulations (9 × 50 × 2). The evidence table gains one context record (35543836), taking the review to 121 records, 283 outcomes and revision v1.5. The claim boundary is recorded in R67.

### ADR-051: Experimental Paired Associates focus test
- **Date**: 2026-11-08
- **Status**: Accepted
- **Context**: The fresh scan next evaluated verbal paired-associate / episodic-memory training. Chen et al. 2022 (PMID 36301274; *Psychology and Aging*) meta-analysed 21 RCTs with 4,149 healthy older adults: mnemonic training improved episodic memory immediately (g=0.408) and at follow-up (g=0.418), and subjective memory improved. The evidence is for mnemonic strategy training, not repeated paired-associate practice. Gross et al. 2012 (PMID 22423647; 35 studies, g=0.31) stayed narrative-only as broader memory-strategy evidence.
- **Decision**: Add an experimental **Paired Associates** focus test: a word pair is studied for a short interval, then the first word cues retrieval of the second from four options. It reports accuracy, mean response time, timeouts and streaks. It is available from the Menu as a three-block focus test, not in the default lineup. Copy claims verbal episodic-memory practice only; no general-memory, academic, everyday-function or diagnostic claim.
- **Consequences**: The app gains a tenth mechanic and `npm run ai:verify` grows to 1,000 simulations (10 × 50 × 2). The evidence table gains one context record (36301274), taking the review to 122 records, 284 outcomes and revision v1.6. The claim boundary is recorded in R68.

### ADR-052: Dual-task training stays out of scope; Paired Associates adds an optional mnemonic hint
- **Date**: 2026-11-08
- **Status**: Accepted
- **Context**: A fresh scan evaluated cognitive-motor dual-task training. Gao and Liu 2025 (PMID 40410069) found improvements in gait, balance, executive function and fall risk in community older adults, and Hao et al. 2025 (PMID 40304821) network meta-analysed 32 RCTs in MCI/dementia, finding dual cognitive-task training best for global cognition. Both are clinical or motor-cognitive populations, not healthy-adult screen-based cognitive training. The Paired Associates evidence (Chen et al. 2022, PMID 36301274) is mnemonic-strategy training, so an optional strategy hint applies that evidence directly without changing scoring.
- **Decision**: Do not add a dual-task mechanic; the app is sedentary and screen-only, and a meaningful protocol would need a motor or continuous tracking component with unresolved safety and measurement issues. Add a collapsed "Strategy tip" to the Paired Associates study screen: link the two words in a vivid image or short sentence. The hint is optional, does not affect scoring, and is not claimed as a validated protocol or a source of far transfer.
- **Consequences**: No new mechanic or evidence-table record is added for dual-task training; the review remains at 122 records and 284 outcomes. The Paired Associates hint is covered by a UI test and a before/after study-screen proof.

### ADR-053: Verbal fluency and face-name stay out of scope; the mnemonic hint reaches the briefing
- **Date**: 2026-11-08
- **Status**: Accepted
- **Context**: A targeted verbal-fluency search found no eligible training meta-analysis; fluency is generally an outcome measure, and open-ended word generation cannot be scored deterministically without a validated dictionary and semantic rater. Kelly et al. 2014 (PMID 24607830) reported face-name recall (p=0.02) and paired associates (p=0.001) gains versus no intervention in healthy older adults, but this is not an active-control face-name training meta-analysis, and a proper face-name task requires a validated face stimulus set with privacy and consent handling. Paired Associates already covers verbal associative memory.
- **Decision**: Do not add verbal-fluency or face-name mechanics. Move the existing Paired Associates mnemonic hint into the pre-test briefing as an optional Strategy tip, while keeping it on the study screen. It does not change scoring and is not claimed as a validated protocol or a source of far transfer.
- **Consequences**: No new mechanic or evidence-table record is added; the review remains at 122 records and 284 outcomes. The briefing hint is covered by a UI test and a before/after briefing proof.

### ADR-054: Optional confidence check, not metacognitive training
- **Date**: 2026-11-08
- **Status**: Accepted
- **Context**: A targeted confidence-calibration search found no training meta-analysis. Sella et al. 2023 (PMID 36218025) meta-analysed 25 studies in 1,768 older adults: metacognitive training improved memory (d=0.52) and strategic metacognitive training improved memory (d=0.44), metacognitive beliefs, strategy use and some well-being outcomes, but methodological quality was limited. A single confidence rating is a monitoring prompt, not the multi-session training those trials evaluated.
- **Decision**: Add an optional **Confidence check** to the pre-test briefing (Low/Medium/High) and repeat the selected level on the corresponding result card. It is clearly labelled as a reflection, not scored and not a diagnostic calibration. No new mechanic or evidence-table record is added. The choice is stored per block in the session state and snapshot so it survives reload, is attached to the completed result, and appears in a same-mechanic, same-level confidence-versus-accuracy summary in Menu History.
- **Consequences**: The app gains a small metacognitive awareness prompt without a training claim. The prompt is test-covered and has before/after briefing and results proofs; the review remains at 122 records and 284 outcomes. Sessions CSV gains a `confidence` column; JSON exports carry the field on each result.

### ADR-055: Experimental Change Detection focus test
- **Date**: 2026-11-08
- **Status**: Accepted
- **Context**: A fresh visual working-memory search found no eligible change-detection training meta-analysis. The broader working-memory and executive-function training meta-analyses already in the corpus (PMID 30998045, 32011155) show short-term near transfer but no convincing far transfer. Change detection is a standard visual working-memory paradigm and is distinct from N-back updating and Spatial Span sequencing.
- **Decision**: Add an experimental **Change Detection** focus test: a brief coloured array is shown, followed by a delay and the same array with one changed square; the user taps the changed square. It reports accuracy, set size, mean response time, timeouts and streaks. It is available from the Menu as a three-block focus test, not in the default lineup. Copy claims visual working-memory practice only; no general-memory, academic, everyday-function or diagnostic claim.
- **Consequences**: The app gains an eleventh mechanic and `npm run ai:verify` grows to 1,100 simulations (11 × 50 × 2). No evidence-table record is added; the review remains at 122 records and 284 outcomes. The task-specific evidence exception is recorded in R69 and the candidate note, following the Flanker precedent.

### ADR-056: Judgments-of-learning evidence bounds the confidence check
- **Date**: 2026-11-08
- **Status**: Accepted
- **Context**: A targeted judgments-of-learning search found Ingendahl et al. 2025 (PMID 40875340; *Psychological Bulletin*; 344 effect sizes from 175 experiments, N=15,079): immediate item-level JOL reactivity was g=0.22 (95% CI [0.17, 0.27]); related word pairs showed g=0.44, unrelated pairs g=-0.09, and publication bias favoured positive reactivity. Double et al. 2018 (PMID 29161973) found no overall effect but positive reactivity for related pairs and word lists. Hu et al. 2025 (PMID 40845062; meta-analysis N=2,406) found better learners had slightly poorer monitoring accuracy. This evidence concerns item-level judgments made during study, not the app's single block-level pre-test rating.
- **Decision**: Keep the optional confidence check, but state its evidence boundary in the briefing: item-level confidence judgments can subtly change memory, confidence is often a weak predictor of accuracy, and the block-level prompt is a reflection, not a validated memory intervention. Repeat the weak-predictor caveat on the result note and in the Menu History confidence summary. Add Ingendahl 2025 as a context record; the review moves to 123 records, 285 outcomes and revision v1.7.
- **Consequences**: The app makes no memory-improvement claim for the confidence check. The evidence note is test-covered, and the review count/version gates are updated deliberately.

### ADR-057: N-back brief grounded in task-specific training meta-analysis
- **Date**: 2026-11-08
- **Status**: Accepted
- **Context**: The core N-back mechanic cited broad working-memory reviews but not the task-specific N-back training meta-analysis. Soveri et al. 2017 (PMID 28116702; *Psychonomic Bulletin & Review*) meta-analysed 203 effect sizes from 33 published randomized controlled n-back training trials in healthy adults: medium transfer to untrained n-back tasks, but very small effects on other working-memory tasks, fluid intelligence and cognitive control; no moderation by age, dose, single versus dual training, or verbal versus visuospatial content. The 2026 asymmetry meta-analysis (PMID 42711482) already cited by the app found updating-to-span transfer g=0.176 but span-to-updating g=0.048.
- **Decision**: Add Soveri 2017 as a context record and make it the first N-back citation. Tighten the N-back brief, claim and qualifier from "closely related working-memory tasks" to "untrained n-back tasks, with little transfer beyond the task". The claim remains supported, but only for task-specific near transfer; no general-intelligence or academic claim is made.
- **Consequences**: The review moves to 124 records, 286 outcomes and revision v1.8. The N-back briefing now shows the task-specific meta-analysis as its primary source, and a dedicated test locks the citation and claim wording.

### ADR-058: Complex-span and vigilance stay out of scope; the Choose page gains a domain filter
- **Date**: 2026-11-08
- **Status**: Accepted
- **Context**: A targeted complex-span search found no eligible training meta-analysis; complex span is normally an outcome measure. The app already has N-back updating, Spatial Span and Change Detection. A sustained-attention/vigilance search also found no eligible training meta-analysis in healthy adults; Go/No-Go and Speed Tap already include sustained-attention demands. The Choose page now lists eleven tests, so scanning every card is slower than it was at four.
- **Decision**: Do not add complex-span or vigilance mechanics. Add a domain filter to the Choose-a-test page with an All tests option and the seven mechanic domains. The filter changes presentation only and does not alter scoring, recommendations or claims; it supports the existing explicit-choice design (R54).
- **Consequences**: No new mechanic or evidence-table record is added; the review remains at 124 records and 286 outcomes. The filter is covered by failing-first UI tests, before/after screenshots and a played run that starts Change Detection from the filtered view.

### ADR-059: Go/No-Go reports d′; no new Go/No-Go or processing-speed mechanic
- **Date**: 2026-11-08
- **Status**: Accepted
- **Context**: Targeted Go/No-Go and processing-speed training searches found no eligible task-specific cognitive-training meta-analyses. The Go/No-Go training literature is behaviour-change focused; the broad processing-speed evidence is already covered by PMID 32011155, and Speed Tap is explicitly not UFOV. The Go/No-Go engine already records hits, misses, commissions and correct rejections, so a signal-detection sensitivity measure is available without changing the trials.
- **Decision**: Add d′ (log-linear-corrected hit rate minus false-alarm rate) to Go/No-Go metrics and show it as a primary result metric alongside accuracy and impulse errors. Add a result note explaining that d′ corrects for the tendency to respond or withhold, that higher is better, and that it is descriptive rather than diagnostic. No new mechanic and no processing-speed claim.
- **Consequences**: The Go/No-Go result card gains a bias-corrected sensitivity tile and note. No evidence-table record or review count changes; engine and UI tests cover the metric and the note.

### ADR-060: Working-Memory Residual Extraction (D7 Partial Closure)
- **Date**: 2026-11-22
- **Status**: Accepted
- **Context**: The review logs 973 rule-eligible PubMed reviews as not extracted (deviation D7). Working-memory transfer and durability are core Noesis cells whose strongest records were narrative-only or single-review citations, so near-versus-far transfer and six-month durability were quoted without a consolidated quantitative basis.
- **Decision**: Extract eight residual eligible working-memory reviews (PMIDs 32507890, 25298292, 31939109, 36958492, 33173503, 32738262, 25793607, 30652908) using PubMed MEDLINE abstracts for every field, entering only estimates printed in the abstract and leaving null where magnitude was not reported. Seven are primary and the predictor-methodology review is context. Update the composition counts in the evidence table, snapshot test, references, README, SEARCH_LOG, PROTOCOL and SYNTHESIS, and add their PMIDs to requirements R3, R7, R10 and R12.
- **Consequences**: The table moves from 124/286 to 132/308 records/outcomes and revision v1.9. The train-the-component/measure-the-component rule and near-transfer-only claim now have multi-review support; durability beyond six months becomes a measured question, not an assumed benefit. D7 is partially closed with 965 eligible residuals still unextracted, and the snapshot test pins every quoted count.

### ADR-061: Experimental Conjunction Visual Search Focus Test
- **Date**: 2026-11-23
- **Status**: Accepted
- **Context**: Section 6.1 excluded UFOV as proprietary, but ordinary conjunction search is not proprietary and can be shown as a static grid. Section 7 of NEW_MECHANIC_CANDIDATES.md records a targeted PubMed update: Zhang 2022 (PMID 35838486) trained healthy adults on conjunction search with behavioural and N2pc gains; Vialatte 2023 (PMID 36922549) and Bueichekú 2019 (PMID 30859709) are supporting narrative context only.
- **Decision**: Add `search` as an experimental focus test: a static red-circle target among red-square and blue-circle distractors, with small and large grids alternating so a within-session set-size cost can be reported. Add one context evidence-table record (Zhang 2022) so the in-app citation resolves to the corpus; the other two sources stay narrative-only. No general-attention, reading or everyday-function claim; no flashing or rapid presentation.
- **Consequences**: The review moves to 133 records and 310 outcomes (revision v2.0). The practice menu grows to twelve tests, adaptive levels and snapshot counts gain the new id, and the Evidence screen lists the citation. The new game is claim-bounded task practice with a task-specific set-size metric.

### ADR-062: Evidence-Linked Adherence Note
- **Date**: 2026-11-23
- **Status**: Accepted
- **Context**: The Menu History card already shows a local session-completion percentage, but gave no interpretation and no source. Li et al. 2024 (PMID 38266127) meta-analysed 55 RCTs (n=4,455) and found a cross-domain training effect of g=0.286 (95% CI 0.224-0.348), with significant effects above 60% engagement/persistence or 80% adherence; these are subgroup moderators, not dose targets.
- **Decision**: Add Li 2024 as a primary evidence-table record, extract the two reported estimates, and extend the adherence card with a short, evidence-linked note that states the thresholds as study-level observations with an explicit "not a personal target or a promise of benefit" caveat and a PubMed link. Add requirement R71 and a UI test pinning the wording and link.
- **Consequences**: The review moves to 134 records and 312 outcomes (revision v2.1) and D7 residuals fall to 964. The app's adherence feedback becomes traceable to evidence without turning a subgroup threshold into a user target.

### ADR-063: Everyday-Function Caveat on Result Cards
- **Date**: 2026-11-23
- **Status**: Accepted
- **Context**: The Results screen's "What this does not mean" list is claim hygiene without a source. Two residual eligible reviews directly address the right-hand end of the transfer gradient: Kelly 2014 (31 RCTs, healthy older adults) found trained-task and near-transfer gains but reported everyday function as largely under-investigated; Chandler 2016 (30 controlled studies, MCI) found small ADL, mood and metacognition effects and no quality-of-life effect.
- **Decision**: Add both as primary evidence-table records with only the estimates printed in their abstracts, and extend the Results aside with one short, PubMed-linked caveat that everyday-function transfer is under-investigated and that a single block's gain is not an established daily-life benefit. Add requirement R72 and a UI test pinning the wording and link.
- **Consequences**: The review moves to 136 records and 319 outcomes (revision v2.2), D7 residuals fall to 962, and every result view now states the transfer gradient's evidentiary limit next to its own numbers.

### ADR-064: Linked Claim-Boundary List on the Evidence Screen
- **Date**: 2026-11-23
- **Status**: Accepted
- **Context**: The Evidence screen already explains the transfer gradient and carries a Motivation-mode citation list, but the three claims Noesis refuses were scattered across mechanic qualifiers. Westwood et al. 2023 (PMID 36977764) supplies a strong blinded-outcome test of the clinical claim: 36 RCTs, no effect on ADHD total or hyperactivity symptoms, small setting-sensitive inattention effect, near-transfer working-memory gains only.
- **Decision**: Add Westwood 2023 as a primary evidence-table record (entering magnitude only where the abstract's confidence bounds are internally reversed, with the inconsistency flagged), and add a short "What the review does not support" list on the Evidence screen linking the general-intelligence, ADHD-treatment and everyday-function boundaries. Add R73 and extend the citation test to cover the new links.
- **Consequences**: The review moves to 137 records and 324 outcomes (revision v2.3), D7 residuals fall to 961, and the app's three claim boundaries are visible together with PubMed links rather than implied by separate mechanic notes.

### ADR-065: Evidence-Linked Clock Option Note
- **Date**: 2026-11-23
- **Status**: Accepted
- **Context**: Settings already lets users hide the clock, but the rationale was local and unsourced. Wang et al. 2021 (PMID 32980574) meta-analysed 15 game-based training RCTs (759 older adults), reporting small near-domain gains and listing non-time-pressure formats among preferable design features, with game design moderating processing-speed effects.
- **Decision**: Add Wang 2021 as a primary evidence-table record with its three reported g values and a null subgroup outcome, and add a short PubMed-linked note beside the clock option stating those findings as group-level context with an explicit no-personal-prescription caveat. Add R75 and a UI test.
- **Consequences**: The review moves to 138 records and 328 outcomes (revision v2.4), D7 residuals fall to 960, and the pacing choice is traceable to evidence without turning a subgroup preference into a rule for every user.

### ADR-066: Multimodal Synergy Claim Boundary
- **Date**: 2026-11-23
- **Status**: Accepted
- **Context**: The synthesis already cautioned that combination is not synergy, citing an earlier review. Wu et al. 2023 (PMID 37065695) provides a direct 21-RCT pooled test: combined training beat no intervention (SMD 0.29, 0.14-0.44) but not exercise alone (0.16, -0.04-0.35) or cognitive training alone (0.08, -0.13-0.30).
- **Decision**: Add Wu 2023 as a primary multimodal record with the three head-to-head estimates, extend the Evidence screen's claim-boundary list with a fourth linked bullet, update R74 and the citation test, and note the finding in the older-adult synthesis.
- **Consequences**: The review moves to 139 records and 331 outcomes (revision v2.5), D7 residuals fall to 959, and the app explicitly refuses the "combination is better" claim while still acknowledging the small effect versus no intervention.

### ADR-067: Expectancy Is Not a Responder Predictor
- **Date**: 2026-11-23
- **Status**: Accepted
- **Context**: The review's measurement plan asks trials to measure expectancy, but the corpus had no record testing whether baseline expectancy predicts response. Motter et al. 2024 (PMID 38230719) followed 107 MCI patients for 78 weeks after computerized or crossword training and found no association between expectancy and cognitive, everyday or neural outcomes, and no treatment interaction.
- **Decision**: Add Motter 2024 as a context record with its null associations, extend the Evidence screen's claim-boundary list with a fifth linked bullet, add R76, and update the synthesis measurement plan to say expectancy should be measured but not used for responder selection.
- **Consequences**: The review moves to 140 records and 333 outcomes (revision v2.6), D7 is unchanged because the record came from a targeted search, and the app states that it does not personalise assignment by self-expectancy.

### ADR-068: Clinical Mood Claim Boundary
- **Date**: 2026-11-23
- **Status**: Accepted
- **Context**: The app's symptom check-in records adverse experiences, and it makes no treatment claim. Woolf et al. 2022 (PMID 33913064) found moderate pooled cognitive and affective effects of cognitive training in adults with diagnosed major depressive disorder, but very few studies assessed everyday-function transfer; the population and claim are clinical, not consumer.
- **Decision**: Add Woolf 2022 as a context record with null-valued narrative outcomes, and add a sixth linked boundary to the Evidence screen: no mood-disorder treatment claim from consumer brain training. Add R78 and extend the citation test.
- **Consequences**: The review moves to 141 records and 336 outcomes (revision v2.7), D7 is unchanged, and the app's safety logging is explicitly separated from any therapeutic claim.

### ADR-069: Digit Symbol Experimental Focus Test
- **Date**: 2026-11-23
- **Status**: Accepted
- **Context**: The lineup has simple reaction time (Speed Tap) and verbal paired associates, but no symbol-digit association speed task. A targeted PubMed search found no task-specific digit-symbol training meta-analysis; broad CCT and game-design reviews support small processing-speed near transfer (PMIDs 32011155, 32980574, 30998045).
- **Decision**: Add `symbol` as a claim-bounded focus test with a static four-pair digit-shape legend, one target shape per trial and four digit buttons; report accuracy, mean response time and within-block response-time change. Cite the three broad reviews in the mechanic meta, document the narrative-only rationale in NEW_MECHANIC_CANDIDATES.md section 8, and add R79.
- **Consequences**: The practice menu grows to thirteen tests with no new evidence-table record or count change. Adaptive levels, schema, AI-drive help and count assertions gain the new id; the game is static, silent and free of flashing.

### ADR-070: Serious-Games Evidence Quality Caveat
- **Date**: 2026-11-23
- **Status**: Accepted
- **Context**: Noesis ships nine experimental game-like focus tests. Abd-Alrazaq et al. 2023 (PMID 37043277) pooled 11 RCTs of serious games in cognitively impaired older adults: verbal and nonverbal learning gains versus no/sham and nonverbal gains versus conventional training, but only 2-5 trials per comparison, small samples in 6 of 8 pooled studies, and an explicit conclusion that games should supplement rather than replace established interventions.
- **Decision**: Add the review as a context record with null-valued narrative outcomes, record the caveat in NEW_MECHANIC_CANDIDATES.md section 8, and keep every game framed as claim-bounded task practice rather than a substitute for care.
- **Consequences**: The review moves to 142 records and 338 outcomes (revision v2.8), D7 residuals fall to 958, and the game rationale carries the evidence-quality limitation next to the positive findings.

### ADR-071: Linked Evidence on the Far-Check Card
- **Date**: 2026-11-23
- **Status**: Accepted
- **Context**: The home far-check card tells users that reviews usually find no transfer to untrained memory, but gave no source. Melby-Lervåg & Hulme 2013 (PMID 22612437) is already a primary record in the corpus and reports reliable working-memory training gains with no convincing generalization.
- **Decision**: Add a short, PubMed-linked citation to the far-check card stating that no convincing far transfer was found in that meta-analysis, add R80, and pin the wording and link with a failing-first UI test.
- **Consequences**: No evidence-table or count changes. The app's most prominent transfer caveat becomes click-through verifiable, and the test guards against the citation drifting away.

### ADR-072: Linked Safety Evidence on Onboarding
- **Date**: 2026-11-23
- **Status**: Accepted
- **Context**: The safety screen asked about seizure history and clinician-advised exercise restrictions but gave no reason for either question. Both justifications are already in the corpus: the Epilepsy Foundation photosensitivity consensus (PMID 16146438) and FINGER's adverse-event profile (PMID 25771249).
- **Decision**: Add a short, two-link "why we ask" note to the safety screen, add R81, and pin both PubMed links with a failing-first UI test.
- **Consequences**: No evidence-table or count changes. The safety posture becomes auditable from the onboarding screen while remaining a design constraint, not medical advice.

### ADR-073: FAIR-Linked Research Export Rationale
- **Date**: 2026-11-23
- **Status**: Accepted
- **Context**: DATA_EXPORT_AND_REUSE.md cited two verified PMIDs that were not in the evidence table, and the research export panel gave no source for its documented file format. Wilkinson et al. 2016 (PMID 26978244) defines the FAIR principles; Maxwell et al. 2026 (PMID 41813053) found that data-sharing attitude surveys have weak measurement properties.
- **Decision**: Add both as context records and link the FAIR paper from the research export panel, with R82 and a failing-first UI test. Keep consent explicit and revocable rather than inferring willingness.
- **Consequences**: The review moves to 144 records and 340 outcomes (revision v2.9), both previously narrative-only citations resolve in-app, and the export rationale becomes click-through verifiable.

### ADR-074: Linked Far-Transfer Synthesis
- **Date**: 2026-11-23
- **Status**: Accepted
- **Context**: The Evidence screen's near/far transfer aside stated the central gradient without a source. Sala & Gobet 2017 (PMID 29276344) had been narrative-only in NEW_MECHANIC_CANDIDATES.md and synthesises three meta-analyses showing that effects shrink with design quality and far transfer rarely occurs.
- **Decision**: Add Sala & Gobet 2017 as a context record, link it from the near/far aside, update R83 and the citation test, and keep the claim wording unchanged.
- **Consequences**: The review moves to 145 records and 341 outcomes (revision v2.10) and the app's most important evidence claim becomes click-through verifiable without changing what it asserts.

### ADR-075: Linked Metacognition Caveat on Confidence Ratings
- **Date**: 2026-11-23
- **Status**: Accepted
- **Context**: The result card's confidence note says the rating is a reflection, not metacognitive training, with no source. Sella et al. 2023 (PMID 36218025) meta-analysed 25 structured metacognitive-training studies (N=1,768) and found memory and metacognitive benefits alongside often-limited study quality.
- **Decision**: Add Sella 2023 as a context record, extend the confidence note with a linked citation clarifying that a one-item prompt is not the structured intervention, add R84 and a failing-first UI test.
- **Consequences**: The review moves to 146 records and 343 outcomes (revision v2.11) and the app's reflection-versus-intervention distinction becomes verifiable without changing the confidence feature itself.









