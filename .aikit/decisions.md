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
