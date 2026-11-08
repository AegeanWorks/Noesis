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
9. Results copy — 2026-11-07 — cycle 9
10. Level-aware bests — 2026-11-07 — cycle 10
11. Final audit — 2026-11-07 — zero verified findings (stop)
12. Task Switch resume and switch-cost interpretation — 2026-11-08 — cycle 12
13. Level-aware switch-cost history — 2026-11-08 — cycle 13
14. Same-level switch-cost change — 2026-11-08 — cycle 14
15. Same-level result delta — 2026-11-08 — cycle 15
16. Choose-card switch-cost line — 2026-11-08 — cycle 16
17. Experimental Flanker mechanic — 2026-11-08 — cycle 17
18. Flanker resume and interference note — 2026-11-08 — cycle 18
19. Flanker interference-cost Choose/History trend — 2026-11-08 — cycle 19
20. Flanker same-level result delta — 2026-11-08 — cycle 20

Audio cues — dead end (2026-11-07): the README states no audio, EEG or biometric modules
ship; adding sound would change the stated product scope and safety posture, so no cycle.

Open candidates (not yet cycles): none from the current audits.

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

## Cycle 9 — Results copy: singular impulse error and exact reaction time

- **Area**: results copy (readability/consistency; new findings from the results screens).
- **FIND**: A one-commission Go/No-Go result read `1 impulse errors` and its card showed
  `Reaction time <40 ms` while the same card's summary said `15 ms mean go reaction`. The
  scripted before-run recorded `summary "…1 impulse errors…"`, `tileReaction "<40 ms"`,
  `meanGoReaction 15`, `singularCopy false`, `tileMatchesSummary false`.
- **ANALYZE**: `gonogoResult` hard-coded `impulse errors`; `formatMetric` replaced every value
  between 1 and 39 ms with `<40 ms` even though the summary printed the exact number. N-back
  false alarms and Speed Tap lapses had the same plural hazard. Fix is copy/format only.
- **KILLED**: Hiding the precision in the summary instead was rejected (the summary is the
  portable text record); showing "0 ms" as "—" was rejected because a genuine zero is
  meaningful and the unit tests can pin it.
- **IMPLEMENT**: Failing-first tests: `countLabel` singular/plural, Go/No-Go singular summary
  with exactly one commission, and `formatMetric` returning `15 ms`/`0 ms`; all failed before.
  Added `countLabel` to scoring and used it in the N-back false-alarm, Go/No-Go commission and
  Speed Tap lapse summaries; `formatMetric` now always prints the rounded millisecond value.
  Added `scripts/results-copy-proof.mjs`, which completes a quick N-back + Go/No-Go session with
  exactly one commission and 15 ms reactions and reads the result copy.
- **PROOF (screenshots)**: same viewport 390x844@2x, same fixed clock/seed, same one-commission
  state; only the build differs.
  - before: `%TEMP%\opencode\noesis-cycles\cycle9-before\before-01-results-copy.png`
    SHA-256 `A45D4D8B3114C2554BD52B933285CCE89AC27D3A78E1C9FA7D9FD6D25A6E34E9`
    (`1 impulse errors`, tile `<40 ms`, summary `15 ms`)
  - after: `%TEMP%\opencode\noesis-cycles\cycle9-after\after-01-results-copy.png`
    SHA-256 `94DABD32594FE92C00696B5FCCACCCF9D6B80F3CD959CE65949A8BCFA5C563F0`
    (`1 impulse error`, tile `15 ms`)
- **PROOF (played run)**: `node scripts/results-copy-proof.mjs before|after <dir>` started a
  quick session, played N-back optimally and Go/No-Go with one deliberate no-go commission and
  15 ms go responses, then read the results. Before: summary `1 impulse errors`, tile
  `<40 ms`, 34 trials seen, 24 hits, 1 commission. After: summary `1 impulse error`, tile
  `15 ms`, identical trials/hits/commission counts; `singularCopy true`, `pluralCopy false`,
  `tileMatchesSummary true`; `consoleErrors []`, no page errors. What improved: the card and its
  summary now agree and the singular reads correctly. What stayed the same: scoring, trial
  counts, motivation and layout.
- **GATES**: `npm run test:all` — 29 Python + 257 Vitest, all pass; `npm run ai:verify` — 400
  deterministic simulations; `npm run typecheck` — clean; `python aikit.py check noesis` —
  6/6 gates pass.
- **STATUS**: committed with the cycle; current audits have no open candidates.

## Cycle 10 — Levels: bests and the near-best cue ignored the block level

- **Area**: levels/progression (follow-up to the level field added in cycle 6).
- **FIND**: `bestAccuracyFor`, `detectNewBests` and the Motivation near-best lookup compared
  every historical accuracy regardless of level, even though Settings says to compare within a
  level. A scripted state with a level-1 best of 85% and a level-3 best of 95% showed home
  `Last 85% / Best 95%`; a level-1 block at 83% earned no near-best cue and 44 momentum.
- **ANALYZE**: the history layer had no level parameter, and the App passed only mechanic.
  Cycle 6 made the level available on every new result, so the filter belongs in
  `bestAccuracyFor` and its two callers, with legacy results without a level excluded when a
  level is requested. Home labels should show the level being compared.
- **KILLED**: Comparing against all levels for users with legacy history was rejected (it is the
  defect); treating the first new-level block as a new best was rejected (there is no prior
  same-level best to beat).
- **IMPLEMENT**: Failing-first history tests require level-filtered bests and a same-level new
  best; a Home test requires `Last L2 80%`/`Best L2 90%` and ignores a level-3 95%. Two failed
  before the change. `bestAccuracyFor` takes an optional difficulty; `detectNewBests` and the
  App near-best lookup pass it; Home labels the last/best level. README states the same-level
  near-best rule and level labels. Added `scripts/level-best-proof.mjs`, which seeds a level-1
  85% best and level-3 95% best, plays a level-1 N-back block to 83% and reads the home labels,
  momentum and near-best line.
- **PROOF (screenshots)**: same viewport 390x844@2x, same fixed clock, same seeded history and
  same 83% block; only the build differs.
  - before home: `%TEMP%\opencode\noesis-cycles\cycle10-before\before-01-home-best.png`
    SHA-256 `997D06C9AAFD2C303AEFA4C8744D0CB7B811579EC504875A7560BE4CD45AA433`
    (`Last 85%`, `Best 95%`)
  - after home: `%TEMP%\opencode\noesis-cycles\cycle10-after\after-01-home-best.png`
    SHA-256 `24EC3E20CF919FBF349446949E61774821E60FC0AEDE1DEC2F92375E7EEC9F82`
    (`Last L1 85%`, `Best L1 85%`)
  - before block complete:
    `%TEMP%\opencode\noesis-cycles\cycle10-before\before-02-block-complete-near-best.png`
    SHA-256 `A5B4C52F1AD94FD083FE0E6B3BAC80B05631164D727721FD5197352FD8A0D667`
    (`+44 momentum`, no near-best line)
  - after block complete:
    `%TEMP%\opencode\noesis-cycles\cycle10-after\after-02-block-complete-near-best.png`
    SHA-256 `BEB1A0E90B20711B7D7DD80F882CDC685480E48CB0943D92BA2B2C69F6E0D932`
    (`+64 momentum`, `So close to your best: +10`)
- **PROOF (played run)**: `node scripts/level-best-proof.mjs before|after <dir>` seeded the two
  level bests, started a focus N-back session (adaptive level 1) and hit two of five targets for
  exactly 83% accuracy. Before: home `Last 85% / Best 95%`; block `+44 momentum`, streak 6,
  `nearBestCue false`, `earnedTenBonus false`. After: home `Last L1 85% / Best L1 85%`; the same
  83% block earned `+64 momentum` with `So close to your best: +10`, `nearBestCue true`,
  `earnedTenBonus true`; block difficulty 1. `consoleErrors []`, no page errors. What improved:
  the bonus and the displayed best now compare like with like. What stayed the same: accuracy,
  streak, level and scoring.
- **GATES**: `npm run test:all` — 29 Python + 260 Vitest, all pass; `npm run ai:verify` — 400
  deterministic simulations; `npm run typecheck` — clean; `python aikit.py check noesis` —
  6/6 gates pass.
- **STATUS**: committed with the cycle; current audits have no open candidates.

## Cycle 11 — Final audit: zero verified improvements

- **Area**: whole app audit across all seven rotation areas.
- **FIND**: no reproducible, worth-fixing defect survived the audit. The final `ui-audit` run
  (390x844@2x, fixed clock, quick session driven to results) reported `consoleErrors []`,
  `horizontalScroll false` on every screen, `tinyText 0` on home/session/results/settings/
  evidence/large-text, citation rows `allAtLeast44High true` with `minHeight 59`, and the only
  `smallTargets` entries were checkbox inputs inside full-size `.check` labels.
- **ANALYZE / KILLED**:
  - The home sparkline and "wobbliest lately" suggestion still aggregate levels, but they are a
    recent-trend view and a focus suggestion, not a best/worst claim; filtering them by level
    would hide recent history and no incorrect decision was reproduced.
  - Speed Tap ignores taps before the circle appears by design (`canRespond` false); reaction
    time is measured from onset, and adding a false-start penalty would change the construct
    without evidence.
  - Audio cues remain a dead end: the README intentionally ships no audio, EEG or biometric
    modules; adding sound would change the stated scope and safety posture.
  - Every prior open candidate (badge microtext, metric copy, pluralization, destructive end,
    level visibility, level-aware bests, citations) is fixed and covered by before/after
    evidence in cycles 1–10.
- **VERIFICATION**: `python aikit.py check noesis` — test/typecheck/build/hygiene/guidelines/
  secrets 6/6 pass after cycle 10; `npm run ai:verify` — 400 deterministic simulations;
  `npm run test:all` — 29 Python + 260 Vitest. No code change this cycle, so no new commit
  beyond this record.
- **RESULT**: zero verified improvements in this cycle; the run stops here per the goal's stop
  condition. The full evidence trail is this file, `.aikit/decisions.md` ADR-032…ADR-039, and
  the `scripts/*-proof.mjs` harnesses.

## Cycle 12 - Literature-based practice menu and pre-test briefing

- **Area**: navigation, measurement history, test onboarding.
- **FIND**: the app had per-mechanic focus buttons on Home and per-mechanic last/best
  values, but no single menu to compare tests, choose one, or read completed blocks. A
  session began scoring immediately with only a one-line instruction, so a user could not
  see the construct, claim boundary or source before starting. The user requested both.
- **ANALYZE**: the existing review already supports per-block reporting, focus sessions and
  low-stakes framing. A targeted PubMed update added two SDT meta-analyses as context
  records (PMID 32437175, 31983293) and reused the test-anxiety record (PMID 29156362).
  The menu and briefing are autonomy-support and transparency features, not efficacy claims.
- **IMPLEMENT**: `PracticeMenuScreen` with Choose a test / History tabs; `TestBriefing`
  before every block; `MechanicMeta.brief`; clock pause until Begin test; Home links to
  Menu and History; README, DESIGN_IMPLICATIONS R54-R56, ADR-040 and the research note
  `PRACTICE_MENU_AND_BRIEFING.md`.
- **VERIFICATION**: see the commands below; the browser proof records 4 menu cards with
  claim boundaries and PMIDs, a Speed Tap start from a menu scrolled 2,557px that lands at
  `scrollOnBriefingPx: 0`, `tickWhileBriefingMs: 0`, `tickAfterBeginMs: 911`, and a paused
  clock that does not advance. The UI audit records no console errors and no horizontal
  scroll on menu, briefing or history.

## Cycle 13 - Research consent and local email data return

- **Area**: research data collection, consent, privacy and export.
- **FIND**: the app could export data locally but had no informed-consent process, no
  participant code, no study contact and no way to prepare a research email. A user could
  not use Noesis as a data collector for future articles without adding a server or
  inventing a consent process.
- **ANALYZE**: a targeted PubMed update added two e-consent systematic reviews as context
  records (PMID 37656499, 36810093): digital consent was better or not worse than paper for
  comprehension, acceptability and usability, with no study favouring paper, while
  enrolment effects were mixed. A data-banking Perspective (PMID 42443473) and a
  data-sharing measurement review (PMID 41813053) stayed narrative-only. The design keeps
  consent opt-in, bilingual, versioned and separate from safety onboarding.
- **IMPLEMENT**: `researchConsent` and `researchSettings` storage; bilingual consent text;
  `ResearchConsentScreen`; `ResearchDataPanel`; `researchEmail` draft builder; export
  `research` metadata; Settings research card; local JSON download + `mailto` draft with a
  manual attach step; withdrawal and contact-change re-consent rules. No server, no SMTP
  credential, no automatic send.
- **VERIFICATION**: see commands below; the browser proof records five checkboxes, the
  Turkish title, a participant code in the file, no study contact in the file, a downloaded
  `noesis-research-*.json`, a `mailto:` draft, withdrawal disabling future sends, and no
  console errors. The UI audit covers the consent screen with no horizontal scroll and no
  tiny text.

## Cycle 14 - Session adherence log for dropout analysis

- **Area**: measurement, research export and Settings transparency.
- **FIND**: the export contained completed sessions only. A participant who started and left
  was invisible, so dropout and dose could not be measured. The review makes adherence a
  primary metric (R22) and the measurement plan lists sessions started/completed and dropout.
  A pilot RCT in computerized training reported 38.5%/57.1% dropout (PMID 30881315).
- **ANALYZE**: existing adherence sources are PMID 40779747 (BCT/adherence), 35612886 (mHealth
  adherence) and the narrative-only pilot (30881315). The missing capability was measurement,
  not a new engagement prompt.
- **IMPLEMENT**: `adherence` storage with start/complete/abort events; dangling starts closed
  on a new session; export `adherence[]`; Settings summary; Delete local data clears it; no
  server, no new prompt, no scoring change.
- **VERIFICATION**: see commands below; the browser proof now starts and ends a session before
  consent, and the downloaded JSON carries one aborted event. Settings shows the local summary;
  tests cover start, completion, early ending, dangling closure, fallback completion and
  corrupted storage.

## Cycle 15 - Analysis-ready CSV companions

- **Area**: research data reuse and Settings export.
- **FIND**: the JSON record was complete but nested, so the study team had to flatten session
  results and adherence events by hand before analysis. That is transcription risk and an
  avoidable barrier to reuse.
- **ANALYZE**: FAIR data stewardship calls for interoperable, reusable formats and
  machine-readable metadata (PMID 26978244); the existing review already requires a portable
  export (R49). The CSV is a flat companion, not a replacement for JSON.
- **IMPLEMENT**: `buildSessionsCsv` (one row per block, stable headers, full `metrics_json`
  and `motivation_json`), `buildAdherenceCsv` (one row per event), RFC 4180-style quoting,
  date-stamped local downloads, Settings buttons disabled when empty, ADR-043, R61 and
  `DATA_EXPORT_AND_REUSE.md`.
- **VERIFICATION**: see commands below; the browser proof downloads both CSV files from a
  seeded session and adherence record, checks the exact headers, row counts and expected
  values, and reports no console errors.

## Cycle 16 - Self-describing export manifest and data dictionary

- **Area**: research provenance, metadata and documentation.
- **FIND**: the JSON export carried only a payload version and session count. A study team
  could not tell which app release, evidence review or consent version produced a file, and
  the field meanings were only in the code. The Settings footer still said "evidence review
  v1.0" after two review updates.
- **ANALYZE**: FAIR reuse requires metadata to travel with the data (PMID 26978244). The fix
  is additive: a manifest in the JSON and a field-level dictionary, not a new export format.
- **IMPLEMENT**: `manifest` with app/schema/review/dictionary/consent versions and counts;
  centralized `appMeta` constants; Settings footer uses them; `DATA_DICTIONARY.md` covers
  JSON and both CSV layouts; ADR-044 and R62.
- **VERIFICATION**: see commands below; export tests assert the manifest shape, counts and
  consent version, and the browser proof checks the manifest in the downloaded JSON.

## Cycle 17 - Neutral adherence summary in Menu History

- **Area**: self-monitoring and history presentation.
- **FIND**: the adherence log was visible only in Settings; the History tab showed completed
  sessions but not starts or early endings. The review supports self-monitoring and feedback
  on behaviour (R23), and the data was already available.
- **ANALYZE**: a neutral summary is consistent with the non-punitive weekly summary (R30) and
  the existing adherence record (R60). No new storage or claim.
- **IMPLEMENT**: Menu History shows started/completed/ended-early counts, an all-time
  completion percentage, and copy stating that stopping early is not a failure. Same data as
  Settings and the export.
- **VERIFICATION**: the menu test asserts 4 started / 3 completed / 1 ended early / 75%;
  the UI audit includes the History tab; full gates follow.

## Cycle 18 - New-game literature search and experimental Task Switch

- **Area**: new mechanics from the literature.
- **FIND**: the app had four core mechanics but no cognitive-flexibility task. The review had
  no task-switching paradigm. A targeted search found two EF training meta-analyses
  (PMID 30998045, 32011155) with small near/far transfer in older adults, plus action-game and
  commercial-program reviews that were not a good safety/task fit.
- **ANALYZE**: candidate matrix covers Task Switch, Flanker, stop-signal, spatial span, mental
  rotation, visual search/UFOV, action games and commercial suites. Task Switch was chosen
  because it is a specific trainable construct, safe with static shapes and already supported
  by EF meta-analyses.
- **IMPLEMENT**: `switching` engine state machine, deterministic colour/shape rule schedule,
  switch/repeat metrics and switch cost, UI stage, keyboard 1/2, focus-session support, Menu
  test card, evidence meta, 500-simulation verifier, `NEW_MECHANIC_CANDIDATES.md`, R63 and
  ADR-045. Standard lineup remains four core mechanics.
- **VERIFICATION**: see commands below; engine/UI/session tests cover correctness, timeout,
  switch/repeat metrics, focus lineup and the UI stage; `ai:verify` now runs 500/500.

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

npx vitest run tests/engine/scoring.test.ts tests/engine/gonogo.test.ts tests/ui/results-copy.test.tsx
  before fix: 3 failed (countLabel/formatMetric absent, plural summary)
  after fix:  15 passed
node scripts/results-copy-proof.mjs before|after <dir>
  before: "1 impulse errors", tile "<40 ms", summary 15 ms
  after:  "1 impulse error", tile "15 ms"; same trials/hits; consoleErrors []
npm run test:all                 29 Python + 257 Vitest passed
python aikit.py check noesis     6/6 gates passed

npx vitest run tests/storage/history.test.ts tests/ui/home.test.tsx
  before fix: 3 failed (level filter, level new best, level labels)
  after fix:  34 passed
node scripts/level-best-proof.mjs before|after <dir>
  before: Best 95%, no near-best, +44 momentum
  after:  Best L1 85%, near-best +10, +64 momentum; same 83% accuracy; consoleErrors []
npm run test:all                 29 Python + 260 Vitest passed
python aikit.py check noesis     6/6 gates passed

npx vitest run tests/ui/practice-menu.test.tsx tests/ui/test-briefing.test.tsx
  before fix: 1 failed suite (PracticeMenuScreen missing) + 2 failed briefing tests
  after fix:  9 passed
npx vitest run tests/ui/briefing-clock.test.tsx
  passed: briefing open -> no frame/tick; Begin test -> tick advances
python -m noesis review check    114 records validated (90 primary, 24 context)
npm run test:all                 29 Python + 278 Vitest passed
$env:NOESIS_URL='http://127.0.0.1:5174/'; node scripts/menu-briefing-proof.mjs
  menu 4 cards all claim/boundary/PMID; chosenMechanic speed; scrollBeforeStart 2557 -> scrollOnBriefing 0; tickWhileBriefing 0; tickAfterBegin 911; clockStopped true; consoleErrors []
$env:NOESIS_URL='http://127.0.0.1:5174/'; node scripts/ui-audit.mjs <dir>
  consoleErrors []; no horizontal scroll; tinyText 0; new source links >=44px; menu/history/briefing audited
python aikit.py check noesis     6/6 gates passed

npx vitest run tests/storage/researchConsent.test.ts tests/storage/researchSettings.test.ts tests/storage/researchEmail.test.ts tests/storage/export.test.ts tests/ui/research-consent.test.tsx tests/ui/research-data.test.tsx
  before fix: 5 suites failed on missing modules; export.research undefined
  after fix:  44 passed
python -m noesis review check    116 records validated (90 primary, 26 context)
npm run test:all                 29 Python + 308 Vitest passed
$env:NOESIS_URL='http://127.0.0.1:5174/'; node scripts/research-consent-email-proof.mjs
  5 checkboxes; Turkish title; participant code N-...; contact absent from file; downloaded noesis-research-*.json; mailto draft; withdrawal disables sends; consoleErrors []
$env:NOESIS_URL='http://127.0.0.1:5174/'; node scripts/ui-audit.mjs <dir>
  consoleErrors []; no horizontal scroll; consent screen tinyText 0; only checkbox-in-label small target
python aikit.py check noesis     6/6 gates passed

npx vitest run tests/storage/adherence.test.ts tests/storage/export.test.ts tests/ui/settings-symptoms.test.tsx tests/ui/adherence-flow.test.tsx tests/ui/study-journey.test.tsx
  before fix: module missing / export.adherence undefined / summary absent
  after fix:  32 passed
python -m noesis review check    116 records validated (90 primary, 26 context)
npm run test:all                 29 Python + 318 Vitest passed
$env:NOESIS_URL='http://127.0.0.1:5174/'; node scripts/research-consent-email-proof.mjs
  adherence eventCount 1, firstStatus aborted, blocksCompleted 0 in the downloaded JSON; consent/email checks unchanged; consoleErrors []
$env:NOESIS_URL='http://127.0.0.1:5174/'; node scripts/ui-audit.mjs <dir>
  consoleErrors []; no horizontal scroll; settings summary visible; consent screen unchanged
python aikit.py check noesis     6/6 gates passed

npx vitest run tests/storage/csvExport.test.ts tests/ui/settings-symptoms.test.tsx
  before fix: csvExport module missing / CSV buttons absent
  after fix:  17 passed
npm run test:all                 29 Python + 325 Vitest passed
$env:NOESIS_URL='http://127.0.0.1:5174/'; node scripts/csv-export-proof.mjs
  sessions CSV header exact, 1 row, session-1 present; adherence CSV header exact, 1 row, completed present; consoleErrors []
$env:NOESIS_URL='http://127.0.0.1:5174/'; node scripts/ui-audit.mjs <dir>
  consoleErrors []; no horizontal scroll; CSV buttons >=44px; settings/consent audit unchanged
python aikit.py check noesis     6/6 gates passed

npx vitest run tests/storage/export.test.ts
  before fix: manifest undefined
  after fix:  12 passed
npm run test:all                 29 Python + 327 Vitest passed
$env:NOESIS_URL='http://127.0.0.1:5174/'; node scripts/research-consent-email-proof.mjs
  manifest appVersion 0.1.0, evidenceReview v1.1 (2026-11-08), dataDictionaryVersion 2026-11-08, consentVersion 1, counts adherence 1; consoleErrors []
python aikit.py check noesis     6/6 gates passed

npx vitest run tests/ui/practice-menu.test.tsx
  before fix: menu-adherence testid absent
  after fix:  6 passed
npm run test:all                 29 Python + 328 Vitest passed
$env:NOESIS_URL='http://127.0.0.1:5174/'; node scripts/ui-audit.mjs <dir>
  menu-history audited with adherence card; consoleErrors []; no horizontal scroll/tiny text
python aikit.py check noesis     6/6 gates passed

npx vitest run tests/engine/switching.test.ts tests/engine/session.test.ts tests/ui/mechanic-stage.test.tsx tests/ui/home.test.tsx tests/ui/practice-menu.test.tsx
  before fix: switching module/UI missing, 4-mechanic assumptions
  after fix:  all switching, focus-lineup and UI tests passed
npm run test:all                 29 Python + 335 Vitest passed
npm run ai:verify                500/500 deterministic simulations passed (5 mechanics)
$env:NOESIS_URL='http://127.0.0.1:5174/'; node scripts/switching-proof.mjs
  cue shape, options Circle/Square, correct answer feedback, briefing carries the EF claim, consoleErrors []
$env:NOESIS_URL='http://127.0.0.1:5174/'; node scripts/ui-audit.mjs <dir>
  citationReport count 15, allAtLeast44High true; consoleErrors []; no horizontal scroll/tiny text
python aikit.py check noesis     6/6 gates passed
```

## Cycle 12 — Task Switch resume and switch-cost interpretation

- **Area**: progression/saves plus Task Switch result readability.
- **FIND**: The new Task Switch had no end-to-end resume proof, and its result card showed a
  switch-cost number without explaining what it compares or that a negative value is possible.
- **ANALYZE**: `sessionSnapshot` had a hardcoded four-mechanic allow-list (fixed in the prior
  commit with `MECHANIC_IDS`); the adaptive loader now migrates old four-level states; the
  switching advance loop now crosses timeout, feedback and next-trial in one step. The result
  card needed one neutral explanatory line, not a new claim.
- **IMPLEMENT**: `scripts/switching-resume-proof.mjs` starts a Task Switch focus session from
  the Menu, drives trials, waits for the 1.5 s snapshot, reloads, resumes and completes all three
  blocks. `ResultsScreen` now prints the switch-cost definition and the negative-value case for
  switching results; CSS adds a subtle left rule. The candidate note records the same
  definition.
- **PROOF (resume)**: fixed clock seed 2721744568, adaptive switching level 3:
  mid-session `{phase running, block 0/3, mechanic switching, difficulty [3,3,3], trial 8,
  header "Block 1 of 3 · Level 3"}`; stored snapshot identical; after reload the button read
  `Resume session`; resumed state identical; completed 3/3 switching blocks at level 3 with
  24/24 correct each. Screenshots:
  `%TEMP%\opencode\noesis-switching-resume\01-task-switch-mid-session.png` (SHA-256
  `AD9166A561A2C383AD2AF0481CA34111E4EFD6C93427CE49977ADC92C6B4243F`) and
  `%TEMP%\opencode\noesis-switching-resume-after\03-task-switch-resumed.png` (SHA-256
  `ECB52910D2EB3E3ECBB05BFC5E0B03D134334371B0C50B9E8BD77CD160E688E1`).
  `consoleErrors []`.
- **PROOF (result note)**: same three-block Task Switch results screen before/after the copy
  change, viewport 390x844@2x:
  before `%TEMP%\opencode\noesis-switching-resume\04-task-switch-results.png` SHA-256
  `1A60FB81090CF27CBD35BAFEA026FC6D91CD6CF5B9B0314871DD2D2C78AA09BB`;
  after `%TEMP%\opencode\noesis-switching-resume-after\04-task-switch-results.png` SHA-256
  `73E83BDE0E235FA3E2F9998B2FDF8D4836A1FDA1159E0967EECC461CF285BFF9`.
  The after card explains switch cost and negative values; results otherwise show the same
  3 blocks, level 3, 24/24 correct. New test `tests/ui/switch-cost-note.test.tsx`.
- **GATES**: `npm run test:all` — 29 Python + 339 Vitest; `npm run ai:verify` — 500/500;
  `python aikit.py check noesis` — 6/6 gates passed.
- **COMMITS**: `2631d33` (persistence/migration/timing), `374aad1` (literature nuance), this
  commit (resume proof and switch-cost note).

## Cycle 13 — Level-aware Task Switch switch-cost trend in Menu History

- **Area**: Task Switch history readability, derived from the task-switching switch-cost
  evidence.
- **FIND**: Menu History listed each block and its summary, but it gave no aggregated view of
  switch cost, the main task-switching outcome, and averaging across levels would mix
  incomparable blocks.
- **ANALYZE**: Completed records already store `difficulty` and `metrics.switch_cost_ms`.
  Grouping by difficulty in the UI needs no engine, storage or scoring change. Levels are
  ordered by their most recent occurrence so the level the user just practised appears first.
- **IMPLEMENT**: `switchCostLevels` groups finite switch-cost values per level (last 10 values),
  orders levels by most recent block, and computes last/mean/lowest. `SwitchCostTrendLine`
  draws a small per-level SVG trend with a zero reference line. A History card shows one row per
  level with a block count, trend and the three statistics, plus the "lower is faster switching;
  negative values are possible; compare within a level" note. Tests in
  `tests/ui/practice-menu.test.tsx` cover level ordering, per-level values and the no-switching
  empty case. Added `scripts/switch-cost-trend-proof.mjs`.
- **PROOF (screenshots)**: seeded history with Task Switch results at levels 1-3, same
  390x844@2x viewport, same save; only the build differs.
  - before: `%TEMP%\opencode\noesis-switch-cost-trend-before\before-01-history-seeded.png`
    SHA-256 `5B2CEEACAD60A0EF280F71FC15EA3917437341954F520E8D33A59A953C4FE9CF`
    (no trend card)
  - after: `%TEMP%\opencode\noesis-switch-cost-trend-after\after-01-history-seeded.png`
    SHA-256 `ECBC2F3F2C10393B757B64F0B0C43389A8D5E1E922EC35608F28E89219513DB4`
    (Level 3: 2 blocks, last 200 ms, mean 190, lowest 180; Level 2: 2 blocks, 70/80/70;
    Level 1: 1 block, 50/50/50)
- **PROOF (played run)**: after the visual capture, the script started a real level-2 Task
  Switch focus session from the Menu and completed three blocks. The level-2 row updated from
  2 to 5 blocks (`last 0 ms, mean 23 ms, lowest -46 ms`), while Level 3 and Level 1 values stayed
  unchanged; level 2 moved to the top as the most recently practised level. Screenshot:
  `%TEMP%\opencode\noesis-switch-cost-trend-after\after-02-history-after-play.png` SHA-256
  `F57EDF4C613B4DC2A232715CBD9AF43C7C1FDF62AC35D3E919C9E738CCE7F100`.
  `consoleErrors []` before and after.
- **GATES**: `npm run test:all` — 29 Python + 341 Vitest; `npm run ai:verify` — 500/500;
  `python aikit.py check noesis` — 6/6 gates passed.
- **COMMIT**: this cycle's UI, test, proof script and record.

## Cycle 14 — Same-level switch-cost change indicator

- **Area**: Task Switch history readability, still within the same-level switch-cost evidence.
- **FIND**: The level-aware card showed a trend and last/mean/lowest values, but it did not say
  whether the latest block was better or worse than the previous block at that level. Cross-level
  comparisons would be invalid, so the direction must be computed within the row only.
- **IMPLEMENT**: `SwitchCostLevel` now carries `previous` and `delta`; each level row compares
  its two most recent values and renders one of `First block at this level`, `Improved N ms vs
  previous block at this level`, `Worsened +N ms ...` or `No change ...`, with color and a
  `data-direction` attribute. Tests assert the three states. The candidate note documents the
  same-level comparison.
- **PROOF (screenshots)**: seeded history levels 1-3, same 390x844@2x viewport:
  - before: `%TEMP%\opencode\noesis-switch-change-before\before-01-history-seeded.png` SHA-256
    `ECBC2F3F2C10393B757B64F0B0C43389A8D5E1E922EC35608F28E89219513DB4` (trend, no change line)
  - after: `%TEMP%\opencode\noesis-switch-change-after\after-01-history-seeded.png` SHA-256
    `313A81FCA08C2A8F772B86D105DBA2A13B2075436A01C5E3ECB8BB1C8C8CF13D`
    (Level 3 `Worsened +20 ms`, Level 2 `Improved 20 ms`, Level 1 `First block at this level`)
- **PROOF (played run)**: a real level-2 Task Switch focus session added three blocks; the final
  block deliberately advanced 300 ms on switch trials before answering. Level 2 updated to
  `5 blocks · last 300 ms · mean 91 ms · lowest -6 ms · Worsened +300 ms vs previous block at
  this level`; Level 3 (`Worsened +20 ms`) and Level 1 (`First block`) were unchanged. Screenshot:
  `%TEMP%\opencode\noesis-switch-change-after\after-02-history-after-play.png` SHA-256
  `5CAAFB9894726BB4A1E3455565645B04C506638B03F80896278A4B5AA3D24CA4`; `consoleErrors []`.
- **GATES**: `npm run test:all` — 29 Python + 341 Vitest; `npm run ai:verify` — 500/500;
  `python aikit.py check noesis` — 6/6 gates passed.
- **COMMIT**: this cycle's change indicator, test, proof script update and record.

## Cycle 15 — Same-level switch-cost delta on the result card

- **Area**: Task Switch result readability, completing the same-level comparison from History.
- **FIND**: The History row showed improved/worsened versus the previous same-level block, but the
  just-completed result card still showed only the raw switch cost. A user could see the delta in
  History but not on the screen where the block is reported.
- **IMPLEMENT**: `ResultsScreen` now receives `history` and computes `switch-cost comparisons`:
  prior sessions at the same level seed the previous value, then current-session blocks compare
  sequentially within their level. Each switching card shows `First block at this level`,
  `Improved N ms ... (previous → current ms)`, `Worsened +N ms ...`, or `No change ...`, with the
  matching color and `data-direction`. The comparison is per level only. Tests cover prior-history
  improvement and first-block copy; App passes history through.
- **PROOF (screenshots)**: real three-block level-3 Task Switch run, 390x844@2x, same seed
  2721744568:
  - before: `%TEMP%\opencode\noesis-switch-result-delta-before\before-04-task-switch-results.png`
    SHA-256 `73E83BDE0E235FA3E2F9998B2FDF8D4836A1FDA1159E0967EECC461CF285BFF9`
    (raw note only)
  - after: `%TEMP%\opencode\noesis-switch-result-delta-after\04-task-switch-results.png`
    SHA-256 `5949404294E2F7054F9DD32F941B54A019193897183F63DFB2DED4CA076B88BF`
    (`First block...`, `Improved 141 ms vs previous Level 3 block (141 → 0 ms)`,
    `No change vs previous Level 3 block (0 ms)`)
- **PROOF (played run)**: the proof resumed and completed all three level-3 blocks; the result
  cards reported switch costs `[141, 0, 0]` and the three delta states
  `first / improved / same`. The comparison uses only level 3; `consoleErrors []`. The same
  proof also re-confirmed mid-session reload/resume at block 0/3, trial 8.
- **GATES**: `npm run test:all` — 29 Python + 343 Vitest; `npm run ai:verify` — 500/500;
  `python aikit.py check noesis` — 6/6 gates passed.
- **COMMIT**: this cycle's result delta, tests, proof script update and record.

## Cycle 16 — Level-aware switch-cost last/trend on the Choose-a-test card

- **Area**: Task Switch test-selection card, completing the same-level switch-cost view across
  Choose, History and Results.
- **FIND**: The Task Switch card in Choose a test showed last/best accuracy and block count but
  not the switch-cost outcome, so a user choosing the test could not see the most recent
  same-level switch cost before starting.
- **IMPLEMENT**: `TestCard` reuses `switchCostLevels(history)` for the level of its latest block
  and renders `Switch cost L{level}: last N ms · previous → last ms · improved/worsened/no
  change`, or `first block at this level`. No new engine or storage state. Test asserts the
  exact Level 2 line and the empty case remains unchanged. The trend proof script now captures
  the Choose card before and after the real level-2 session.
- **PROOF (screenshots)**: seeded history with level 3 latest, same 390x844@2x viewport:
  - before: `%TEMP%\opencode\noesis-choose-card-before\before-00-choose-tests.png` SHA-256
    `D85A562777D788C20CA4E6149962EBCB1FAD98E7CE9E6A815D8F4E833C50BD12` (no switch-cost line)
  - after: `%TEMP%\opencode\noesis-choose-card-after\after-00-choose-tests.png` SHA-256
    `8021723697FA12090483514A0FAFBA1B1A516A4D5DAEAC0D9AA342C465C7C845`
    (`Switch cost L3: last 200 ms · 180 → 200 ms · worsened +20 ms`)
- **PROOF (played run)**: the proof played a real level-2 Task Switch focus session. The Choose
  card updated to `Switch cost L2: last 300 ms · 0 → 300 ms · worsened +300 ms` while Level 3
  and Level 1 remained unchanged; the History panel agreed. Screenshot:
  `%TEMP%\opencode\noesis-choose-card-after\after-03-choose-tests-after-play.png` SHA-256
  `FB5B2CB755CCFC83FA51967AB436D925B313C82A47A413640F64B37E09E454FE`;
  `consoleErrors []`.
- **GATES**: `npm run test:all` — 29 Python + 344 Vitest; `npm run ai:verify` — 500/500;
  `python aikit.py check noesis` — 6/6 gates passed.
- **COMMIT**: this cycle's card line, test, proof script capture and record.

## Cycle 17 — Experimental Flanker focus test from the literature matrix

- **Area**: new approach / literature matrix, candidate selected after evidence verification.
- **FIND**: The matrix listed Flanker as a standard interference-control candidate but not
  implemented. PubMed searches on 2026-11-08 (`flanker task` + training + meta-analysis/
  systematic review; `interference control training`; `Eriksen flanker`) found no eligible
  Flanker-specific cognitive-training meta-analysis. The broader executive-function training
  meta-analyses already in the table (PMID 30998045, 32011155) show small near-transfer effects
  in older adults; their titles, journals, years, DOIs and abstracts were verified earlier.
- **ANALYSE / DECISION**: Implement Flanker only as an experimental, claim-bounded focus test,
  not as a validated protocol and not in the default lineup. Recorded as ADR-046 and R64 because
  it is an explicit exception to the task-specific-evidence preference.
- **IMPLEMENT**: New deterministic `flanker` mechanic: five static arrows, centre left/right,
  congruent/incongruent flankers, Left/Right answers, accuracy, congruent/incongruent reaction
  times, interference cost, timeouts and streaks. Integrated into types, schema, simulation,
  evidence metadata, adaptive defaults, session UI, results metrics, AI CLI, menu card and
  tests. `npm run ai:verify` grows from 500 to 600 simulations.
- **PROOF (screenshots)**: same 390x844@2x viewport and fixed clock:
  - before Menu (no Flanker card):
    `%TEMP%\opencode\noesis-flanker-before\before-01-menu.png` SHA-256
    `D241BDEE87F707413DB80FF717F8183CDD893BA3F023106FE5CEDF871B0A03BD`
  - after Menu: `%TEMP%\opencode\noesis-flanker-after\after-01-menu.png` SHA-256
    `9005A72247E3377218D42B935CD140836E1E8C9911FAA502CC863DC807A704E3`
  - stage: `%TEMP%\opencode\noesis-flanker-after\after-02-flanker-stage.png` SHA-256
    `1EB6CF17FA4A095185F938A574EE9D148701CB88F39139753B4294D695A19828`
  - results: `%TEMP%\opencode\noesis-flanker-after\after-03-flanker-results.png` SHA-256
    `AC615893234868059EF0E1E623DBB568F957C100AD00DCF4C6BEFB170A37814C`
- **PROOF (played run)**: `scripts/flanker-proof.mjs` opened the Menu, started Flanker, read the
  briefing ("interference control"), played all three level-2 blocks correctly, and reported
  `mechanics ["flanker","flanker","flanker"]`, `difficulties [2,2,2]`, 20/20 correct each, and
  interference costs `[-71, 0, 0] ms`; `consoleErrors []`.
- **GATES**: `npm run test:all` — 29 Python + 350 Vitest; `npm run ai:verify` — 600/600;
  `python aikit.py check noesis` — 6/6 gates passed.
- **COMMIT**: this cycle's Flanker engine, UI, tests, evidence docs, proof and record.

## Cycle 18 — Flanker resume proof and interference-cost explanation

- **Area**: Flanker integration and result readability.
- **FIND**: The new Flanker mechanic had no end-to-end reload/resume proof, and the result card
  showed the interference-cost number without explaining its direction or negative values.
- **IMPLEMENT**: Added a failing-first `flanker-interference-note` test and result-card copy:
  `Interference cost = incongruent mean − congruent mean`, with the negative-value case and a
  "not a diagnosis" caveat. Added a Flanker snapshot round-trip test and
  `scripts/flanker-resume-proof.mjs`, which plays eight trials, waits for the snapshot, reloads,
  resumes and completes three blocks while capturing the result note.
- **PROOF (resume)**: fixed seed 2721744568, adaptive level 2:
  mid/stored/resumed all `block 0/3 · flanker · difficulty [2,2,2] · trial 8`;
  after reload the CTA read `Resume session`; the completed session was three level-2 blocks,
  20/20 correct each, interference `[104, 0, 0]`; `consoleErrors []`.
  Screenshot: `%TEMP%\opencode\noesis-flanker-resume-after\after-03-flanker-resumed.png`
  SHA-256 `98DA110CB9B138019829EB24E0863A454324361B9F66D22C51EE43B6CB0C635A`.
- **PROOF (result note)**: same three-block level-2 state before/after:
  - before: `%TEMP%\opencode\noesis-flanker-resume-before\before-04-flanker-results.png`
    SHA-256 `1C9A746260D0DF9CA7DE32CE77A548F54EFCF8CB56B5F095421F5AA22850F16F`
    (no interference explanation)
  - after: `%TEMP%\opencode\noesis-flanker-resume-after\after-04-flanker-results.png`
    SHA-256 `ED4706C082DA57F105172BA3D840693F308668E0883C2852FF159CBD3730D310`
    (interference note present; results remain 3 × level 2, 20/20)
- **GATES**: `npm run test:all` — 29 Python + 352 Vitest; `npm run ai:verify` — 600/600;
  `python aikit.py check noesis` — 6/6 gates passed.
- **COMMIT**: this cycle's note, tests, snapshot coverage, proof and record.

## Cycle 19 — Level-aware Flanker interference-cost trend in Choose and History

- **Area**: Flanker history readability, derived from the same interference-cost metric as the
  result note.
- **FIND**: Flanker results appeared in the Menu history list only as per-block summaries. The
  Choose-a-test card and History panel had no aggregated interference-cost view, and averaging
  across levels would compare incomparable blocks.
- **ANALYZE**: Completed records already store `difficulty` and
  `metrics.interference_cost_ms`. The existing level grouping and trend component were
  generalized to any mechanic/metric pair, so no engine, storage or scoring change was needed.
- **IMPLEMENT**: `costLevelsFor(history, mechanic, metricKey)` now backs both
  `switchCostLevels` and `flankerCostLevels`; `costLine` and `changeCopy` are shared. The Flanker
  Choose card shows `Interference cost L{level}: last N ms · previous → last ms ·
  improved/worsened/no change`. A History card with `flanker-cost-trend`,
  `flanker-cost-level-{level}` and `flanker-cost-change-{level}` uses
  `SwitchCostTrendLine metricLabel="interference cost"`. Three failing-first tests cover level
  ordering/values/change, the exact Choose-card line and the no-Flanker empty case.
- **PROOF (screenshots)**: seeded history with Flanker results at levels 1-3, same 390x844@2x
  viewport, same save; only the build differs.
  - before Choose: `%TEMP%\opencode\noesis-flanker-cost-trend-before\before-00-choose-tests.png`
    SHA-256 `2AB7679FE90DD8F8A1834DEBE6086983CFF8AA180B55772DF8F24DEF88E8B2CB`
    (no interference line)
  - before History: `%TEMP%\opencode\noesis-flanker-cost-trend-before\before-01-history-seeded.png`
    SHA-256 `BAAF092AA3F89D848BDCDE041036C23173C7D7D5C6812A6E424D3CA4520C4D4C`
    (no trend card)
  - after Choose: `%TEMP%\opencode\noesis-flanker-cost-trend-after\after-00-choose-tests.png`
    SHA-256 `10EE99E3A9B594EDFBFE86CB59B28D7EA938CE841F9565DCDC747E7F28F0B9E6`
    (`Interference cost L3: last 90 ms · 120 → 90 ms · improved 30 ms`)
  - after History: `%TEMP%\opencode\noesis-flanker-cost-trend-after\after-01-history-seeded.png`
    SHA-256 `89926A4583676121BC00C283B3632B5871EB2D2599EE966D13BF637F9863228B`
    (Level 3 improved 30 ms, Level 2 worsened +20 ms, Level 1 first block)
- **PROOF (played run)**: `scripts/flanker-cost-trend-proof.mjs` then played a real level-2
  Flanker focus session (three blocks). Deliberately slowing incongruent trials in the last
  block produced interference costs `[17, 0, 300] ms`. Level 2 updated to
  `5 blocks · last 300 ms · mean 91 ms · lowest 0 ms · worsened +300 ms`, moved to the top as
  the most recently practised level, and Level 3 / Level 1 stayed unchanged. The Choose card
  then read `Interference cost L2: last 300 ms · 0 → 300 ms · worsened +300 ms`.
  Screenshots: `%TEMP%\opencode\noesis-flanker-cost-trend-after\after-02-history-after-play.png`
  SHA-256 `7EF91E892A41DAED2BE8608409AC752B230A5594E60DD6F55457C9DBB75AEDD3` and
  `%TEMP%\opencode\noesis-flanker-cost-trend-after\after-03-choose-tests-after-play.png`
  SHA-256 `DC3C105A8FD2814ECB1D841355FE4960C74573364E7CEFD86C5C226D97D22D33`.
  `consoleErrors []` in both runs.
- **GATES**: `npm run test:all` — 29 Python + 355 Vitest; `npm run ai:verify` — 600/600;
  `python aikit.py check noesis` — 6/6 gates passed.
- **COMMIT**: this cycle's Flanker trend, tests, proof script and record.

## Cycle 20 — Same-level interference-cost delta on the Flanker result card

- **Area**: Flanker result readability, completing the same-level comparison across Choose,
  History and Results.
- **FIND**: The Flanker result card explained interference cost but did not compare the block
  with the previous Flanker block at the same level. History and Choose showed the comparison;
  the screen where the block is reported did not.
- **IMPLEMENT**: `ResultsScreen` now uses a shared `costComparisons` helper for both switch and
  interference cost. `costChange` produces one of first/improved/worsened/no-change copy.
  Each Flanker card shows `First block at this level; no earlier interference-cost
  comparison.`, `Improved N ms vs previous Level L block (previous → current ms).`,
  `Worsened +N ms ...`, or `No change ...` with `data-testid="flanker-cost-vs-previous-{index}"`
  and `data-direction`. Prior sessions at the same level seed the comparison; current-session
  blocks compare sequentially; levels are never mixed.
- **PROOF (screenshots)**: real three-block level-2 Flanker focus session with a mid-session
  reload, seed 2721744568, 390x844@2x:
  - before: `%TEMP%\opencode\noesis-flanker-result-delta-before\before-04-flanker-results.png`
    SHA-256 `71B4DEE792476AC2C2735199AE20168A30745CC9473A4A5231FA7D898837B4A2`
    (interference note only, no delta)
  - after: `%TEMP%\opencode\noesis-flanker-result-delta-after\after-04-flanker-results.png`
    SHA-256 `FBD1BF5CFD29FD63B9EEC2D461023597F326AED816A46649B1629BBCA088AEE2`
- **PROOF (played run)**: mid/stored/resumed remained block 0/3, Flanker, level 2, trial 8.
  Deliberately slowing incongruent trials in the first and last blocks produced interference
  costs `[161, 0, 300] ms` and the three delta states:
  - block 1: `First block at this level; no earlier interference-cost comparison.`
  - block 2: `Improved 161 ms vs previous Level 2 block (161 → 0 ms).`
  - block 3: `Worsened +300 ms vs previous Level 2 block (0 → 300 ms).`
  `consoleErrors []`. Tests also cover the `No change` and different-level cases
  (`tests/ui/flanker-result-note.test.tsx`, 6 tests).
- **GATES**: `npm run test:all` — 29 Python + 360 Vitest; `npm run ai:verify` — 600/600;
  `python aikit.py check noesis` — 6/6 gates passed.
- **COMMIT**: this cycle's result delta, tests, proof script update and record.

## Cycle 21 — Experimental Spatial Span focus test from verified Corsi evidence

- **Area**: new approach / literature matrix, candidate selected after targeted PubMed verification.
- **FIND**: The matrix listed spatial span/Corsi as an untested visuospatial working-memory
  candidate. A targeted 2026-11-08 PubMed search found Olegário et al. 2025 (PMID 37822255;
  *Psychology & Health*; 31 included trials, 13 in the meta-analysis): cognitive training
  improved Corsi Block working memory in healthy older adults (d=0.16, p=.002), while Digit Span
  backward and N-back were not significant. Melby-Lervåg and Hulme (2013, PMID 22612437) found
  short-term visuospatial near transfer with limited maintenance; their 2016 review (PMID
  27474138) found no convincing far transfer against treated controls. Metadata and DOIs for all
  records were verified via PubMed esummary.
- **ANALYSE / DECISION**: Implement a claim-bounded experimental Spatial Span focus test. The
  evidence supports visuospatial working-memory practice but not general intelligence, academic
  achievement, everyday function or a diagnostic interpretation. Recorded as ADR-047 and R65;
  the 2025 record was added to the evidence table as context, taking the review to 119 records,
  281 outcomes and revision v1.3.
- **IMPLEMENT**: Deterministic `spatial` mechanic: 3x3 grid, slow sequence presentation, recall
  by tapping in order, adaptive span 3/4/5 start and 2-8 bounds, wrong-tap trial termination,
  20 s recall window. Metrics: accuracy, mean span, longest correct span, timeouts, streaks.
  Integrated types, schema, simulation, evidence metadata, adaptive defaults, Menu, stage,
  keyboard, results, AI CLI and tests. `npm run ai:verify` grows from 600 to 700 simulations.
- **PROOF (screenshots)**: same 390x844@2x viewport and fixed clock:
  - before Menu (no Spatial Span card):
    `%TEMP%\opencode\noesis-spatial-before\before-01-menu.png` SHA-256
    `9005A72247E3377218D42B935CD140836E1E8C9911FAA502CC863DC807A704E3`
  - after Menu: `%TEMP%\opencode\noesis-spatial-after\after-01-menu.png` SHA-256
    `4C4A0F5258391C3B9C14793C2CCD21E0F5EC1FAD8A34586526E150AD9C35278A`
  - sequence presentation: `%TEMP%\opencode\noesis-spatial-after\after-02-spatial-show.png`
    SHA-256 `BF61FBAA1F4BC59E93F9A8DB7596D039958B01E963BAEB45C7F64527FDCE88D3`
  - results: `%TEMP%\opencode\noesis-spatial-after\after-03-spatial-results.png` SHA-256
    `8752029DDE75630DD4DDB7C6289C6A791891EB603FCF817CE1E1A8845A4A29D0`
- **PROOF (played run)**: `scripts/spatial-proof.mjs` opened the Menu, started Spatial Span, read
  the briefing, and completed three level-2 blocks: mechanics `["spatial","spatial","spatial"]`,
  difficulties `[2,2,2]`, each 100% accuracy, 8/8 correct, mean span 6.8, longest span 8;
  `consoleErrors []`.
- **GATES**: `npm run test:all` — 29 Python + 367 Vitest; `npm run ai:verify` — 700/700;
  `python aikit.py check noesis` — 6/6 gates passed.
- **COMMIT**: this cycle's Spatial Span engine, UI, evidence table, tests, proof and record.

## Cycle 22 — Level-aware Spatial Span mean/longest-span trend in Choose and History

- **Area**: Spatial Span history readability, using the mean and longest span already reported
  by the mechanic.
- **FIND**: Spatial Span results appeared only as per-block summaries. The Choose card and
  History panel had no aggregated span view, and averaging across levels would mix incomparable
  blocks. Span also needs the opposite direction from cost: higher is better.
- **IMPLEMENT**: Reused `costLevelsFor` for `mean_span` and added `spatialSpanLevels`, which also
  tracks the longest correctly recalled span per level. `SpanTrendCard` shows one row per level
  with a mean-span trend (`zeroBaseline={false}`), last mean, longest span and a same-level
  improved/worsened/no-change/first label. The Choose card shows
  `Spatial span L{level}: last mean N · longest N · improved/worsened/no change vs previous
  block`. Three failing-first tests cover level ordering/values/change, the exact Choose line and
  the no-Spatial empty case.
- **PROOF (screenshots)**: seeded spans at levels 1-3, 390x844@2x:
  - before Choose: `%TEMP%\opencode\noesis-spatial-trend-before\before-00-choose-tests.png`
    SHA-256 `794118659DEEE9F602D9A62DF4389B57CB7117687487944C0D712F36354601E7`
    (no span line)
  - before History: `%TEMP%\opencode\noesis-spatial-trend-before\before-01-history-seeded.png`
    SHA-256 `AC88850CCF1CC4AE753D7E80404A36F6ABCB9A1EDB16FF8DB43305AFAAA4B59F`
    (no span card)
  - after Choose: `%TEMP%\opencode\noesis-spatial-trend-after\after-00-choose-tests.png`
    SHA-256 `4C35784B0ABA89B0476572F906F148B3F61D348A543EB7692D3CBD743CF9481A`
    (`Spatial span L3: last mean 6.5 · longest 8 · improved +0.5 vs previous block`)
  - after History: `%TEMP%\opencode\noesis-spatial-trend-after\after-01-history-seeded.png`
    SHA-256 `635A46F61D527D5FC892B54C762B067A7181ABE49E17DA0F89E57B24F852DFA5`
    (Level 3 improved +0.5, Level 2 worsened -0.5, Level 1 first block)
- **PROOF (played run)**: `scripts/spatial-trend-proof.mjs` played a real level-2 Spatial Span
  focus session: three blocks, mean span `[6.8, 6.8, 6.8]`, longest span `[8, 8, 8]`. Level 2
  updated to 5 blocks with last mean 6.8 and longest 8, moved to the top as the most recently
  practised level, and reported `No change vs previous block` because the preceding block also
  averaged 6.8. Level 3 and Level 1 stayed unchanged. The Choose card then read
  `Spatial span L2: last mean 6.8 · longest 8 · no change vs previous block`.
  Screenshots: `after-02-history-after-play.png` SHA-256
  `EB87006F0EDE4D49022537D1BC302898D2E4242FD3D232F3B9C7EA3EA1B2762E` and
  `after-03-choose-tests-after-play.png` SHA-256
  `EC2BD53B243CB5C5E240491152D178F3A2844431BB6E1F56A875DC2F9BECB1DD`;
  `consoleErrors []`.
- **GATES**: `npm run test:all` — 29 Python + 370 Vitest; `npm run ai:verify` — 700/700;
  `python aikit.py check noesis` — 6/6 gates passed.
- **COMMIT**: this cycle's span trend, tests, proof script and record.

## Cycle 23 — Same-level mean-span delta on the Spatial Span result card

- **Area**: Spatial Span result readability, completing the same-level comparison across
  Choose, History and Results.
- **FIND**: The result card showed mean and longest span but did not compare the block with the
  previous Spatial Span block at the same level. Choose and History already did so.
- **IMPLEMENT**: `ResultsScreen` reuses `costComparisons` for `mean_span` and adds `spanChange`,
  where a higher delta is an improvement. Each Spatial Span card shows one of:
  `First block at this level; no earlier mean-span comparison.`,
  `Improved +N mean span vs previous Level L block (previous → current).`,
  `Worsened -N mean span ...`, or `No change ...`. It carries
  `data-testid="spatial-span-vs-previous-{index}"` and `data-direction`. Levels are never mixed.
- **PROOF (screenshots)**: real three-block level-2 Spatial Span session with seeded prior level-2
  mean 5.0, 390x844@2x:
  - before: `%TEMP%\opencode\noesis-spatial-delta-before\before-04-spatial-results.png`
    SHA-256 `8752029DDE75630DD4DDB7C6289C6A791891EB603FCF817CE1E1A8845A4A29D0`
    (no span delta)
  - after: `%TEMP%\opencode\noesis-spatial-delta-after\after-04-spatial-results.png`
    SHA-256 `BA37DB263509C95BFC230754584E0F0C44B5D6E27018FA379BC76825D49AD0B0`
- **PROOF (played run)**: the proof played three level-2 Spatial Span blocks with means
  `[6.8, 6.8, 6.8]` and longest span `[8, 8, 8]`. Deltas:
  - block 1: `Improved +1.8 mean span vs previous Level 2 block (5.0 → 6.8).`
  - blocks 2-3: `No change vs previous Level 2 block (6.8 mean span).`
  `consoleErrors []`. Tests also cover worsened, first-block and different-level cases
  (`tests/ui/spatial-result-delta.test.tsx`, 4 tests).
- **GATES**: `npm run test:all` — 29 Python + 374 Vitest; `npm run ai:verify` — 700/700;
  `python aikit.py check noesis` — 6/6 gates passed.
- **COMMIT**: this cycle's result delta, tests, proof and record.

## Cycle 24 — Spatial Span mid-session reload and resume proof

- **Area**: Spatial Span persistence and recovery, alongside the storage round-trip test.
- **FIND**: Spatial Span had a snapshot unit test but no browser-level proof that a real focus
  session survives reload and resumes with the same seed, block, level and trial.
- **IMPLEMENT**: `scripts/spatial-resume-proof.mjs` starts a level-2 Spatial Span focus session
  from the Menu, answers three trials, waits for the 1.5 s snapshot, reloads, presses
  **Resume session**, dismisses the re-shown briefing, verifies the restored state, completes all
  three blocks and captures mid/resumed/results screenshots and console errors.
- **PROOF**: fixed seed `2721744568`, adaptive spatial level 2:
  - mid: `block 0/3 · spatial · difficulty [2,2,2] · trial 3 · show`
    (`Block 1 of 3 · Level 2`)
  - stored snapshot: identical seed, block, mechanic, difficulty 2, trial 3, show
  - after reload: CTA `Resume session`
  - resumed: identical to mid, including `trial 3 · show`
  - completed: three level-2 blocks, 100% accuracy, 8/8 correct each, mean span 6.8,
    longest span 8; `consoleErrors []`
  - screenshots:
    `%TEMP%\opencode\noesis-spatial-resume\01-spatial-mid-session.png` SHA-256
    `FB94DD1BBF85A37518EABB7B9A2100D9A0BA40710BECE1D72CD10818A1E7742C`;
    `02-home-after-reload.png` SHA-256
    `7284965D2505877B139F859096D2C18A665C27166CE6497EED690F1137D6E3A8`;
    `03-spatial-resumed.png` SHA-256
    `968DE25ED97901D58B109D691CEACA65A1C608DEC7830684157D65DD32D99349`;
    `04-spatial-results.png` SHA-256
    `039057D5C561CABA2C0A8687327B22472BF03269F27F40B94DF10114118C99A3`.
- **GATES**: `npm run test:all` — 29 Python + 374 Vitest; `npm run ai:verify` — 700/700;
  `python aikit.py check noesis` — 6/6 gates passed.
- **COMMIT**: this cycle's resume proof and record.

## Cycle 25 — Experimental Mental Rotation focus test from verified spatial-training evidence

- **Area**: new approach / literature matrix, candidate selected after targeted PubMed verification.
- **FIND**: The matrix's remaining spatial candidate was mental rotation. Uttal et al. 2013
  (PMID 22663761; *Psychological Bulletin*; 217 training studies) found an average
  spatial-training effect of g=0.47, stable over delays and transferred to untrained spatial
  tasks. Hawes et al. 2022 (PMID 35073120; 29 studies, N=3,765, k=89) found spatial thinking
  g=0.49 and mathematics g=0.28, but concrete materials outperformed computerized training and
  near mathematics outcomes transferred more than distal ones. Sala and Gobet 2017 (PMID
  29276344) found far transfer rarely occurs. Metadata and DOIs were verified via esummary.
- **DECISION**: Implement a claim-bounded experimental Mental Rotation focus test. It claims
  spatial-task practice only; mathematics, academic, general-intelligence and everyday-function
  benefits are explicitly excluded, especially for computerized training. Recorded as ADR-048
  and R66; Uttal 2013 was added as a context record, taking the review to 120 records,
  282 outcomes and revision v1.4.
- **IMPLEMENT**: Deterministic `rotation` mechanic: two static block figures (L/S polyominoes),
  a right figure rotated 0/90/180/270 degrees or mirrored, Same/Mirrored answers, accuracy,
  same/mirror accuracy, mean response time, timeouts and streaks. Integrated types, schema,
  simulation, evidence metadata, adaptive defaults, Menu, stage, keyboard, results, AI CLI and
  tests. `npm run ai:verify` grows from 700 to 800 simulations.
- **PROOF (screenshots)**: same 390x844@2x viewport and fixed clock:
  - before Menu (no Mental Rotation card):
    `%TEMP%\opencode\noesis-rotation-before\before-01-menu.png` SHA-256
    `4C4A0F5258391C3B9C14793C2CCD21E0F5EC1FAD8A34586526E150AD9C35278A`
  - after Menu: `%TEMP%\opencode\noesis-rotation-after\after-01-menu.png` SHA-256
    `587E5B67E98674F52FD330595200F4727A77CE67F5A20304F800BF13A92E9126`
  - stage: `%TEMP%\opencode\noesis-rotation-after\after-02-rotation-stage.png` SHA-256
    `7FD4CD0A54AAADA65F099CEAA2E57D0E5273AC4C52F6E09C879F72CB9A81AA70`
  - results: `%TEMP%\opencode\noesis-rotation-after\after-03-rotation-results.png` SHA-256
    `274896CC88C0C58DDB214218C35EB2E0B6B9A30046AD446507EB9AE0AC83FAED`
- **PROOF (played run)**: `scripts/rotation-proof.mjs` opened the Menu, started Mental Rotation,
  read the briefing, and completed three level-2 blocks: mechanics
  `["rotation","rotation","rotation"]`, difficulties `[2,2,2]`, each 100% accuracy, 12/12
  correct, same/mirror accuracy 100%, mean response 450/400/400 ms; `consoleErrors []`.
- **GATES**: `npm run test:all` — 29 Python + 381 Vitest; `npm run ai:verify` — 800/800;
  `python aikit.py check noesis` — 6/6 gates passed.
- **COMMIT**: this cycle's rotation engine, UI, evidence table, tests, proof and record.

## Cycle 26 — Mental Rotation mid-session reload and resume proof

- **Area**: Mental Rotation persistence and recovery, alongside the storage round-trip test.
- **FIND**: Mental Rotation had a snapshot unit test but no browser-level proof that a real focus
  session survives reload and resumes with the same seed, block, level and trial.
- **IMPLEMENT**: `scripts/rotation-resume-proof.mjs` starts a level-2 Mental Rotation focus
  session from the Menu, answers three trials, waits for the 1.5 s snapshot, reloads, presses
  **Resume session**, dismisses the re-shown briefing, verifies the restored state, completes all
  three blocks and captures screenshots plus console errors.
- **PROOF**: fixed seed `2721744568`, adaptive rotation level 2:
  - mid: `block 0/3 · rotation · difficulty [2,2,2] · trial 3 · question`
    (`Block 1 of 3 · Level 2`)
  - stored snapshot: identical seed, block, mechanic, difficulty 2, trial 3, question
  - after reload: CTA `Resume session`
  - resumed: identical to mid, including `trial 3 · question`
  - completed: three level-2 blocks, 100% accuracy, 12/12 correct each, same/mirror accuracy
    100%, mean response 570/400/400 ms; `consoleErrors []`
  - screenshots:
    `%TEMP%\opencode\noesis-rotation-resume\01-rotation-mid-session.png` SHA-256
    `83DC770F9825FF930605C6B506A29DE05CC5834ABE7C1F3495E476FC53733074`;
    `02-home-after-reload.png` SHA-256
    `8FF5302641CC300BD1774B7236B1C828DA215C30DACC5BAF9F13E0257F2316C2`;
    `03-rotation-resumed.png` SHA-256
    `2E454C05A19D2CD44C38818BB9D3653CC5F76BC34B8DB0965C6507A6A9335742`;
    `04-rotation-results.png` SHA-256
    `F17C3779EEE253652C71DF33CF6E5CE91E265DEC5C54E75D02C84F3D7B5F076E`.
- **GATES**: `npm run test:all` — 29 Python + 381 Vitest; `npm run ai:verify` — 800/800;
  `python aikit.py check noesis` — 6/6 gates passed.
- **COMMIT**: this cycle's resume proof and record.

## Cycle 27 — Level-aware Mental Rotation accuracy and response-time trend

- **Area**: Mental Rotation history readability, using the accuracy and mean response time that
  the mechanic already reports.
- **FIND**: Mental Rotation results appeared only as per-block summaries. Choose and History had
  no aggregated view, and pooling levels would mix incomparable difficulty settings. The two
  metrics also point in opposite directions: higher accuracy is better, lower response time is
  better.
- **IMPLEMENT**: `rotationLevels` groups accuracy and mean response time per level in
  chronological order. `RotationTrendCard` shows one row per level with separate accuracy and
  response-time trend lines, last/best accuracy and last/mean response time. The Choose card
  shows `Mental rotation L{level}: last N% accuracy · RT N ms · best N%`. Three failing-first
  tests cover level ordering/values, the exact Choose line and the no-rotation empty case.
- **PROOF (screenshots)**: seeded rotation results at levels 1-3, 390x844@2x:
  - before Choose: `%TEMP%\opencode\noesis-rotation-trend-before\before-00-choose-tests.png`
    SHA-256 `ACB1B4817507FE5998A3828AD2C9E207F54F3D92FB58BEDAED6AFA3358F13314`
    (no rotation line)
  - before History: `%TEMP%\opencode\noesis-rotation-trend-before\before-01-history-seeded.png`
    SHA-256 `821BFBBF8018A28F748D9B68F43BE20ADEFBBC085B18B3E3DE9448E143658EBA`
    (no rotation card)
  - after Choose: `%TEMP%\opencode\noesis-rotation-trend-after\after-00-choose-tests.png`
    SHA-256 `9C0962E24C7EA97601F7206B5E61035229FF0C4FE5407B786EBA6C663C60E180`
    (`Mental rotation L3: last 100% accuracy · RT 400 ms · best 100%`)
  - after History: `%TEMP%\opencode\noesis-rotation-trend-after\after-01-history-seeded.png`
    SHA-256 `31479577BB761DDB58ECC3D831F86A9FAD83ABF5E2F9927690550452D9A8EB48`
    (Level 3 100%/400 ms, Level 2 90%/500 ms, Level 1 70%/700 ms)
- **PROOF (played run)**: `scripts/rotation-trend-proof.mjs` played a real level-2 Mental
  Rotation focus session: three blocks, accuracy `[1, 1, 1]`, mean response
  `[407, 400, 400]` ms. Level 2 updated to 5 blocks with last accuracy 100%, best 100%, last
  response 400 ms and mean 461 ms, moving to the top as the most recently practised level;
  Level 3 and Level 1 stayed unchanged. The Choose card then read
  `Mental rotation L2: last 100% accuracy · RT 400 ms · best 100%`.
  Screenshots: `after-02-history-after-play.png` SHA-256
  `E7FB164147B4203F86428D6A99F03C018E8CA686B3F6FE815E28CA0CBD12BB6B` and
  `after-03-choose-tests-after-play.png` SHA-256
  `CDEDABA170938D1C041EF81D7BBECFAFC6C2050B762EF6445B1A741E8623332E`;
  `consoleErrors []`.
- **GATES**: `npm run test:all` — 29 Python + 384 Vitest; `npm run ai:verify` — 800/800;
  `python aikit.py check noesis` — 6/6 gates passed.
- **COMMIT**: this cycle's rotation trend, tests, proof script and record.

## Cycle 28 — Same-level accuracy and response-time deltas on the Mental Rotation result card

- **Area**: Mental Rotation result readability, completing the same-level comparison across
  Choose, History and Results.
- **FIND**: The result card showed accuracy and mean response time but did not compare them with
  the previous Mental Rotation block at the same level. The two metrics point in opposite
  directions, so a single combined delta would be ambiguous.
- **IMPLEMENT**: `ResultsScreen` reuses `costComparisons` for accuracy and response time and adds
  `accuracyChange` (percentage points; higher is better) and `responseTimeChange` (ms; lower is
  better). Each card shows two lines with `data-testid="rotation-accuracy-vs-previous-{index}"`
  and `rotation-rt-vs-previous-{index}`, each with its own `data-direction`. Levels are never
  mixed; first-block, unchanged and cross-level cases are covered.
- **PROOF (screenshots)**: real three-block level-2 Mental Rotation session with seeded prior
  level-2 90% / 500 ms, 390x844@2x:
  - before: `%TEMP%\opencode\noesis-rotation-delta-before\before-04-rotation-results.png`
    SHA-256 `4725E25D83C1EED49F683341B540C2F7FE59A030FB0CBB188CC01DAD3B14F46A`
    (no result delta)
  - after: `%TEMP%\opencode\noesis-rotation-delta-after\after-04-rotation-results.png`
    SHA-256 `ABEDD1B5B04B92B090BD9CBD7967E358D414F60A182DB54EC81E4DC5B6E16018`
- **PROOF (played run)**: the proof played three level-2 blocks with accuracy `[1,1,1]` and
  mean response `[413, 400, 400]` ms. Deltas:
  - block 1: `Accuracy improved +10 pp ... (90% → 100%)` and
    `Response time improved 87 ms faster ... (500 → 413 ms)`
  - block 2: accuracy unchanged, response improved 13 ms
  - block 3: accuracy and response unchanged
  `consoleErrors []`. Four tests in `tests/ui/rotation-result-delta.test.tsx` cover
  improved/worsened/unchanged/first/cross-level.
- **GATES**: `npm run test:all` — 29 Python + 388 Vitest; `npm run ai:verify` — 800/800;
  `python aikit.py check noesis` — 6/6 gates passed.
- **COMMIT**: this cycle's result deltas, tests, proof and record.

## Cycle 29 — UFOV-like visual search and stop-signal: explicit out-of-scope decision

- **Area**: literature research / candidate triage, no product mechanic added.
- **FIND**: A 2026-11-08 targeted PubMed search evaluated the remaining candidate matrix
  entries. Edwards et al. 2018 (PMID 29175362) reviewed 44 UFOV-training studies from 17 RCTs:
  speed/attention and everyday-function gains, durable across ten years, adaptive better than
  non-adaptive, but no transfer to other neuropsychological outcomes. Woutersen et al. 2017
  (PMID 29270605) found the three UFOV subtests are not construct-pure. McGreen et al. 2024
  (PMID 38309625) meta-analysed 32 Go/No-Go and Stop-Signal studies and found a small
  appetitive-behaviour effect (g=-0.21), not cognitive-training transfer.
- **DECISION**: Do not implement a UFOV-like visual-search task or a separate stop-signal task.
  UFOV is a proprietary multi-subtest protocol; a simplified central/peripheral task would not
  be the validated intervention, and its brief adaptive presentation conflicts with the app's
  static no-flashing safety posture. Stop-signal duplicates the Go/No-Go inhibition construct
  and its training evidence is behaviour-change focused. Recorded as ADR-049; the candidate
  matrix and section 6 document the rationale and revisit conditions.
- **EVIDENCE**: PubMed esummary/efetch verified the titles, journals, years, authors and DOIs:
  29175362 (Neurosci Biobehav Rev, 2018, 10.1016/j.neubiorev.2017.11.004), 29270605 (J Vis,
  2017, 10.1167/17.14.11) and 38309625 (Appetite, 2024, 10.1016/j.appet.2024.107215).
  No evidence-table record was added; the review remains at 120 records and 282 outcomes.
- **GATES**: `npm run test:all` — 29 Python + 388 Vitest; `npm run ai:verify` — 800/800;
  `python aikit.py check noesis` — 6/6 gates passed.
- **COMMIT**: this cycle's scope note, ADR, search log and record.

## Cycle 30 — Experimental Prospective Memory focus test from verified meta-analysis

- **Area**: new approach / literature scan outside the exhausted matrix.
- **FIND**: A fresh 2026-11-08 scan found Tse et al. 2023 (PMID 35543836; *Neuropsychology
  Review*): 48 studies reviewed, 29 RCTs meta-analysed; prospective-memory training produced a
  moderate immediate effect (g=0.54) in older adults, but the long-term effect (g=0.20) was not
  significant and methodological quality varied. Prospective memory is a distinct construct not
  covered by the existing mechanics.
- **DECISION**: Implement a claim-bounded experimental Prospective Memory focus test. It claims
  delayed-intention practice only; no long-term, everyday-function or diagnostic benefit.
  Recorded as ADR-050 and R67; the 2023 record was added as context, taking the review to
  121 records, 283 outcomes and revision v1.5.
- **IMPLEMENT**: Deterministic `prospective` mechanic: a stream of letters is sorted as
  Vowel/Consonant, but a Q cue requires Remember instead. Metrics: overall accuracy, ongoing
  accuracy, cue trials/hits/misses, false alarms, mean response time, timeouts and streaks.
  Integrated types, schema, simulation, evidence metadata, adaptive defaults, Menu, stage,
  keyboard, results, AI CLI and tests. `npm run ai:verify` grows to 900 simulations.
- **PROOF (screenshots)**: same 390x844@2x viewport and fixed clock:
  - before Menu (no Prospective Memory card):
    `%TEMP%\opencode\noesis-prospective-before\before-01-menu.png` SHA-256
    `587E5B67E98674F52FD330595200F4727A77CE67F5A20304F800BF13A92E9126`
  - after Menu: `%TEMP%\opencode\noesis-prospective-after\after-01-menu.png` SHA-256
    `9F7AA45A80FDB510421800C28165E41A82FBEFF8896B302D8A4500E2CA7CA43A`
  - stage: `%TEMP%\opencode\noesis-prospective-after\after-02-prospective-stage.png` SHA-256
    `9115EBF99B8A0EE3386F1EDB666F20C7FCE75A8C947D9F03A02CB61DE45F82A5`
  - results: `%TEMP%\opencode\noesis-prospective-after\after-03-prospective-results.png` SHA-256
    `731193D8ACD6BD6D836847D80FB9D3B27A712A21683F7623842C7943CDB3F1EA`
- **PROOF (played run)**: `scripts/prospective-proof.mjs` opened the Menu, started Prospective
  Memory, read the briefing, and completed three level-2 blocks: 100% overall and ongoing
  accuracy, 4/4 cues remembered, 0 false alarms, mean response 430/400/400 ms;
  `consoleErrors []`.
- **GATES**: `npm run test:all` — 29 Python + 395 Vitest; `npm run ai:verify` — 900/900;
  `python aikit.py check noesis` — 6/6 gates passed.
- **COMMIT**: this cycle's prospective engine, UI, evidence table, tests, proof and record.

## Cycle 31 — Prospective Memory mid-session reload and resume proof

- **Area**: Prospective Memory persistence and recovery, alongside the storage round-trip test.
- **FIND**: Prospective Memory had a snapshot unit test but no browser-level proof that a real
  focus session survives reload and resumes with the same seed, block, level and trial.
- **IMPLEMENT**: `scripts/prospective-resume-proof.mjs` starts a level-2 Prospective Memory focus
  session from the Menu, answers three trials, waits for the 1.5 s snapshot, reloads, presses
  **Resume session**, dismisses the re-shown briefing, verifies the restored state, completes all
  three blocks and captures screenshots plus console errors.
- **PROOF**: fixed seed `2721744568`, adaptive prospective level 2:
  - mid: `block 0/3 · prospective · difficulty [2,2,2] · trial 3 · question`
    (`Block 1 of 3 · Level 2`)
  - stored snapshot: identical seed, block, mechanic, difficulty 2, trial 3, question
  - after reload: CTA `Resume session`
  - resumed: identical to mid, including `trial 3 · question`
  - completed: three level-2 blocks, 100% overall and ongoing accuracy, 4/4 cues remembered,
    0 false alarms each, mean response 491/400/400 ms; `consoleErrors []`
  - screenshots:
    `%TEMP%\opencode\noesis-prospective-resume\01-prospective-mid-session.png` SHA-256
    `70273BD651E1E0E8932BC11AB210DF69B2F276B3B72C5DC2B1DA4D6D8D0FC0B6`;
    `02-home-after-reload.png` SHA-256
    `4BB5D7318A98F10D263FC76DAFA6D77799295B89D39158C7F77A8F10F5716FE4`;
    `03-prospective-resumed.png` SHA-256
    `69B95DD91D40BFAA0E733EFE87A2687655CEEA60017D9DC8AB4D2A8CAB23DA2F`;
    `04-prospective-results.png` SHA-256
    `4FB36317F992BC47D7D3C4938D7C4B5A1F45C03F3955C622401FB212EC63057F`.
- **GATES**: `npm run test:all` — 29 Python + 395 Vitest; `npm run ai:verify` — 900/900;
  `python aikit.py check noesis` — 6/6 gates passed.
- **COMMIT**: this cycle's resume proof and record.

## Cycle 32 — Level-aware Prospective Memory trends and same-level result delta

- **Area**: Prospective Memory history and result readability.
- **FIND**: Prospective Memory had per-block summaries only. Choose and History had no
  aggregated view of ongoing accuracy, cue hits or false alarms, and the result card did not
  compare the block with the previous block at the same level.
- **IMPLEMENT**: `prospectiveLevels` groups ongoing accuracy, cue accuracy, cue hits and false
  alarms per level. `ProspectiveTrendCard` shows three separate trend lines per level with
  last/best ongoing accuracy, last cue hits/accuracy, and last/total false alarms. The Choose
  card shows `Prospective memory L{level}: ongoing N% · cues N/N · false alarms N`. The result
  card adds a same-level comparison covering ongoing accuracy, cue hits and false alarms with a
  composite direction. Three menu tests and four result tests cover the empty, first, improved,
  worsened and no-change cases.
- **PROOF (screenshots)**: seeded Prospective Memory results at levels 1-3, 390x844@2x:
  - before Choose: `%TEMP%\opencode\noesis-prospective-trend-before\before-00-choose-tests.png`
    SHA-256 `495B80F8F407996F84D880D3FE027E2F1741FBD8C4E0F5669D0817C001B6B4F6`
    (no line)
  - before History: `before-01-history-seeded.png` SHA-256
    `BEB13DC5AA187BD71FD5463AD1FE5658B91065F7EB06BF1135A3A1E22C2CBCC6`
    (no card)
  - before result: `before-04-prospective-results.png` SHA-256
    `DDA56C6A4521ACEA55A8BDCF53FEDC13CBE513F9BE4D6F26F9103E8349E3DEE6`
  - after Choose: `after-00-choose-tests.png` SHA-256
    `A49F212E77746C46C8580BD5EEE39A6A6E8D4509D249E45BE0FE1556A4768A34`
    (`Prospective memory L3: ongoing 100% · cues 4/4 · false alarms 0`)
  - after History: `after-01-history-seeded.png` SHA-256
    `0D4AA178C88411ED5960D8A3FA1B338725A4E1EE7641799E6674F9B7A3B1574A`
  - after result: `after-04-prospective-results.png` SHA-256
    `5AED2FE1C9F7AB8A1B6BB682E5326A2345821C86C3724843D52D71A028F9E516`
- **PROOF (played run)**: `scripts/prospective-trend-proof.mjs` played a real level-2 session
  with ongoing accuracy `[1,1,1]`, cue hits `[4,4,4]` and false alarms `[0,0,0]`. Deltas:
  - block 1: `Improved vs previous Level 2 block: ongoing 90% → 100% (+10 pp), cues 3/4 → 4/4, false alarms 1 → 0.`
  - blocks 2-3: `No change ...`
  Level 2 updated to 5 blocks with last ongoing 100%, cues 4/4, last false alarms 0 and total 2,
  and moved to the top. Choose read
  `Prospective memory L2: ongoing 100% · cues 4/4 · false alarms 0`.
  Screenshots: `after-02-history-after-play.png` SHA-256
  `05EEFFCAA379BA5AAF27D4FA61302EC4E9336552A711B42E2285AD6146EC99CB` and
  `after-03-choose-tests-after-play.png` SHA-256
  `60FC0028FAEF660C5F51C8274F911FDF9E9CC68640ED3E6FFB9E467CD786258E`;
  `consoleErrors []`.
- **GATES**: `npm run test:all` — 29 Python + 402 Vitest; `npm run ai:verify` — 900/900;
  `python aikit.py check noesis` — 6/6 gates passed.
- **COMMIT**: this cycle's trends, result delta, tests, proof and record.

## Cycle 33 — Experimental Paired Associates focus test from verified mnemonic-training evidence

- **Area**: new approach / fresh literature scan.
- **FIND**: A paired-associates / episodic-memory scan found Chen et al. 2022 (PMID 36301274;
  *Psychology and Aging*): 21 RCTs, 4,149 healthy older adults; mnemonic training improved
  episodic memory immediately (g=0.408) and at follow-up (g=0.418), with subjective-memory gains.
  Gross et al. 2012 (PMID 22423647; 35 studies, g=0.31) stayed narrative-only as broader
  memory-strategy evidence. The evidence is strategy-based, not the exact paired-associate task.
- **DECISION**: Implement a claim-bounded experimental Paired Associates focus test. It claims
  verbal episodic-memory practice only; no general-memory, academic, everyday-function or
  diagnostic benefit. Recorded as ADR-051 and R68; Chen 2022 was added as context, taking the
  review to 122 records, 284 outcomes and revision v1.6.
- **IMPLEMENT**: Deterministic `paired` mechanic: study a word pair, then choose its partner from
  four options. Metrics: accuracy, mean response time, timeouts and streaks. Integrated types,
  schema, simulation, evidence metadata, adaptive defaults, Menu, stage, keyboard, results, AI
  CLI and tests. `npm run ai:verify` grows to 1,000 simulations.
- **PROOF (screenshots)**: same 390x844@2x viewport and fixed clock:
  - before Menu (no Paired Associates card):
    `%TEMP%\opencode\noesis-paired-before\before-01-menu.png` SHA-256
    `9F7AA45A80FDB510421800C28165E41A82FBEFF8896B302D8A4500E2CA7CA43A`
  - after Menu: `%TEMP%\opencode\noesis-paired-after\after-01-menu.png` SHA-256
    `CD6A96B1ED52E1F06FD9CAA5E4E733725C0B180ACD181FF7178144AFF827E796`
  - study pair: `after-02-paired-study.png` SHA-256
    `45C606706AFA97D8EEEE24845C2EAF00068B01EA4D38A55A3C09431548EE2CB1`
  - results: `after-03-paired-results.png` SHA-256
    `B85DCDA848EC4CD98FD78F2884B142758883712707A1C2CD1D63774B7594323B`
- **PROOF (played run)**: `scripts/paired-proof.mjs` opened the Menu, started Paired Associates,
  read the briefing, and completed three level-2 blocks: 100% accuracy, 12/12 correct, mean
  response 1,333/1,300/1,300 ms; `consoleErrors []`.
- **GATES**: `npm run test:all` — 29 Python + 409 Vitest; `npm run ai:verify` — 1,000/1,000;
  `python aikit.py check noesis` — 6/6 gates passed.
- **COMMIT**: this cycle's paired engine, UI, evidence table, tests, proof and record.

## Cycle 34 — Paired Associates mid-session reload and resume proof

- **Area**: Paired Associates persistence and recovery, alongside the storage round-trip test.
- **FIND**: Paired Associates had a snapshot unit test but no browser-level proof that a real
  study/test focus session survives reload and resumes with the same seed, block, level and
  trial.
- **IMPLEMENT**: `scripts/paired-resume-proof.mjs` starts a level-2 Paired Associates focus
  session from the Menu, answers three study/test trials, waits for the 1.5 s snapshot, reloads,
  presses **Resume session**, dismisses the re-shown briefing, verifies the restored state,
  completes all three blocks and captures screenshots plus console errors.
- **PROOF**: fixed seed `2721744568`, adaptive paired level 2:
  - mid: `block 0/3 · paired · difficulty [2,2,2] · trial 3 · study`
    (`Block 1 of 3 · Level 2`)
  - stored snapshot: identical seed, block, mechanic, difficulty 2, trial 3, study
  - after reload: CTA `Resume session`
  - resumed: identical to mid, including `trial 3 · study`
  - completed: three level-2 blocks, 100% accuracy, 12/12 correct each, mean response
    428/400/400 ms; `consoleErrors []`
  - screenshots:
    `%TEMP%\opencode\noesis-paired-resume\01-paired-mid-session.png` SHA-256
    `7058157F4718B82962BF81C7912F8ADB1CF649FE7BA81731DBBBCFF7927E5E3B`;
    `02-home-after-reload.png` SHA-256
    `991B16366F124D3C406B6F1FDA3005469E3E585B392A64FB63EBA80647B834D1`;
    `03-paired-resumed.png` SHA-256
    `0217C0CC06735013116C50AD17F7E8F8D216A4F6FBA029DED13C698FC3627114`;
    `04-paired-results.png` SHA-256
    `C47E3E8F085DE293C286651B1234DFE135E9E679D8FBCEF0F1A4BA0C809328B8`.
- **GATES**: `npm run test:all` — 29 Python + 409 Vitest; `npm run ai:verify` — 1,000/1,000;
  `python aikit.py check noesis` — 6/6 gates passed.
- **COMMIT**: this cycle's resume proof and record.

## Cycle 35 — Level-aware Paired Associates trends and same-level result delta

- **Area**: Paired Associates history and result readability.
- **FIND**: Paired Associates had per-block summaries only. Choose and History had no aggregated
  view of accuracy or response time, and the result card did not compare with the previous block
  at the same level.
- **IMPLEMENT**: Generalised the rotation helper to `dualMetricLevels(history, mechanic)` and
  `DualMetricTrendCard`. Paired Associates now shows a level-aware accuracy and response-time
  trend in History and `Paired associates L{level}: last N% accuracy · RT N ms · best N%` on the
  Choose card. The result card adds separate same-level accuracy and response-time deltas with
  `paired-accuracy-vs-previous-{index}` and `paired-rt-vs-previous-{index}`. Three menu tests and
  four result tests cover the empty, first, improved, worsened and no-change cases.
- **PROOF (screenshots)**: seeded Paired Associates results at levels 1-3, 390x844@2x:
  - before Choose: `%TEMP%\opencode\noesis-paired-trend-before\before-00-choose-tests.png`
    SHA-256 `CBE5C090A849ABCDACA54BAF8F1BBEB9043C04425FAED2AA26131FF3545BDE13`
    (no line)
  - before History: `before-01-history-seeded.png` SHA-256
    `FC7BB5EC258811418C6A83A8D06F9556ABE6AD33497FAEB1703AE99C8F52B838`
    (no card)
  - before result: `before-04-paired-results.png` SHA-256
    `D4D38AA63999AF69063F01F39572FA4229969551678163941E6EBADC82464280`
  - after Choose: `after-00-choose-tests.png` SHA-256
    `BC7581FE93F3E1FAE4639FB450C3558552AA9102E6E02308DEEC8BBAF41BED34`
    (`Paired associates L3: last 100% accuracy · RT 400 ms · best 100%`)
  - after History: `after-01-history-seeded.png` SHA-256
    `F59F93F50485E22E1543C4E5BEB3B4AB93017DB5147A9CC7C025B51C9FD3DA8C`
  - after result: `after-04-paired-results.png` SHA-256
    `D609004E38726950DEA575C6B532C878130C0DE33D74E360C57336C063085198`
- **PROOF (played run)**: `scripts/paired-trend-proof.mjs` played a real level-2 session with
  accuracy `[1,1,1]` and mean response `[416,400,400]` ms:
  - block 1: accuracy improved +10 pp (90% → 100%); response improved 84 ms faster (500 → 416 ms)
  - block 2: accuracy unchanged; response improved 16 ms faster
  - block 3: both unchanged
  Level 2 updated to 5 blocks with last accuracy 100%, last response 400 ms and mean 463 ms, and
  moved to the top. Choose read
  `Paired associates L2: last 100% accuracy · RT 400 ms · best 100%`.
  Screenshots: `after-02-history-after-play.png` SHA-256
  `5E7354F2BC2EAD20FC4386999B96B0952FA426B5F1C92C4F896190E501D7267C` and
  `after-03-choose-tests-after-play.png` SHA-256
  `6E16B5A85D9459ABFACF55BEF232C62A532F925026BB53D3652E49C92F070D29`;
  `consoleErrors []`.
- **GATES**: `npm run test:all` — 29 Python + 416 Vitest; `npm run ai:verify` — 1,000/1,000;
  `python aikit.py check noesis` — 6/6 gates passed.
- **COMMIT**: this cycle's trends, result deltas, tests, proof and record.

## Cycle 36 — Dual-task scope decision and Paired Associates strategy hint

- **Area**: literature scan plus a small evidence-backed UX improvement.
- **FIND**: A fresh dual-task scan found Gao and Liu 2025 (PMID 40410069; cognitive-motor
  dual-task training improved gait, balance, executive function and fall risk in community older
  adults) and Hao et al. 2025 (PMID 40304821; 32 RCTs in MCI/dementia; dual cognitive-task
  training best for global cognition). Both are clinical or motor-cognitive populations, not
  healthy-adult screen-based cognitive training. Chen et al. 2022 (PMID 36301274) supports
  mnemonic strategy training, so an optional strategy hint is a direct fit for Paired Associates.
- **DECISION**: No dual-task mechanic; the app is sedentary and screen-only, and a meaningful
  protocol would need a motor or continuous tracking component with unresolved safety and
  measurement issues (ADR-052). Add a collapsed **Strategy tip** to the Paired Associates study
  screen: link the two words in a vivid image or short sentence. Optional, no scoring change, no
  validated-protocol or far-transfer claim.
- **IMPLEMENT**: `PairedStage` renders the hint during study; a failing-first MechanicStage test
  checks the `paired-strategy-hint` test id and copy. The candidate note and search log record the
  dual-task decision; no evidence-table counts changed.
- **PROOF (screenshots)**: same 390x844@2x viewport and fixed clock:
  - before study screen (no hint): `%TEMP%\opencode\noesis-paired-hint-before\before-02-paired-study.png`
    SHA-256 `45C606706AFA97D8EEEE24845C2EAF00068B01EA4D38A55A3C09431548EE2CB1`
  - after study screen with the hint expanded:
    `%TEMP%\opencode\noesis-paired-hint-after\after-02-paired-study.png` SHA-256
    `1FF32DDD839487FD0B9D5B138F98D0B38B7C75F152C1E5F1045616BCCD479415`
- **PROOF (played run)**: `scripts/paired-proof.mjs` completed three level-2 Paired Associates
  blocks with 100% accuracy, 12/12 correct each and mean response 1,346/1,300/1,300 ms;
  `consoleErrors []`.
- **GATES**: `npm run test:all` — 29 Python + 417 Vitest; `npm run ai:verify` — 1,000/1,000;
  `python aikit.py check noesis` — 6/6 gates passed.
- **COMMIT**: this cycle's hint, tests, scope note, proof and record.

## Cycle 37 — Verbal-fluency/face-name scope decision and Paired Associates briefing hint

- **Area**: fresh candidate scan plus a small UX improvement.
- **FIND**: No eligible verbal-fluency training meta-analysis was found; fluency is usually an
  outcome, and open-ended generation cannot be scored deterministically without a validated
  dictionary and semantic rater. Kelly et al. 2014 (PMID 24607830; 31 RCTs, 1,806
  cognitive-training participants) reported face-name recall (p=0.02) and paired associates
  (p=0.001) gains versus no intervention, but this is not an active-control face-name training
  meta-analysis and a proper face-name task needs a validated face stimulus set with privacy and
  consent handling. Paired Associates already covers verbal associative memory.
- **DECISION**: No verbal-fluency or face-name mechanic (ADR-053). Surface the existing Paired
  Associates mnemonic hint in the pre-test briefing as an optional Strategy tip, in addition to
  the study screen. No scoring change; no validated-protocol or far-transfer claim.
- **IMPLEMENT**: optional `strategyHint` on `MechanicMeta`, set for Paired Associates;
  `TestBriefing` renders `briefing-strategy`; a failing-first briefing test checks the copy.
  `paired-proof.mjs` captures the briefing and reports the hint.
- **PROOF (screenshots)**: same 390x844@2x viewport and fixed clock:
  - before briefing (no hint): `%TEMP%\opencode\noesis-paired-briefing-before\before-00-briefing.png`
    SHA-256 `7EBAE5429F98C40573E6BDC575758F604943BED4175A47B93FBCA64E24C01764`
  - after briefing (hint present): `%TEMP%\opencode\noesis-paired-briefing-after\after-00-briefing.png`
    SHA-256 `CCEEABD6D637282A903B11D6A1F119851590F778DF7CDC76C1156DAC340076FE`
  (the study-screen before/after from cycle 36 remain valid)
- **PROOF (played run)**: `scripts/paired-proof.mjs` completed three level-2 Paired Associates
  blocks with 100% accuracy, 12/12 correct each and mean response 1,346/1,300/1,300 ms;
  `consoleErrors []`.
- **GATES**: `npm run test:all` — 29 Python + 418 Vitest; `npm run ai:verify` — 1,000/1,000;
  `python aikit.py check noesis` — 6/6 gates passed.
- **COMMIT**: this cycle's briefing hint, test, scope note, proof and record.

## Cycle 38 — Metacognition scan and optional confidence check

- **Area**: literature scan plus a metacognitive awareness prompt.
- **FIND**: No confidence-calibration training meta-analysis exists. Sella et al. 2023 (PMID
  36218025; 25 studies, 1,768 older adults) found metacognitive training improved memory (d=0.52)
  and strategic metacognitive training improved memory (d=0.44), metacognitive beliefs and
  strategy use, but methodological quality was limited. A single confidence rating is a
  monitoring prompt, not the multi-session training those trials evaluated.
- **DECISION**: Add an optional **Confidence check** to the pre-test briefing (Low/Medium/High)
  and repeat the selected level on the result card with an explicit note that it is a
  reflection, not scored and not a diagnostic calibration. No new mechanic or evidence-table
  record; recorded in ADR-054 and section 6.5.
- **IMPLEMENT**: optional `Confidence` type; App state keyed by block; SessionScreen passes it to
  TestBriefing; ResultsScreen renders `confidence-note-{index}`. Failing-first tests cover the
  briefing buttons and the result note.
- **PROOF (screenshots)**: same 390x844@2x viewport and fixed clock:
  - before briefing: `%TEMP%\opencode\noesis-confidence-before\before-01-briefing.png` SHA-256
    `CCEEABD6D637282A903B11D6A1F119851590F778DF7CDC76C1156DAC340076FE`
  - after briefing with High selected:
    `%TEMP%\opencode\noesis-confidence-after\after-01-briefing.png` SHA-256
    `D66BD6B205078CAAB381750444DFCF7277CDEC1A33E9377B99A18C43687141E0`
  - before results: `before-02-results.png` SHA-256
    `63DC99559795B0BF305D87152CB870FDD32BD38EDE0A00ED749E13B42C73399D`
  - after results: `after-02-results.png` SHA-256
    `67D2D7622759533D855F5B29054E8C34E441F2B83E938C20679EB93A091E63BC`
- **PROOF (played run)**: `scripts/confidence-proof.mjs` selected High in the Paired Associates
  briefing and completed three level-2 blocks; the first result carried
  `Confidence: High. This is an optional reflection, not scored and not a diagnostic
  calibration.`; `consoleErrors []`.
- **GATES**: `npm run test:all` — 29 Python + 421 Vitest; `npm run ai:verify` — 1,000/1,000;
  `python aikit.py check noesis` — 6/6 gates passed.
- **COMMIT**: this cycle's confidence check, tests, scope note, proof and record.

## Cycle 39 — Persist confidence and summarize it in Menu History

- **Area**: metacognitive check persistence and history readability.
- **FIND**: The confidence check was held only in React state. It was lost on reload, never
  attached to the completed block, and Menu History could not compare confidence with accuracy.
- **IMPLEMENT**: `SessionState` now carries `confidenceByBlock`; a `confidence` session action
  stores the choice; `completeBlock` attaches it to the `MechanicResult`; the snapshot migration
  fills missing arrays with nulls; `ResultsScreen` reads `result.confidence`. Menu History adds a
  `confidence-summary` card grouped by mechanic and level with mean accuracy and block count per
  Low/Medium/High bucket. Sessions CSV gains a `confidence` column; the data dictionary documents
  it.
- **PROOF (screenshots)**: same 390x844@2x viewport and fixed clock:
  - before resumed briefing loses selection:
    `%TEMP%\opencode\noesis-confidence-persist-before\before-02-resumed-briefing.png` SHA-256
    `900A605F230AC600D2317CFA466426D140753377B40B01528A85B3B5144B01A8`
  - after resumed briefing keeps High:
    `%TEMP%\opencode\noesis-confidence-persist-after\after-02-resumed-briefing.png` SHA-256
    `28D62B97EB724C04A88A1B05F8224717B4B75CF46E5838FB22E15D390E3D604B`
  - before results (no note): `before-02-results.png` SHA-256
    `54AEC57638B57B9F5D29D39DE5E1E320B2FE9E646D608B46280354E5A206C67F`
  - after results (three notes): `after-02-results.png` SHA-256
    `D674DBB438CE157C92BB9B32D071220F711633AFC16DA6E6D7929A573C872043`
  - before History (no summary): `before-03-history.png` SHA-256
    `62BD364DE582AD959BF85E9DA7E67B888DB1AA30D0F9E701586F742C53FA5D81`
  - after History: `after-03-history.png` SHA-256
    `8E61FE61FBAD445CA624987A88389447A4B897548D167DED70C6A690F084B8C4`
- **PROOF (played run)**: `scripts/confidence-proof.mjs` selected High, waited for the snapshot,
  reloaded, verified the selection persisted, completed three level-2 Paired Associates blocks,
  and read `Confidence: High...` on all three results and
  `Paired Associates L2: High 100% (3 blocks)` in Menu History; `consoleErrors []`.
- **GATES**: `npm run test:all` — 29 Python + 426 Vitest; `npm run ai:verify` — 1,000/1,000;
  `python aikit.py check noesis` — 6/6 gates passed.
- **COMMIT**: this cycle's persistence, summary, tests, proof and record.

## Cycle 40 — Experimental Change Detection focus test

- **Area**: new approach / fresh visual working-memory scan.
- **FIND**: The targeted visual working-memory search found no eligible change-detection
  training meta-analysis. The broader working-memory/executive-function training meta-analyses
  already in the corpus (PMID 30998045, 32011155) show short-term near transfer but no convincing
  far transfer. Change detection is a standard visual working-memory paradigm distinct from
  N-back updating and Spatial Span sequencing.
- **DECISION**: Add an experimental **Change Detection** focus test with an explicit
  task-specific evidence exception (R69, ADR-055). Claim visual working-memory practice only; no
  general-memory, academic, everyday-function or diagnostic claim. No evidence-table record was
  added; the review remains at 122 records and 284 outcomes.
- **IMPLEMENT**: Deterministic `change` mechanic: a brief coloured array, a delay, then the same
  array with one changed square; user taps the changed square. Set size 4/5/6 by level; metrics
  accuracy, set size, response time, timeouts and streaks. Integrated types, schema, simulation,
  evidence metadata, adaptive defaults, Menu, stage, keyboard, results, AI CLI and tests.
  `npm run ai:verify` grows to 1,100 simulations.
- **PROOF (screenshots)**: same 390x844@2x viewport and fixed clock:
  - before Menu (no Change Detection card):
    `%TEMP%\opencode\noesis-change-before\before-01-menu.png` SHA-256
    `CD6A96B1ED52E1F06FD9CAA5E4E733725C0B180ACD181FF7178144AFF827E796`
  - after Menu: `%TEMP%\opencode\noesis-change-after\after-01-menu.png` SHA-256
    `DF0C9F1F4ADBC4E59EAF5FAD538D8A91A00B7EFF79B678CDA09B4532C70140B2`
  - stage: `after-02-change-stage.png` SHA-256
    `22E7D1FE54AD0DACFAC68119EF8BB34FFF79E53E7884B89ADA64691F8C7B5A3E`
  - results: `after-03-change-results.png` SHA-256
    `7D1D523993EB2C3D23BFE6146EBDCDA87D70E44BE9BB587F920CAA335A541EFF`
- **PROOF (played run)**: `scripts/change-proof.mjs` opened the Menu, started Change Detection,
  read the briefing, and completed three level-2 blocks: 100% accuracy, 12/12 correct each,
  set size 5, mean response 414/400/400 ms; `consoleErrors []`.
- **GATES**: `npm run test:all` — 29 Python + 433 Vitest; `npm run ai:verify` — 1,100/1,100;
  `python aikit.py check noesis` — 6/6 gates passed.
- **COMMIT**: this cycle's change engine, UI, evidence docs, tests, proof and record.

## Cycle 41 — Change Detection resume proof and level-aware trends

- **Area**: Change Detection persistence, history readability and same-level result comparison.
- **FIND**: The new Change Detection task had only a storage round-trip test, and neither the
  Choose card nor History aggregated accuracy, set size or response time. The result card did
  not compare a block with the previous block at the same level.
- **IMPLEMENT**: `scripts/change-resume-proof.mjs` plays three trials, stops on the next 8 s
  test window, waits for the snapshot, reloads, resumes and completes three level-2 blocks.
  `changeLevels` groups accuracy and mean response time per level and carries the set size;
  `ChangeTrendCard` renders `change-trend`, `change-level-{n}`, `change-accuracy-{n}`,
  `change-set-size-{n}` and `change-rt-{n}`. The Choose card shows
  `Change detection L{n}: last N% accuracy · set N · RT N ms · best N%`. The result card adds
  same-level accuracy and response-time deltas with `change-accuracy-vs-previous-{index}` and
  `change-rt-vs-previous-{index}`.
- **PROOF (resume)**: fixed seed `2721744568`, adaptive change level 2. Mid, stored and resumed
  were identical: `block 0/3 · change · difficulty [2,2,2] · trial 3 · test`, header
  `Block 1 of 3 · Level 2`; CTA `Resume session`; completed three level-2 blocks at 100%
  accuracy, 12/12 correct, set size 5, mean response 540/400/400 ms; `consoleErrors []`.
  Screenshots: `%TEMP%\opencode\noesis-change-resume\01-change-mid-session.png` SHA-256
  `B6B5C3CB93B9F9973B8067A7E406E9CAE235EEBB6E0E4557A8F306EC347DDAD1`;
  `02-home-after-reload.png` SHA-256
  `38AD72B4FEF961839E697AA9592297CE37D5DCF37C6B94E84D14B37E03BDD7CE`;
  `03-change-resumed.png` SHA-256
  `C3D25220535CF524F946F1F2DED8420F30C799226D63EC0DE68EA62590011333`;
  `04-change-results.png` SHA-256
  `2749AFE4D168F5B541D3046D29E59810784E76077ECCFB9548E39CD81ACBDE5B`.
- **PROOF (trend)**: seeded Change Detection results at levels 1-3, 390x844@2x.
  - before Choose: `%TEMP%\opencode\noesis-change-trend-before\before-00-choose-tests.png`
    SHA-256 `F1FC3B3194C16F76D237100C9249976156B01247986769F8B74C72E8F773090F` (no line)
  - before History: `before-01-history-seeded.png` SHA-256
    `70EF707BB3E786B7B62862235DEB292A87B45C6B16C1FF5C5AC241FDAB15245E` (no card)
  - before result: `before-04-change-results.png` SHA-256
    `8FB36712AB7F2239772BB370EAFA4A1103B4AA0FA942C33C0C127A2AE7B226C2` (no delta)
  - after Choose: `after-00-choose-tests.png` SHA-256
    `DCA316D641FDBA925EB4EF4983861A926D656A14345897E287EF680D5FFAE695`
    (`Change detection L3: last 100% accuracy · set 6 · RT 400 ms · best 100%`)
  - after History: `after-01-history-seeded.png` SHA-256
    `FF4A367A3566477F6C63DD8DC12D148F9CD286B01FBA61CE422D57B1C039888C`
    (Level 3 100%/set 6/400 ms, Level 2 90%/set 5/500 ms, Level 1 70%/set 4/700 ms)
  - after result: `after-04-change-results.png` SHA-256
    `99AA3BD2C50139508AB8D0D97EE7BCBD66B200B52B4FFB659738A5F5CEE93E50`
- **PROOF (played run)**: `scripts/change-trend-proof.mjs` played a real level-2 session with
  accuracy `[1,1,1]`, set sizes `[5,5,5]` and mean response `[416,400,400]` ms. Deltas:
  - block 1: accuracy improved +10 pp (90% → 100%); response improved 84 ms faster (500 → 416 ms)
  - block 2: accuracy unchanged; response improved 16 ms faster (416 → 400 ms)
  - block 3: accuracy and response unchanged
  Level 2 updated to 5 blocks with last accuracy 100%, set size 5, last response 400 ms and mean
  463 ms, and moved to the top. Choose read
  `Change detection L2: last 100% accuracy · set 5 · RT 400 ms · best 100%`.
  Screenshots: `after-02-history-after-play.png` SHA-256
  `9590712AC5CEAC4B171480626E052F11D1D8A3B35921ED7B2EB06F96B3497790` and
  `after-03-choose-tests-after-play.png` SHA-256
  `C6B3F4C3528EB5407A57971F6342C7AC5A2C28D48FDCEEEEFA64849093E7EB4C`;
  `consoleErrors []`.
- **GATES**: `npm run test:all` — 29 Python + 440 Vitest; `npm run ai:verify` — 1,100/1,100;
  `python aikit.py check noesis` — 6/6 gates passed.
- **COMMIT**: this cycle's resume proof, trends, result deltas, tests, proofs and record.
