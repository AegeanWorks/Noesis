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
