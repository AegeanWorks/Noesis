# Noesis

<!-- aegean:media:start -->
<p align="center"><img src="assets/social-preview.svg" alt="Noesis social preview" width="100%"></p>
<p align="center"><a href="LICENSE"><img src="https://img.shields.io/badge/license-AL--1.1-2f9e44" alt="License"></a> <a href="https://github.com/AegeanWorks/AIKit"><img src="https://img.shields.io/badge/AIKit-integrated-6f42c1" alt="AIKit Integrated"></a></p>
<!-- aegean:media:end -->

![Web](https://img.shields.io/badge/Web-Vite%20%2B%20React%2019-646CFF)
![Android](https://img.shields.io/badge/Android-Capacitor%207-3DDC84)
![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB)

An evidence-led cognitive training app. Every mechanic is a deterministic, headlessly drivable state machine, so the web app, the Android WebView build, the test suite and AI simulators run the same logic.

**Current phase: first working vertical slice.** One-click sessions, four core mechanics plus nine experimental focus tests (Task Switch, Flanker, Spatial Span, Mental Rotation, Prospective Memory, Paired Associates, Change Detection, Visual Search and Digit Symbol), a test-selection menu with per-block history, a pre-test evidence briefing, safety onboarding, optional research consent with local email data return, per-block measurement, an evidence registry, and a debug APK build path. The evidence review that defines the claim boundaries is complete in [`docs/research/`](docs/research/).

## 30-Second Cold-Start Quick Reference

- **Runtime Prerequisites**: Node 20.19+, npm 10+, Python 3.10+, git. For the Android build: JDK 21 and Android SDK 35.
- **Install**:
  ```bash
  npm install
  ```
- **Run the web app**:
  ```bash
  npm run dev
  ```
- **One-click start**: double-click `start.cmd` on Windows, or run `npm start` (macOS/Linux: `./start.sh`). It installs dependencies on the first launch, starts the app and opens it in your browser.
- **Canonical Regression Shield Gate**:
  ```bash
  npm run test:all
  ```
- **Deterministic AI simulation check**:
  ```bash
  npm run ai:verify
  ```
- **Build a debug APK**:
  ```bash
  npm run android:build
  ```
  The artifact is `android/app/build/outputs/apk/debug/app-debug.apk`.

## One-Click Sessions

The home screen has one primary action: **Start session**. It creates and begins the first block in the same click. If a session is already active, the same button resumes it. First-time users answer the safety screen once; its final button also starts the session immediately.

Session length (quick or standard) and difficulty (gentle, standard or challenge) are user-selected in Settings and applied to the one-click start. Quick sessions rotate which two of the four core mechanics appear, so repeated short sessions still cover all four; standard sessions keep the full interleaved lineup. The experimental Task Switch, Flanker, Spatial Span, Mental Rotation, Prospective Memory, Paired Associates, Change Detection, Visual Search and Digit Symbol are available as single-test focus sessions from the Menu and are not in the default lineup. The optional practice plan asks when and where the next session will happen, what to pair it with, and what to do if stuck; it is stored locally and never blocks starting.

An active session is snapshotted locally while it runs. After a browser reload or an Android WebView restart, the home screen offers **Resume session** instead of losing progress. Pausing then choosing **End session** asks for confirmation first, so an accidental tap can return to the paused session instead of discarding it.

The home screen also shows a per-mechanic accuracy sparkline for recent sessions with last and best accuracy labeled by level, a 14-day practice calendar, and caring check-ins: heavy-use patterns trigger a rest suggestion with a one-tap Motivation pause, a missed yesterday gets a no-shame nudge, and a long absence gets a welcome-back. Settings offers larger text, high contrast, reduced motion and a hideable session clock.

Completed sessions are stored locally and summarized per mechanic. Monthly word-recognition far checks, symptom reports and study enrollment (for trials) are stored separately from practice. There is no account and no server. Settings can export everything as JSON or clear it with one tap.

## Practice Menu and Pre-Test Briefing

The **Menu** tab is the explicit choice point. It lists every test - four core mechanics plus the experimental Task Switch, Flanker, Spatial Span, Mental Rotation, Prospective Memory, Paired Associates, Change Detection, Visual Search and Digit Symbol - with a short,
literature-grounded explanation, the claim boundary, a primary PMID link, and the user's
last/best accuracy and block count for that test. From there a user can start a single-test
session or start/resume the interleaved session. The same screen has a **History** tab that
lists completed sessions block by block, with each block's mechanic, level, accuracy and
summary; there is no composite score.

Every test block begins with a **Before this test** card: what the task measures, how to
respond, what the evidence supports, what it does not claim, the primary source and the safety
note. The session clock is paused until **Begin test** is pressed, so reading time is not
counted as practice time. The explanation is identical for a standard block and a focused block,
and it never changes the score. The literature basis is
[docs/research/PRACTICE_MENU_AND_BRIEFING.md](docs/research/PRACTICE_MENU_AND_BRIEFING.md).

## Research Data Sharing and Informed Consent

Research participation is optional and separate from safety onboarding. A user can open the
bilingual **Informed consent for research data sharing** screen (English/Türkçe), read what
data is included, consent to the current study and future articles, and receive a random
participant code. Consent is versioned, stored locally, and included in the export.

To send data, the study team first sets its email address in Settings. The participant then
chooses **Send research data**: the app downloads a JSON export and prepares a local email
draft addressed to the study team. The user must attach the downloaded file and send it from
their own email app. No data is uploaded automatically, no server is involved, and no SMTP
credential is stored. Withdrawal stops future emails; data already sent cannot be recalled.
The export also carries a session-level **adherence log**: every start, completion and early
ending, with the blocks completed and the study arm, so dropout is measurable rather than
inferred from completers only. The Menu History tab shows a neutral started/completed/ended-early
summary; stopping early is framed as information, not a failure. The JSON file is self-describing: a `manifest` records the app
version, export schema version, evidence-review version, data-dictionary version, consent
version and record counts. Settings also offers two analysis-ready local CSV downloads: one row
per session block and one row per adherence event, with stable headers and the full
metric/motivation objects preserved as JSON strings. The field-level
[DATA_DICTIONARY.md](docs/research/DATA_DICTIONARY.md) documents every field. The literature
basis and privacy boundaries are in
[docs/research/DATA_COLLECTION_AND_CONSENT.md](docs/research/DATA_COLLECTION_AND_CONSENT.md),
[docs/research/ADHERENCE_LOGGING.md](docs/research/ADHERENCE_LOGGING.md) and
[docs/research/DATA_EXPORT_AND_REUSE.md](docs/research/DATA_EXPORT_AND_REUSE.md).

## Behavioral Engagement

Noesis's behavioral-psychology review is integrated as a bounded **Motivation mode** for adult and older-adult engagement:

- **Variable bonuses:** 70% steady, 20% boost, 10% rare cosmetic momentum. Odds are disclosed and capped at 100 points per block.
- **Streaks:** x1-x3 momentum multiplier based on consecutive correct trials.
- **Near-best cue:** a real +10 bonus when a block comes within 5% of your personal best at the same level.
- **Corrective near-miss:** an N-back false alarm that matches the N-1 or N+1 position gets an explanatory cue, not a reward.
- **Optional push-your-luck:** bank bonus momentum or risk it on the next block (70% accuracy threshold). Core progress is always banked first.
- **Target time:** 8 minutes standard, 5 minutes quick; no penalty for exceeding it.
- **Adopted supports:** when-where-plus-pairing-and-obstacle practice plan (all four inputs optional), adjustable weekly practice-day goal with a visual progress bar, user-selected session length and difficulty, per-mechanic practice, focus sessions and a weakest-link suggestion, per-mechanic last/best accuracy, non-punitive weekly summary, consistency calendar, milestone celebrations and personal-best highlights.

Beyond Motivation mode the product stays deliberately quieter: an **opt-in adaptive difficulty** experiment (adjusts per-task level from recent accuracy, never marketed as superior), a **monthly word-recognition far check** on its own schedule and store (the app states up front that reviews usually find no transfer), and an **opt-in research-study enrollment** that tags sessions with the assigned trial arm. The session header shows the current block's level, and every result keeps that level so blocks can be compared within the same level; adaptive changes are visible in the session rather than silent. A copyable weekly summary and a JSON export cover accountability and portability without accounts.

Motivation never changes cognitive scores. The mode can be switched off in Settings. There is no real money, purchasable currency, infinite loop or narrative campaign. The full audit and citations are in [docs/research/BEHAVIORAL_ENGAGEMENT.md](docs/research/BEHAVIORAL_ENGAGEMENT.md).

## AI-Testable Mechanics

Every mechanic exposes the same surface:

- a seeded RNG stored in state;
- a logical clock advanced by JSON `advance` actions, never `Date.now` inside the engine;
- JSON `respond` / `answer` actions;
- deterministic scores and a 16-character state hash;
- an action stream that replays to the same state.

Use the CLI:

```bash
npm run ai:simulate -- --mechanic nback --seed 42 --strategy optimal --json
npm run ai:simulate -- --mechanic gonogo --seed 42 --strategy random
npm run ai:simulate -- --mechanic reasoning --seed 42 --strategy never
```

Strategies: `optimal`, `random`, `always`, `never`.

In a browser, open the app with `?ai=1` and drive the real session:

```js
window.__NOESIS__.listMechanics()
window.__NOESIS__.createSession(window.__NOESIS__.defaultConfig(42))
window.__NOESIS__.dispatch({ type: "begin" })
window.__NOESIS__.getView()
window.__NOESIS__.getState()
```

`runScenario(config, actions)` evaluates a scenario without touching the live store. Invalid actions are rejected with a schema error instead of throwing.

## What the Evidence Says

The review screened 2,360 unique bibliographic records and 363 trial records, and extracted 157 records with 360 outcomes (103 primary, 54 context).

- Cognitive training reliably improves trained tasks and short-term near transfer; broad far transfer is not established.
- Neurofeedback for ADHD shows no significant probably blinded effect; consumer-grade neurofeedback shows no cognitive benefit.
- Binaural beats may reduce anxiety and pain; cognitive enhancement is not supported.
- Exercise plus cognitive training has the most consistent small effect in older adults, but synergy is unproven.
- Photosensitive seizure risk is a hard constraint on any flashing visual content.

The app reports each block separately, avoids a composite "brain score", and states what each mechanic does **not** claim. Motivation mode is an engagement layer; it is not evidence that the app improves cognition.

## What's Inside

```text
noesis/
├── .aikit/                       <- project memory: record, ledger, decisions, codebase map
├── .gitattributes                <- LF line endings for text files (ADR-454)
├── .gitignore                    <- transient and generated artifacts excluded
├── assets/                       <- project logo and social preview
├── android/                      <- Capacitor 7 Android project
├── docs/                         <- research and design documentation
├── docs/research/                <- protocol, search log, PRISMA flow, synthesis, design implications
│   ├── analysis/                 <- machine-readable evidence table and screening data
│   ├── records/                  <- raw PubMed, OpenAlex, trial-registry and behavioral-literature records
│   ├── BEHAVIORAL_ENGAGEMENT.md  <- Motivation mode audit, citations and safeguards
│   ├── DESIGN_IMPLICATIONS.md    <- product requirements traceable to evidence
│   ├── ADHERENCE_LOGGING.md      <- session start/completion/early-ending note
│   ├── DATA_COLLECTION_AND_CONSENT.md <- e-consent and email data-return note
│   ├── DATA_DICTIONARY.md        <- field-level JSON/CSV dictionary
│   ├── DATA_EXPORT_AND_REUSE.md  <- FAIR/data-reuse basis for the manifest and CSV exports
│   ├── NEW_MECHANIC_CANDIDATES.md <- new-game literature scan and decision matrix
│   ├── PRACTICE_MENU_AND_BRIEFING.md <- menu and pre-test briefing evidence note
│   ├── PRISMA_FLOW.md            <- PRISMA flow and checklist
│   ├── PROTOCOL.md               <- pre-registered review protocol
│   ├── README.md                 <- research index
│   ├── REFERENCES.bib            <- BibTeX references
│   ├── REFERENCES.md             <- included evidence references
│   ├── SAFETY_AND_REGULATION.md  <- safety and regulatory constraints
│   ├── SEARCH_LOG.md             <- search execution counts
│   ├── SEARCH_STRATEGY.md        <- exact search strings
│   ├── SYNTHESIS.md              <- main evidence synthesis
│   └── TRIAL_READINESS.md        <- investigator-facing trial dossier
├── public/                       <- PWA manifest and icons
├── scripts/                      <- AI simulator, determinism verifier, Android build, combined tests
├── src/
│   ├── content/                  <- reasoning item bank
│   ├── engine/                   <- seeded RNG, mechanics, session, schema, AI harness
│   ├── storage/                  <- safety, settings, history, intention, engagement, study, adaptive, far checks and export
│   ├── ui/                       <- screens and mechanic components
│   ├── App.tsx
│   ├── global.d.ts               <- window.__NOESIS__ typing
│   ├── main.tsx
│   └── styles.css
├── tests/                      <- engine, storage and UI tests (Vitest) plus review validation (pytest)
├── noesis/                       <- Python evidence-review tooling
├── COMMERCIAL.md                 <- commercial licensing terms
├── LICENSE                       <- Aegean License 1.1 (AL-1.1)
├── LICENSES/                     <- REUSE license texts
├── REUSE.toml                    <- machine-readable SPDX metadata
├── capacitor.config.ts           <- Android wrapper configuration
├── index.html                    <- Vite entry document
├── package-lock.json             <- locked npm dependency graph
├── package.json                  <- app dependencies and scripts
├── pyproject.toml                <- Python metadata
├── start.cmd                     <- one-click launcher for Windows
├── start.sh                      <- one-click launcher for macOS/Linux
├── tsconfig.json                 <- TypeScript compiler settings
├── ui-review/                    <- before/after screenshots and UI analysis
├── vite.config.ts                <- Vite and Vitest configuration
└── README.md
```

## Mechanics

| Mechanic | Domain | Claim level | What it does |
|---|---|---|---|
| N-back | Working-memory updating | Supported (near transfer) | Match a letter that equals the one N positions back. |
| Go / No-Go | Response inhibition | Experimental | Respond to circles, withhold responses to squares; reports accuracy, sensitivity (d′), impulse errors and reaction time. |
| Reasoning | Inductive reasoning | Supported (older-adult evidence) | Multiple-choice sequences, analogies and logic items. |
| Speed Tap | Processing speed | Experimental | Wait for a circle, then tap as fast as possible; reports reaction time, variability and lapses. |
| Task Switch | Cognitive flexibility | Experimental (focus test) | Alternate between a colour rule and a shape rule; reports accuracy, switch/repeat accuracy and switch cost. |
| Flanker | Interference control | Experimental (focus test) | Respond to the centre arrow while ignoring conflicting flankers; reports accuracy, congruent/incongruent reaction time and interference cost. |
| Spatial Span | Visuospatial working memory | Experimental (focus test) | Reproduce a slow sequence of highlighted grid blocks in order; reports accuracy, mean span and longest span. |
| Mental Rotation | Spatial reasoning | Experimental (focus test) | Decide whether a block figure is the same shape rotated or a mirror image; reports accuracy, same/mirror accuracy and reaction time. |
| Prospective Memory | Delayed intentions | Experimental (focus test) | Sort letters as vowel/consonant, but choose Remember when the cue letter Q appears; reports ongoing accuracy, cue hits, false alarms and reaction time. |
| Paired Associates | Verbal episodic memory | Experimental (focus test) | Study a word pair, then choose its partner from four options; reports accuracy and reaction time. |
| Change Detection | Visual working memory | Experimental (focus test) | Hold a brief coloured array and tap the square that changed; reports accuracy, set size and reaction time. |
| Visual Search | Conjunction attention | Experimental (focus test) | Tap a red-circle target among red squares and blue circles in a static grid; reports accuracy, reaction time and the within-session set-size cost. |
| Digit Symbol | Processing speed | Experimental (focus test) | Learn a four-digit shape legend, then tap the matching digit for each shape; reports accuracy, reaction time and the within-block change. |

The four core mechanics are in the standard starter session: 2-back, go/no-go, reasoning and Speed Tap. Task Switch, Flanker, Spatial Span, Mental Rotation, Prospective Memory, Paired Associates, Change Detection, Visual Search and Digit Symbol are experimental focus tests from the Menu; they are not in the default lineup and make no general-intelligence or everyday-function claim.

## Safety

- Safety onboarding covers photosensitivity and exercise concerns.
- Flashing is disabled by design; visual entrainment is not implemented.
- No audio, EEG or biometric modules are shipped in this slice.
- Safety profile, display preferences, practice plan and practice history stay on the device. There is no account or server.
- Motivation mode uses cosmetic bonuses, streaks and optional bonus-only risk. It never changes cognitive scores or puts core progress at risk.
- A non-blocking daily break cue appears after two completed sessions; it never locks the user out.
- Practice history can be exported or cleared from Settings.
- The app shows explicit non-claims and links each mechanic to its evidence record.

## Android Export

The web app is wrapped with Capacitor 7. The Android project is already generated; after a web build, run:

```bash
npm run android:sync     # build + copy dist into android/app/src/main/assets/public
npm run android:build    # full debug APK build
npm run android:open     # open in Android Studio
```

The build script auto-detects Android SDK 35 and JDK 21. Without JDK 21 it stops with a clear `Why:` / `Fix:` message, because Capacitor 7 compiles its Android library with Java 21.

## Tests

```bash
npm run test:all
```

This runs:

1. the Python review suite (`python -m unittest discover -s tests -t .`), which validates the evidence table's schema, identifiers, confidence intervals, flags and synthesis matrix;
2. the Vitest suite, which covers RNG determinism, each mechanic's scoring, session sequencing, replay hashes, runtime schema validation, the AI harness, the practice menu and history, the pre-test briefing gate, research consent and email-draft storage, session adherence logging, CSV export builders, the export manifest, and the React safety/mechanic/settings screens.

`npm run ai:verify` runs 500 seeded mechanic simulations (5 mechanics × 50 seeds × 2 strategies), checks every metric is finite, completes every run, and verifies the replay hash matches.

## Evidence Review

- [Synthesis](docs/research/SYNTHESIS.md)
- [Protocol](docs/research/PROTOCOL.md)
- [Search strategy](docs/research/SEARCH_STRATEGY.md)
- [PRISMA flow](docs/research/PRISMA_FLOW.md)
- [Design implications](docs/research/DESIGN_IMPLICATIONS.md)
- [Data collection and consent](docs/research/DATA_COLLECTION_AND_CONSENT.md)
- [Adherence logging](docs/research/ADHERENCE_LOGGING.md)
- [Data export and reuse](docs/research/DATA_EXPORT_AND_REUSE.md)
- [Data dictionary](docs/research/DATA_DICTIONARY.md)
- [New mechanic candidates](docs/research/NEW_MECHANIC_CANDIDATES.md)
- [Safety and regulation](docs/research/SAFETY_AND_REGULATION.md)

Validate the evidence table:

```bash
python -m noesis review check
python -m noesis review summary
```

## AIKit Commands (run from the AIKit folder)

| Role | Command |
|---|---|
| Status, task and gates | `python aikit.py status noesis` |
| Phase 4: every gate | `python aikit.py check noesis` |
| Repair memory and map, then check | `python aikit.py fix noesis` |
| Resume an interrupted task | `python aikit.py resume noesis` |

<!-- aegean:brand-assets:start -->
## 🎨 Brand Assets

> **AI-Generated Brand Artwork.** The banner and logo are **AI-generated brand assets**. They are illustrative and may not literally depict every feature or the full project scope.
<!-- aegean:brand-assets:end -->

## License

Free for personal use under the Aegean License 1.1 (AL-1.1); see [LICENSE](LICENSE). Any commercial use needs the Aegean Commercial License 1.0 (ACL-1.0); see [COMMERCIAL.md](COMMERCIAL.md).

<!-- aegean:screenshots:start -->
## Screenshots

<a href="https://github.com/AegeanWorks/Noesis/commit/aa99b88"><img src="assets/screenshots/2026-11-03-home-desktop.png" alt="Noesis home at 2026-11-03"></a>

<a href="https://github.com/AegeanWorks/Noesis/commit/aa99b88"><img src="assets/screenshots/2026-11-03-home-mobile.png" alt="Noesis home on a phone at 2026-11-03"></a>

<a href="https://github.com/AegeanWorks/Noesis/commit/aa99b88"><img src="assets/screenshots/2026-11-03-session-mobile.png" alt="Noesis N-back block at 2026-11-03"></a>

<a href="https://github.com/AegeanWorks/Noesis/commit/aa99b88"><img src="assets/screenshots/2026-11-03-results-mobile.png" alt="Noesis results at 2026-11-03"></a>

<a href="https://github.com/AegeanWorks/Noesis/commit/aa99b88"><img src="assets/screenshots/2026-11-03-settings-mobile.png" alt="Noesis settings at 2026-11-03"></a>

<a href="https://github.com/AegeanWorks/Noesis/commit/aa99b88"><img src="assets/screenshots/2026-11-03-evidence-mobile.png" alt="Noesis evidence at 2026-11-03"></a>

*commit `aa99b88` · 2026-11-03 · seeded `npm run ui:shots` (desktop 1280x900@2x, mobile 390x844@2x); Android shell deferred — no emulator here*
<!-- aegean:screenshots:end -->
