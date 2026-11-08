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
