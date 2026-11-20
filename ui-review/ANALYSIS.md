# Noesis UI improvement — before/after screenshot analysis

Goal: a sleek, aesthetic, functional, minimalistic and simplistic UI. Every change below was
captured before and after with the seeded Playwright harness; the images are the evidence.

Method: seeded `npm run ui:shots` (Playwright + headless Edge), mobile 390×844 @2x and
desktop 1280×900 @2x, against the Vite dev server on `127.0.0.1:5175`. The small helper
`ui-review/capture-desktop.mjs` captures the two close-up views (desktop home and mobile
home top) used for each iteration. All captures are committed under `ui-review/`.

- Baseline: `ui-review/before/`
- Iteration 1: `ui-review/after-change-1/`, refined in `ui-review/after-change-1b/`
- Iteration 2: `ui-review/after-change-2/`
- Iteration 3: `ui-review/after-change-3/`
- Final full set: `ui-review/after-final/`

## Change 1 — Hero composition (desktop) + watermark (mobile)

**Before:** `before/10-home-desktop.png`
**After:** `after-change-1/10-home-desktop.png` → refined `after-change-1b/10-home-desktop.png`

- Before: the hero text occupied the left ~60% and the right half was empty dark space;
  the headline wrapped to three lines with "claims." orphaned.
- After: a CSS-only "focus orb" (concentric rings, four dots, gradient N core) fills the
  right column via a two-column grid at ≥900px. The orb is decorative, `aria-hidden`,
  uses slow non-flashing motion, and inherits the existing reduced-motion guard.
- Refinement: the hero `h1` was reduced to `clamp(2rem, 4.4vw, 3rem)` inside the hero,
  giving a clean two-line headline and a shorter hero; the tracking/leading now match
  the orb.

**Before:** `before/01-home-mobile-empty.png` (top of full-page shot)
**After:** `after-change-1b/01-home-mobile-top.png`

- The first pass showed a ghosted "N" core floating behind the heading, which read as a
  duplicated logo. Refinement hides the core and dots below 900px, leaving only faint
  concentric rings at 10% opacity — a subtle texture that does not compete with the copy.

## Change 2 — Surface and interaction polish (all screens)

**Before:** `before/04-results-mobile.png`, `before/06-settings-mobile.png`
**After:** `after-change-2/04-results-mobile.png`, `after-change-2/06-settings-mobile.png`

- Eyebrows now have a 3px cyan→violet accent bar, creating a consistent section marker
  across home, results, briefing, settings and evidence screens.
- Cards gained a 1px inner top highlight, stronger elevation and a hover lift with a
  cyan-tinted border (hover only, so touch devices are unaffected).
- Result metric tiles gained a faint diagonal tint and a left accent rail; the tier
  badges gained a soft shadow.
- The primary CTA and "Begin test"/"Run another session" buttons gained a soft glow;
  the start CTA arrow now sits in a circular chip.
- Brand mark gained a cyan ring/glow and the active nav pill gained an underline dot.

## Change 3 — Density and hierarchy

**Before:** `after-change-2/01-home-mobile-top.png`
**After:** `after-change-3/01-home-mobile-top.png`

- Mobile "Browse tests / View history / Read the evidence" changed from three stacked
  full-width buttons to compact wrapping pills (two on the first row, one on the second).
  The hero is ~65px shorter, so the "Plan your next session" and "Your practice" cards
  start within the first viewport instead of below the fold.
- Notice panels gained a coloured left accent stripe (amber, red for warnings), making
  the optional/far-check/safety callouts scannable rather than blending into the cards.

## Change 4 — Onboarding and consent scannability

**Before:** `before-round-4/08-safety-mobile.png`, `before-round-4/06b-research-consent-mobile.png`
**After:** `after-change-4/08-safety-mobile.png`, `after-change-4/06b-research-consent-mobile.png`

- Safety screen: the two screening questions now carry `01` / `02` number chips, and a green
  "Answers stay on this device" chip sits under the intro. The form reads as a short,
  structured checklist instead of an unbroken block of text. The privacy chip is
  `aria-hidden`-free text (not a decorative glyph) so it is announced to assistive tech.
- Research consent: the eight consent sections now carry `01`–`08` number badges via a CSS
  counter (no content duplication, works in both English and Turkish). The final
  "Your agreement" card is deliberately left unnumbered so it reads as the action step.
- Numbering uses theme variables, so high-contrast mode keeps the badges legible.

Captured with `ui-review/capture-onboarding.mjs`, a focused helper that seeds only the
state these two screens need.

## Change 5 — Results at-a-glance summary

**Before:** `before-round-5/04-results-mobile.png`
**After:** `after-change-5/04-results-mobile.png`, `after-change-5/04-results-desktop.png`

- Added a factual summary strip directly under the results intro: blocks completed, distinct
  skills practised, and cosmetic momentum (the last item only when Motivation mode is on).
- It deliberately reports counts, not an aggregate score, so the app's "no composite brain
  score" claim is preserved; the momentum figure is labelled "cosmetic" inline.
- On desktop the strip spans the full column above the two-card result grid; on mobile the
  three values fit in one row. Captured with `ui-review/capture-results.mjs`.

Note: `vite.config.ts` now ignores `**/ui-review/**` in the dev-server watcher. Generated
screenshots triggered an `EBUSY` watcher error that crashed Vite on Windows when files were
copied into the evidence folder.

## Change 6 — Evidence screen jump navigation

**Before:** `before-round-6/07-evidence-mobile-top.png`, `07-evidence-desktop-top.png`
**After:** `after-change-6/07-evidence-mobile-top.png`, `07-evidence-desktop-top.png`

- Added a "Jump to" chip row that scrolls directly to any of the 11 mechanic cards.
  Each card got an `id` and `scroll-margin-top: 88px` so the sticky header never covers it.
- On mobile the row is a single horizontally scrollable strip; on desktop the chips wrap
  to two lines and all 11 are visible at once.
- The chips are `<button>` elements, not `<a>`, because `tests/ui/evidence-citations.test.tsx`
  asserts that *every* link on this screen is a PubMed citation. Using buttons keeps that
  test intact and unchanged while still setting the URL hash via `history.replaceState`
  and respecting the reduced-motion setting for the scroll animation.
- `ui-review/verify-jump.mjs` verified the behaviour: clicking "Jump to Flanker" scrolled
  from y=0 to y=3554, set `#evidence-flanker`, and placed the card top at 86px in view.

## Change 7 — Settings section navigation

**Before:** `before-round-7/06-settings-{mobile,desktop}-top.png`
**After:** `after-change-7/06-settings-{mobile,desktop}-top.png`

- The settings screen is the longest single view (eight sections). Added a "Jump to" bar with
  Display, Session, Adaptive, Study, Research, AI mode, Symptoms and Your data, reusing the
  same chip styles as the evidence screen.
- Each target section has an explicit id and `scroll-margin-top: 88px`; `ResearchDataPanel`
  is wrapped with an id anchor without changing the component itself.
- `ui-review/verify-settings-jump.mjs` verified "Jump to Your data": scroll y=0 → 3666,
  hash `#settings-data`, section top at 86px, in view.
- The menu screen was also inspected at this stage; its hero CTA and tab/filter layout were
  already in good shape, so no change was made there.

## Change 8 — Minimalist refinement (updated goal: sleek, aesthetic, functional, simple)

**Before:** `before-round-8/` (home desktop/mobile, evidence, settings, safety, results)
**After:** `after-change-8/` (same views, recaptured with the focused helpers)

This round removed ornamentation added in earlier rounds while keeping every function:

- **Hero mark:** the three-ring/four-dot animated orb became a single fine ring plus the N
  monogram, with no motion. Still fills the empty desktop column; mobile keeps a faint outline.
- **Jump bars:** the 11-chip and 8-chip pill grids became understated text rows with a single
  bottom divider. Same buttons, same hash/hover behaviour, far less visual weight.
- **Numbering:** the boxed `01`/`02` and `01`–`08` badges became plain accent numerals.
- **Results strip:** removed the diagonal gradient overlay; the three factual figures stay in
  a flat panel with dividers.

Re-verified after the restyle:
- `verify-jump.mjs`: evidence Flanker jump → y=3539, hash set, card top 86px, visible.
- `verify-settings-jump.mjs`: settings Your-data jump → y=3651, hash set, section top 86px, visible.
- `npm run typecheck`, `npx vitest run tests/ui` (170 tests) and `npm run build` all pass.

## Change 9 — Quieter surfaces

**Before:** `before-round-9/` (home desktop/mobile, evidence, results)
**After:** `after-change-9/` (same views), plus refreshed `after-final/` full set

- Page background reduced from two large cyan/violet radial washes to one faint top glow;
  the hero panel lost its second gradient. Every screen now sits on calmer negative space.
- Evidence badges changed from solid bright fills to thin outlined pills (green/amber/indigo
  text on 10% tint). They still read instantly but no longer shout.
- `after-final/09-home-mobile-contrast.png` confirms high-contrast mode still renders the
  outlined badges and all content correctly on pure black.

`npm run typecheck`, `npx vitest run tests/ui` (170 tests) and the full seeded `npm run ui:shots`
all pass after this round.

## Change 10 — Compact experimental mechanic cards

**Before:** `before-round-10/01-home-mobile-empty.png`, `10-home-desktop.png`
**After:** `after-change-10/01-home-mobile-full.png`, `01-home-mobile-top.png`, `10-home-desktop.png`

- The home screen listed all 11 mechanics with full evidence text, making it very long on
  mobile. The four core mechanics keep their full claim/qualifier text.
- The seven experimental mechanics now show name, tagline, claim badge, "Why this task"
  disclosure and Focus action; the longer claim/qualifier text is available on demand.
- An earlier attempt hid the experimental cards behind a "Show all 11 tests" toggle, but
  `tests/ui/home.test.tsx` requires every mechanic heading (including Task Switch) to be
  visible on home. Rather than weaken that test, the contract was preserved: all 11
  headings remain, with the dense text behind a native `<details>` element.
- `verify-mechanics-toggle.mjs` confirms: 11 cards, 11 headings, 7 compact, disclosure
  opens on click (details `p` visibility false → true).

## Change 11 — Compact practice-menu cards

**Before:** `before-round-11/05b-menu-tests-{mobile-full,mobile-top,desktop-top}.png`
**After:** `after-change-11/05b-menu-tests-{mobile-full,mobile-top,desktop-top}.png`

- Each menu test card keeps its name, claim badge, literature brief, personal stats and Start
  button. The three fine-print paragraphs (evidence supports / does not claim / primary source)
  moved behind an "Evidence & claim" disclosure.
- This shortens the 11-card menu considerably while keeping all information reachable and
  all test assertions valid: `practice-menu.test.tsx` reads card `textContent`, which still
  includes disclosure content, and all headings remain visible.

`npm run typecheck` passed; `npx vitest run tests/ui` — 170 tests passed.

## Change 12 — Shorter pre-test briefing

**Before:** `before-round-12/02-session-briefing-mobile.png`, `10b-session-briefing-desktop.png`
**After:** `after-change-12/02-session-briefing-{mobile,desktop}.png`

- The briefing is shown before every block. "What this measures", "How to respond", strategy
  tip, the optional confidence check and "Begin test" stay immediately visible.
- The detailed "What the evidence supports", "Not claimed", primary source and safety text
  moved into one "Evidence, claim limits & safety" disclosure.
- `tests/ui/test-briefing.test.tsx` checks the briefing's `textContent`, which still includes
  disclosure content, so the test was left unchanged. Typecheck and all 170 UI tests pass.

## Final verification

- `after-final/` reproduces the full seeded flow with all changes applied: home (empty
  and with history), briefing, session, per-block completion, results, menu, settings,
  research consent, evidence, safety onboarding and high-contrast/large-text mode.
- `09-home-mobile-contrast.png` confirms accessibility mode still works: pure black
  surfaces, white borders, yellow accents; the new decorative elements do not break it.
- `11-session-desktop.png` confirms the session stage remains centred and readable.

## Code verification

- `npm run typecheck` — passed (no output, exit 0).
- `npm test` — all 72 files and 449 tests pass.
- `python aikit.py check noesis` — **7/7 gates pass** (hygiene, guidelines, secrets,
  dependencies, test, typecheck, build). Delivery is not ready only because the work is
  uncommitted, which is expected.
- The previously failing `tests/scripts/start.test.ts` was traced to the `#!/usr/bin/env node`
  shebang in `scripts/start.mjs`: Vitest 4 on Node 26 throws `Invalid or unexpected token`
  when transforming an imported `.mjs` that starts with a hashbang. A no-shebang probe
  imported cleanly; removing the line fixed the suite. All callers already use
  `node scripts/start.mjs`, so CLI behaviour is unchanged.
- Files changed: `src/styles.css`, `src/ui/screens/HomeScreen.tsx`,
  `src/ui/screens/SafetyScreen.tsx`, `src/ui/screens/ResultsScreen.tsx`,
  `src/ui/screens/EvidenceScreen.tsx`, `src/ui/screens/SettingsScreen.tsx`,
  `src/ui/components/TestBriefing.tsx`, `src/ui/screens/PracticeMenuScreen.tsx`,
  `scripts/start.mjs`, `vite.config.ts`, `.aikit/codebase_map.md`, plus this review folder.
  No engine, storage, or test logic was modified.
