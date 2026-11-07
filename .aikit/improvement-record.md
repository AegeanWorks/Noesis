# Continuous Improvement Record

One entry per improvement cycle. The rotation covers combat feel, enemies/bosses, levels, UI
readability, graphics and effects, audio cues, progression and saves; for Noesis these map to
mechanic feel, session structure, difficulty/adaptation, UI readability, graphics and effects,
audio cues (none shipped by design) and progression/saves. One area per cycle.

Covered so far:

1. Progression and saves — 2026-11-07 — cycle 1
2. UI readability — 2026-11-07 — cycle 2
3. Graphics and effects — 2026-11-07 — cycle 3
4. Mechanic feel — 2026-11-07 — cycle 4
5. Session structure — 2026-11-07 — cycle 5
6. Levels — 2026-11-07 — cycle 6
7. Session safety — 2026-11-07 — cycle 7
8. UI readability (second pass) — 2026-11-07 — cycle 8

Audio cues — dead end (2026-11-07): the README states no audio, EEG or biometric modules
ship; adding sound would change the stated product scope and safety posture, so no cycle.

Open candidates (not yet cycles): `1 impulse errors` summary pluralization; result-tile
`<40 ms` versus the summary's exact reaction time.

## Cycle 1 — Progression and saves: resumed block-boundary momentum

- **Area**: progression and saves (rotation 1/7).
- **FIND**: Resuming a snapshot saved at `block_complete` credited the same block's Motivation
  outcome a second time. A scripted browser playthrough saved `Banked 0 · Unbanked 100`, then
  after reload and **Resume session** showed `Momentum 200`, `Banked 0 · Unbanked 200`,
  `Bank 200 and continue` and `Risk 200` for the same block. The new regression test failed
  before the fix with `expected 36 to be 18` (`Object.is equality`), proving the same doubling
  at the App level.
- **ANALYZE**: `App.tsx` restores `SessionSnapshot.state` and `.motivation` in a `useState`
  initializer, but `motivatedBlock` started at `-1`; the block-completion `useLayoutEffect`
  therefore treated the restored `block_complete` as uncounted. The snapshot format already
  carries the outcome list, so the fix belongs in the guard, not in storage or the engine.
- **KILLED**: No candidate was dropped; the defect reproduced in both the browser harness and
  the jsdom App test before any product edit.
- **IMPLEMENT**: Failing-first `tests/ui/resume-motivation.test.tsx` (builds a one-block session,
  advances it to `block_complete`, saves state + Motivation, renders `App`, resumes, asserts
  `Unbanked` equals the saved points). Fix seeds `motivatedBlock` from the boot snapshot only
  when its motivation already contains an outcome for the restored block index; otherwise it
  stays `-1`, so a snapshot saved before the credit (including unresolved risk) is still
  processed exactly once. Added `scripts/resume-proof.mjs`, a fixed-clock browser playthrough
  that drives the real session to the boundary, waits for the 1.5 s snapshot write, reloads,
  resumes and records the displayed momentum plus console/page errors.
- **PROOF (screenshots)**: same viewport 390x844@2x, same fixed seed 2721744568
  (`Date.now = 1793723107000`), same actions and same save state; only the build differs.
  - before: `%TEMP%\opencode\noesis-cycles\cycle1-before\before-02-resumed-block-complete.png`
    SHA-256 `CD456D9A0B6574CA9D292C79995208DFC9CF15CE001C834CAF8B7BFB3B821009`
    (`Momentum 200`, `Unbanked 200`, `Bank 200`)
  - after: `%TEMP%\opencode\noesis-cycles\cycle1-after\after-02-resumed-block-complete.png`
    SHA-256 `DC6F93E6B61841B1835E27D795D35F1B857F424322DEE441A4B9287A1C35F203`
    (`Momentum 100`, `Unbanked 100`, `Bank 100`)
  - before home/resume state: `before-01-resume-home.png`; after home/resume state:
    `after-01-resume-home.png`; next-block after bank: `before-03-…` / `after-03-…`.
- **PROOF (played run)**: `node scripts/resume-proof.mjs before|after <dir>` with the dev server
  on a free port. Before: `savedUnbanked 100`, `savedOutcomes 1`, `shownUnbanked 200`,
  `doubled true`, `bankedAfterClick null` (old harness). After: `savedUnbanked 100`,
  `savedOutcomes 1`, `shownUnbanked 100`, `doubled false`, `bankedAfterResume { banked: 100,
  unbanked: 0 }`. Both runs: `consoleErrors []`; the session reached `block_complete` with
  `2-back: 100% accuracy, 6/6 targets, 0 false alarms`; no page errors. What improved: a reload
  no longer changes the reward shown or the amount banked. What stayed the same: the live
  (uninterrupted) block flow, scoring, and all other screens.
- **GATES**: `npm run test:all` — 29 Python + 248 Vitest, all pass; `npm run ai:verify` — 400
  deterministic simulations; `npm run typecheck` — clean; `python aikit.py check noesis` —
  test/typecheck/build/hygiene/guidelines/secrets 6/6 pass. No console errors in the played run.
- **STATUS**: committed with the cycle; next area is UI readability.

## Cycle 2 — UI readability: evidence citations were 21px tap targets

- **Area**: UI readability (rotation 2/7).
- **FIND**: The evidence screen's 13 PubMed citations rendered as inline links 21px high,
  below the project's own 44px touch floor (ADR-030/R33), with the PMID outside the link and no
  row boundary. The 390x844 audit found `allAtLeast44High: false`, `minHeight: 21` and five
  visible links under the floor.
- **ANALYZE**: `EvidenceScreen.tsx` emitted a bare `<a>{label}</a>` followed by a sibling
  `<span class="pmid">`; `.citations a` only set a colour. The link was correct but too small to
  hit reliably on a phone and its accessible name omitted the identifier. Fix belongs in the
  render structure plus the citation row CSS; no copy, href, route or storage change.
- **KILLED**: No candidate was dropped. The remaining audit flags (badges at 11.52px, 13px
  checkbox inputs inside 44px labels) are outside this item; checkboxes are already wrapped by
  full-size labels, and badges are a later readability candidate.
- **IMPLEMENT**: Failing-first `tests/ui/evidence-citations.test.tsx` expects each citation to
  be one PubMed link whose text carries its PMID; it failed on the first citation before the
  change. Added a `CitationLink` child that wraps label + `PMID` in one anchor, reused for the
  mechanic sources and the three Motivation citations. CSS turns `.citations` into a gap-spaced
  list and each anchor into a bordered 48px-minimum row; PMID raised to 0.8rem. Added
  `scripts/ui-audit.mjs`, a fixed-clock 390x844 audit that drives a quick session, captures
  home/session/results/settings/evidence/large-text, checks overflow, tiny text, tap targets and
  clipping, and clicks the first citation to verify the popup URL.
- **PROOF (screenshots)**: same viewport 390x844@2x, same fixed seed and save state, same audit
  script; only the build differs.
  - before: `%TEMP%\opencode\noesis-cycles\cycle2-before\06-evidence.png`
    SHA-256 `C55D1C06E51577E2E867DAB708B67B372405D3A88E1A404ECB8721424FD87145`
    (inline links, `minHeight 21`, `allAtLeast44High false`, `allCarryPmid false`)
  - after: `%TEMP%\opencode\noesis-cycles\cycle2-after\06-evidence.png`
    SHA-256 `7BD1BD486F1A3CFFC858027E7B3B98DE4CAF4FA64D4A1ED02BF374050ECA28F6`
    (bordered rows, `minHeight 59`, `allAtLeast44High true`, `allCarryPmid true`)
- **PROOF (played run)**: `scripts/ui-audit.mjs` navigated Home → session → results → Home →
  Settings → Evidence at 390x844, drove the quick session to completion (2 blocks) with no
  console errors, then clicked the first citation: `popupUrl
  https://pubmed.ncbi.nlm.nih.gov/42711482/` in both builds. Evidence screen tap-target count
  went 5 → 0; the two remaining `smallTargets` flags on results/settings are checkbox inputs
  inside full-size labels. Frame health: `consoleErrors []`; no page errors; no horizontal
  overflow at any audited screen.
- **GATES**: `npm run test:all` — 29 Python + 249 Vitest, all pass; `npm run ai:verify` — 400
  deterministic simulations; `npm run typecheck` — clean; `python aikit.py check noesis` —
  6/6 gates pass.
- **STATUS**: committed with the cycle; next area is graphics and effects.

## Cycle 3 — Graphics and effects: feedback now keeps the trial stimulus

- **Area**: graphics and effects (rotation 3/7).
- **FIND**: At the feedback state the trial stimulus vanished, leaving `Hit` or `Impulse error`
  over an empty 220px box and no visual tie to what was just shown. Scripted capture:
  N-back `{phase: feedback, feedback: Hit, tone: correct, stimulus: null, stageFeedback: null}`;
  Go/No-Go `{feedback: Impulse error, tone: incorrect, stimulus: null, stageFeedback: null}`.
- **ANALYZE**: `nbackView`, `gonogoView` and `speedView` gated `stimulus` to the active trial
  phase only; `MechanicStage` had no feedback attribute. The engine already had `feedbackTone`,
  so the fix is view/attribute/CSS only, with no scoring or timing change.
- **KILLED**: None dropped. A full-screen flash or animation was rejected on the safety
  constraint (photosensitivity; no flashing by design); the chosen signal is a static border plus
  a dimmed stimulus, with the existing text still carrying the meaning.
- **IMPLEMENT**: Failing-first assertions in the N-back, Go/No-Go and Speed engine tests now
  require the stimulus to survive into feedback; a `MechanicStage` test requires
  `data-feedback="correct"`. Views expose the stimulus during `feedback`; every stage sets
  `data-feedback`; CSS dims the stimulus to 0.55 in feedback and tints the stage border
  green/red (shadow dropped in high-contrast). Added `scripts/feedback-proof.mjs`, which drives
  a focus N-back hit and a focus Go/No-Go commission to their feedback frames and records the
  view and stage attributes.
- **PROOF (screenshots)**: same viewport 390x844@2x, same fixed seed 2721744568, same harness;
  only the build differs.
  - before N-back: `%TEMP%\opencode\noesis-cycles\cycle3-before\before-01-nback-hit-feedback.png`
    SHA-256 `E2E6D6B8484D598A4311605BC4DEE86D4030D6B82F2AEB9EC85D6A8246332971` (blank box)
  - after N-back: `%TEMP%\opencode\noesis-cycles\cycle3-after\after-01-nback-hit-feedback.png`
    SHA-256 `68869D54CA4708A46068D75F501833883C08165F9276623DB047E7B075CD5496` (letter D dimmed,
    green border)
  - before Go/No-Go:
    `%TEMP%\opencode\noesis-cycles\cycle3-before\before-02-gonogo-commission-feedback.png`
    SHA-256 `589FBF2BB50D56F0FAB49D89692E61362177570BB3430955A242FCFD32D48145` (blank stage)
  - after Go/No-Go:
    `%TEMP%\opencode\noesis-cycles\cycle3-after\after-02-gonogo-commission-feedback.png`
    SHA-256 `544951AE40F17DF53FCE283E5AC87831A2951E8580276C506515FC563E6792BB` (dimmed square,
    red border)
- **PROOF (played run)**: `node scripts/feedback-proof.mjs before|after <dir>` played a focus
  N-back session until a real target and a focus Go/No-Go session until a real no-go, responding
  through the live store, then captured the feedback frame. Before: both captures had
  `stimulus: null`, `stageFeedback: null`. After: N-back `stimulus: "D"`, `stageFeedback:
  "correct"`, feedback `Hit`; Go/No-Go `stimulus: "square"`, `stageFeedback: "incorrect"`,
  feedback `Impulse error`. `consoleErrors []` in both runs; no page errors; scores and block
  completion unchanged. What improved: the result is now visibly attached to the trial. What
  stayed the same: input gating, timing, scoring, and the next-trial reset.
- **GATES**: `npm run test:all` — 29 Python + 249 Vitest, all pass; `npm run ai:verify` — 400
  deterministic simulations; `npm run typecheck` — clean; `python aikit.py check noesis` —
  6/6 gates pass.
- **STATUS**: committed with the cycle; next area is mechanic feel (the combat-feel rotation).

## Cycle 4 — Mechanic feel: Go/No-Go prompt leaked the trial shape

- **Area**: mechanic feel (rotation 4/7, the combat-feel slot).
- **FIND**: In the blank response window the stage prompt still named the current trial:
  no-go showed `Do not respond to the square.` and go showed `Respond to the circle.` while
  `stimulus: null` and `canRespond: true`. A late response could read the answer after the shape
  disappeared; scripted before-run recorded `promptsEqual: false` at indices 4 (no-go) and 5
  (go), then scored the late no-go response as `commission`.
- **ANALYZE**: `gonogoView` built `prompt` from `trial.go`, independent of whether the shape was
  still visible. The response window intentionally outlives the 790ms stimulus; the prompt must
  be trial-independent for the inhibition measure to mean anything. Fix is view copy only.
- **KILLED**: None. A cue that only says `Respond now` on go trials was rejected because it
  keeps the same leak; the static reminder is the only version that adds no trial identity.
- **IMPLEMENT**: Failing-first engine test builds a go and a no-go state at the same response
  phase, asserts both have `stimulus: null`/`canRespond: true` and requires identical prompts;
  it failed with `Respond to the circle.` vs `Do not respond to the square.`. `gonogoView` now
  uses `Circles: respond. Squares: withhold.` during stimulus/response/feedback, `Get ready.`
  during ITI and `Block complete` at the end. Added `scripts/gonogo-prompt-proof.mjs`, which
  drives a fixed-seed focus block to the no-go and go response windows, records both prompts,
  clicks a late no-go response, then finishes the block and reads the result summary.
- **PROOF (screenshots)**: same viewport 390x844@2x, same fixed seed 2721744568, same no-go
  index 4, same response window; only the build differs.
  - before: `%TEMP%\opencode\noesis-cycles\cycle4-before\before-01-gonogo-nogo-response.png`
    SHA-256 `7EB46DF2E9194DE880395509D22048D49E86C9512B21226C7F6F25B3F1561224`
    (`Do not respond to the square.` over the blank stage)
  - after: `%TEMP%\opencode\noesis-cycles\cycle4-after\after-01-gonogo-nogo-response.png`
    SHA-256 `8EF2F19A2E2D9CD5F4F629DD72B7F9C9913C46511B02220C2775CEE1C5F3E05A`
    (`Circles: respond. Squares: withhold.` over the blank stage)
- **PROOF (played run)**: `node scripts/gonogo-prompt-proof.mjs before|after <dir>` played a
  focus Go/No-Go block through both response windows. Before: no-go prompt `Do not respond to
  the square.`, go prompt `Respond to the circle.`, `promptsEqual false`. After: both
  `Circles: respond. Squares: withhold.`, `promptsEqual true`; the late no-go response remained
  `{kind: commission, correct: false}`; the finished block reported
  `Go/No-Go: 27% accuracy, 1 impulse errors, 0 ms mean go reaction.` in both builds. Frame
  health: `consoleErrors []`, no page errors. What improved: the blank window no longer reveals
  the trial. What stayed the same: stimulus timing, response window, scoring and the block
  summary.
- **GATES**: `npm run test:all` — 29 Python + 250 Vitest, all pass; `npm run ai:verify` — 400
  deterministic simulations; `npm run typecheck` — clean; `python aikit.py check noesis` —
  6/6 gates pass.
- **GATE STABILITY**: the first `aikit check` run hit the 10s timeout in
  `tests/ui/study-journey.test.tsx` because it dispatched every 50ms simulator tick through its
  own `act()` (12.96s for four tests). The helper now batches one block's mechanic actions into
  one `act()` and keeps `next` in a second, so the `block_complete` frame that Motivation needs
  still renders once per block while intermediate trial frames do not. Assertions are unchanged;
  the focused file dropped to 0.64s and `npm run test:all` to 9.46s; the rerun `aikit check`
  passed 6/6.
- **STATUS**: committed with the cycle; next area is enemies/bosses (session structure).

## Cycle 5 — Session structure: quick sessions always used the same two mechanics

- **Area**: session structure (rotation 5/7, the enemies/bosses slot).
- **FIND**: Every quick session took the first two blocks of the lineup. The scripted
  four-clock run recorded `pairs: ["nback,gonogo"]`, `distinctPairs: 1`, `seen: ["gonogo",
  "nback"]`, `allFourCovered: false`. A user who always chooses the short session never trains
  Reasoning or Speed Tap outside a focus session.
- **ANALYZE**: `sessionBlocks` built the full lineup and returned `blocks.slice(0, 2)` for quick;
  no input let the window move. The lineup is deterministic per session seed, so the seed is
  available to rotate the window without new state or storage. Standard/focus lineups must not
  change.
- **KILLED**: Randomising the pair at runtime was rejected (non-deterministic and untestable);
  extending quick to four blocks was rejected (it is the five-minute option); changing standard
  order was rejected (ADR-028 keeps the fixed interleaved four).
- **IMPLEMENT**: Failing-first test starts eight quick sessions and requires more than one pair
  and all four mechanics; it failed with `expected 1 to be greater than 1`. `sessionBlocks` now
  takes a rotation offset, rotates the mechanic list, then slices to two; `defaultSessionConfig`
  passes `normalizeSeed(seed)` only for quick sessions. README's one-click section documents the
  rotation. Added `scripts/quick-lineup-proof.mjs`, which starts four quick sessions under fixed
  clocks, records every lineup, and plays one through to results.
- **PROOF (screenshots)**: same viewport 390x844@2x, same fixed clock 2721744569 (seed +1),
  same first-block state; only the build differs.
  - before: `%TEMP%\opencode\noesis-cycles\cycle5-before\before-01-first-block-seed2.png`
    SHA-256 `072ACC29A8EBF833FD4C1AD0D440D9E0E1B5214EC2768F577B51C907368F9849`
    (Block 1 of 2: N-back)
  - after: `%TEMP%\opencode\noesis-cycles\cycle5-after\after-01-first-block-seed2.png`
    SHA-256 `4F084661940CCB12E0035EACC0403DCC413D1F662E3E66E1AE4E6372229DB41D`
    (Block 1 of 2: Go / No-Go for the same seed)
- **PROOF (played run)**: `node scripts/quick-lineup-proof.mjs before|after <dir>` started four
  quick sessions at clocks `…568`–`…571`. Before: all four were `["nback","gonogo"]`. After:
  `["nback","gonogo"]`, `["gonogo","reasoning"]`, `["reasoning","speed"]`,
  `["speed","nback"]`; `distinctPairs 4`, `allFourCovered true`. The seed-2 session was played
  end to end: `Go/No-Go: 100% accuracy, 0 impulse errors, 22 ms mean go reaction.` then
  `Reasoning: 8/8 correct (100%), 0 timed out.` with the same results screen. Frame health:
  `consoleErrors []`, no page errors, quick target still 5:00. What improved: repeated short
  sessions now exercise Reasoning and Speed Tap. What stayed the same: two-block length,
  difficulty mapping, per-mechanic scoring and standard/focus lineups.
- **GATES**: `npm run test:all` — 29 Python + 251 Vitest, all pass; `npm run ai:verify` — 400
  deterministic simulations; `npm run typecheck` — clean; `python aikit.py check noesis` —
  6/6 gates pass.
- **STATUS**: committed with the cycle; next area is levels (difficulty/adaptation visibility).

## Cycle 6 — Levels: block level was invisible in sessions and results

- **Area**: levels (rotation 6/7).
- **FIND**: The Settings copy says "compare blocks only within the same level", and adaptive
  difficulty changes each task's level, but neither the session header nor the result cards
  showed it and `MechanicResult` did not record it. A fixed-clock adaptive run (N-back level 1,
  Go/No-Go level 3) recorded `blockDifficulty: null`, `results[].difficulty: null`, no level
  badges, headers `Block 1 of 2` / `Block 2 of 2`.
- **ANALYZE**: `completeBlock` had the block config in hand but built the result without it;
  `SessionView` omitted the block difficulty. The history and export are result passthroughs,
  so one additive field makes the level available everywhere without a storage migration.
- **KILLED**: Re-deriving level from trial counts or task parameters was rejected (Go/No-Go and
  Speed do not encode difficulty in state, and inference would drift); showing level only in
  Settings was rejected because the comparison instruction lives with the result.
- **IMPLEMENT**: Failing-first engine assertions require completed results to carry each
  block's difficulty and `sessionView` to expose it; both failed with `undefined`. `MechanicResult`
  gains an optional `difficulty` set by `completeBlock`; `SessionView` gains
  `blockDifficulty`; the session eyebrow appends `· Level L`; each result card shows a
  `Level L` badge (old records without the field show no badge). README documents the visibility.
  Added `scripts/level-visibility-proof.mjs`, which seeds adaptive levels 1/3, starts a quick
  session, captures both headers, plays to results and reads the badges and result fields.
- **PROOF (screenshots)**: same viewport 390x844@2x, same fixed clock/adaptive state/seed, same
  quick session; only the build differs.
  - before header: `%TEMP%\opencode\noesis-cycles\cycle6-before\before-01-first-block-header.png`
    SHA-256 `AB031F8F307318B5A304ECABEAA89A0AE9CB5B19FDF4A389B2BA110E26433132`
    (`Block 1 of 2`, no level)
  - after header: `%TEMP%\opencode\noesis-cycles\cycle6-after\after-01-first-block-header.png`
    SHA-256 `0615262DC21CF304E3B304CEFEE4AD45BC9358A685C8072538652B299897B615`
    (`Block 1 of 2 · Level 1`)
  - before results: `%TEMP%\opencode\noesis-cycles\cycle6-before\before-03-results-levels.png`
    SHA-256 `D4CB11AFDB3879A52F2A5212D0FA4EA08994BD6DD5F617EAB9442ADDD891140E`
  - after results: `%TEMP%\opencode\noesis-cycles\cycle6-after\after-03-results-levels.png`
    SHA-256 `8C95D57C96BCB76CEEF13CEDCE42C111339BF92D26CE353C1C392987F520114F`
    (Level 1 N-back card, Level 3 Go/No-Go card)
- **PROOF (played run)**: `node scripts/level-visibility-proof.mjs before|after <dir>` started a
  quick session with adaptive N-back level 1 and Go/No-Go level 3, then played it to results.
  Before: `first.eyebrow "Block 1 of 2"`, `second.eyebrow "Block 2 of 2"`,
  `levelsVisibleInHeaders false`, `levelsVisibleOnCards false`, both result difficulties null.
  After: `Block 1 of 2 · Level 1` (N-back), `Block 2 of 2 · Level 3` (Go/No-Go);
  badges `Level 1` and `Level 3`; result difficulties `[1, 3]`; both blocks scored 100%.
  `consoleErrors []`, no page errors. What improved: adaptive level changes are visible and
  recorded. What stayed the same: scoring, block length, the adaptive rule itself and standard
  session content.
- **GATES**: `npm run test:all` — 29 Python + 253 Vitest, all pass; `npm run ai:verify` — 400
  deterministic simulations; `npm run typecheck` — clean; `python aikit.py check noesis` —
  6/6 gates pass.
- **STATUS**: committed with the cycle; next area is audio cues (rotation 7/7).

## Cycle 7 — Session safety: End session discarded progress without confirmation

- **Area**: session safety/session structure (rotation 7/7).
- **FIND**: The paused overlay's **End session** button cleared the snapshot and aborted the
  session on the first click. A scripted pause-and-end run recorded
  `confirmShown: false`, `sessionVisible: false`, `homeVisible: true`, `storePhase: null`,
  `snapshot: false` immediately after that one click; the session was unrecoverable.
- **ANALYZE**: `SessionScreen` wired the danger button straight to `onEnd`, and `App.endSession`
  clears the snapshot, aborts the store and returns home. The destructive action needs a local
  confirm step; the abort contract and snapshot format should stay unchanged.
- **KILLED**: Auto-saving partial sessions was rejected (it changes the history and trial-data
  contract); a browser `confirm()` was rejected (blocks the UI and is hard to style/test); moving
  End off the pause overlay was rejected (it hides a legitimate action).
- **IMPLEMENT**: Failing-first `tests/ui/end-confirmation.test.tsx` clicks **End session** and
  expects `onEnd` not to fire, then keeps the session, then confirms and expects one call; it
  failed on the missing confirm target. `SessionScreen` now has a local `confirmEnd` state:
  first click opens **End this session?** with **Keep practicing** and **End session**; only the
  second click calls `onEnd`. The state resets when the session unpauses. Added
  `scripts/end-guard-proof.mjs`, which pauses a quick session, clicks End, records the state,
  keeps the session, then confirms the end.
- **PROOF (screenshots)**: same viewport 390x844@2x, same fixed clock, same paused state before
  the click; only the build differs.
  - before: `%TEMP%\opencode\noesis-cycles\cycle7-before\before-02-after-first-end-click.png`
    SHA-256 `EBC24476D57604D5670A3F4E2D4CCD268DA536FF8E71EDB0DBD3ECB16B51BB7F`
    (home screen after the single click; session gone)
  - after: `%TEMP%\opencode\noesis-cycles\cycle7-after\after-02-after-first-end-click.png`
    SHA-256 `6815ABB96C7BAFDCFF99CD413BCB3F9D5C99BC345E281B8502E041461503E56F`
    (**End this session?** confirm with Keep practicing / End session)
- **PROOF (played run)**: `node scripts/end-guard-proof.mjs before|after <dir>` started a quick
  session, paused it and clicked End. Before: `confirmShown false`, `homeVisible true`,
  `sessionVisible false`, `storePhase null`, `snapshot false`. After: `confirmShown true`,
  `sessionVisible true`, `storePhase "running"`, `snapshot true`; **Keep practicing** returned
  to the session (`keepReturnedToSession true`); the second End + confirm returned home with
  `store null` and `snapshot false`. `consoleErrors []`, no page errors. What improved: an
  accidental end is recoverable. What stayed the same: deliberate end semantics, snapshot
  format, and completed-session history.
- **GATES**: `npm run test:all` — 29 Python + 254 Vitest, all pass; `npm run ai:verify` — 400
  deterministic simulations; `npm run typecheck` — clean; `python aikit.py check noesis` —
  6/6 gates pass.
- **STATUS**: committed with the cycle; audio cues recorded as a dead end (no audio modules by
  design); next area is a second readability pass on the remaining open candidates.

## Cycle 8 — UI readability: claim badges and the session date were below 12px

- **Area**: UI readability, second pass (new findings, not a repeat of cycle 2).
- **FIND**: The 390x844 audit still reported seven tiny-text instances across home, home with
  history and evidence: `badge badge-supported` and `badge badge-experimental` at 11.52px and
  `seed` at 11.84px. These are the claim labels and the last-session date, both load-bearing for
  older adults.
- **ANALYZE**: `.badge` used 0.72rem and `.seed` 0.74rem; everything else in the audited screens
  was already at least 12px after cycle 2's PMID change. Fix is CSS-only.
- **KILLED**: No candidate dropped. The two remaining `smallTargets` audit flags are checkbox
  inputs inside full-size labels, not real undersized targets; changing them would be noise.
- **IMPLEMENT**: `.badge` font-size 0.72rem → 0.78rem (12.48px) and `.seed` 0.74rem → 0.8rem
  (12.8px). No layout, copy, engine or storage change.
- **PROOF (screenshots)**: same viewport 390x844@2x, same seeded quick session and fixed clock,
  same `scripts/ui-audit.mjs` run; only the build differs.
  - before: `%TEMP%\opencode\noesis-cycles\cycle8-before\04-home-history.png`
    SHA-256 `516706765589B4C8381DF640E42A2E5F9D42E2237ABD46D4A4DF50508552C169`
  - after: `%TEMP%\opencode\noesis-cycles\cycle8-after\04-home-history.png`
    SHA-256 `20DBFB91C05333AD78AB5902A35C39998C9BD4ACBED4ACBEB359A46E7D695508`
- **PROOF (played run)**: `node scripts/ui-audit.mjs <dir>` drove a quick session to results and
  visited home, session, results, settings, evidence and large-text. Tiny-text counts went
  `home-empty 2 → 0`, `home-history 3 → 0`, `evidence 2 → 0`; every audited screen now reports
  `tinyText: 0`. `consoleErrors []` and no page errors; `session-nback` and `results` layouts
  unchanged; all citation rows remained 59px high.
- **GATES**: `npm run test:all` — 29 Python + 254 Vitest, all pass; `npm run ai:verify` — 400
  deterministic simulations; `npm run typecheck` — clean; `python aikit.py check noesis` —
  6/6 gates pass.
- **STATUS**: committed with the cycle; next area is the results-copy consistency candidate.

## Commands run

```text
npx vitest run tests/ui/resume-motivation.test.tsx
  before fix: 1 failed (expected 36 to be 18)
  after fix:  1 passed
$env:NOESIS_URL='http://127.0.0.1:5174/'; node scripts/resume-proof.mjs before <dir>
  200 shown vs 100 saved; doubled true; consoleErrors []
$env:NOESIS_URL='http://127.0.0.1:5174/'; node scripts/resume-proof.mjs after <dir>
  100 shown vs 100 saved; doubled false; banked 100; consoleErrors []
npx vitest run tests/ui/evidence-citations.test.tsx
  before fix: 1 failed (link text had no PMID)
  after fix:  1 passed
$env:NOESIS_URL='http://127.0.0.1:5174/'; node scripts/ui-audit.mjs <dir>
  evidence citations: minHeight 21 -> 59; 5 -> 0 small targets; popup URL unchanged
  consoleErrors [] on every audited screen
npm run test:all                 29 Python + 249 Vitest passed
npm run ai:verify                400/400 deterministic simulations passed
npm run typecheck                clean
python aikit.py check noesis     6/6 gates passed

npx vitest run tests/engine/nback.test.ts tests/engine/gonogo.test.ts tests/engine/speed.test.ts tests/ui/mechanic-stage.test.tsx
  before fix: 4 failed (stimulus null / data-feedback null)
  after fix:  33 passed
$env:NOESIS_URL='http://127.0.0.1:5174/'; node scripts/feedback-proof.mjs before|after <dir>
  before: stimulus null in both feedback frames, stageFeedback null
  after:  N-back stimulus D / correct; Go/No-Go stimulus square / incorrect; consoleErrors []

npx vitest run tests/engine/gonogo.test.ts
  before fix: 1 failed (prompt differs by trial)
  after fix:  8 passed
node scripts/gonogo-prompt-proof.mjs before|after <dir>
  before: promptsEqual false ("Respond to the circle." vs "Do not respond to the square.")
  after:  promptsEqual true (static instruction); commission still counted; consoleErrors []
npm run test:all                 29 Python + 250 Vitest passed
python aikit.py check noesis     6/6 gates passed

npx vitest run tests/engine/session.test.ts
  before fix: 1 failed (expected 1 pair to be greater than 1)
  after fix:  14 passed
node scripts/quick-lineup-proof.mjs before|after <dir>
  before: 4/4 quick lineups nback,gonogo; allFourCovered false
  after:  four distinct pairs; allFourCovered true; gonogo+reasoning session completed 100%
npm run test:all                 29 Python + 251 Vitest passed
python aikit.py check noesis     6/6 gates passed

npx vitest run tests/engine/session.test.ts
  before fix: 2 failed (difficulty and blockDifficulty undefined)
  after fix:  14 passed
node scripts/level-visibility-proof.mjs before|after <dir>
  before: headers without level, no badges, result difficulty null
  after:  Level 1/3 headers; Level 1/3 badges; result difficulty [1,3]; consoleErrors []
npm run test:all                 29 Python + 253 Vitest passed
python aikit.py check noesis     6/6 gates passed

npx vitest run tests/ui/end-confirmation.test.tsx
  before fix: 1 failed (no confirmation target)
  after fix:  1 passed
node scripts/end-guard-proof.mjs before|after <dir>
  before: one End click -> home, store null, snapshot false
  after:  confirm shown, keep returns to session; confirm -> home; consoleErrors []
npm run test:all                 29 Python + 254 Vitest passed
python aikit.py check noesis     6/6 gates passed

node scripts/ui-audit.mjs <dir>
  before: tinyText home-empty 2, home-history 3, evidence 2
  after:  tinyText 0 on every audited screen; consoleErrors []
npm run test:all                 29 Python + 254 Vitest passed
python aikit.py check noesis     6/6 gates passed
```
