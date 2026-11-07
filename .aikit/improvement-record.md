# Continuous Improvement Record

One entry per improvement cycle. The rotation covers combat feel, enemies/bosses, levels, UI
readability, graphics and effects, audio cues, progression and saves; for Noesis these map to
mechanic feel, session structure, difficulty/adaptation, UI readability, graphics and effects,
audio cues (none shipped by design) and progression/saves. One area per cycle.

Covered so far:

1. Progression and saves — 2026-11-07 — cycle 1 (this entry)

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
- **COMMANDS**: see "Commands run" below.
- **STATUS**: committed with the cycle; next area is UI readability.

## Commands run

```text
npx vitest run tests/ui/resume-motivation.test.tsx
  before fix: 1 failed (expected 36 to be 18)
  after fix:  1 passed
$env:NOESIS_URL='http://127.0.0.1:5174/'; node scripts/resume-proof.mjs before <dir>
  200 shown vs 100 saved; doubled true; consoleErrors []
$env:NOESIS_URL='http://127.0.0.1:5174/'; node scripts/resume-proof.mjs after <dir>
  100 shown vs 100 saved; doubled false; banked 100; consoleErrors []
npm run test:all                 29 Python + 248 Vitest passed
npm run ai:verify                400/400 deterministic simulations passed
npm run typecheck                clean
python aikit.py check noesis     6/6 gates passed
```
