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

Open candidates (not yet cycles): claim badges at 11.52px; `1 impulse errors` summary pluralization.

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
```
