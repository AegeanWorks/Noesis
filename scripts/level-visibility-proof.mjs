// Scripted level-visibility playthrough: starts a quick session with adaptive levels
// (N-back 1, Go/No-Go 3), captures both block headers and the results cards.
// Usage: node scripts/level-visibility-proof.mjs <before|after> [shotDir]
import { chromium } from "playwright-core";
import { mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const LABEL = process.argv[2] ?? "run";
const OUT = process.argv[3] ?? join(tmpdir(), "noesis-level-visibility");
const EDGE =
  process.env.EDGE_PATH ?? "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const URL = process.env.NOESIS_URL ?? "http://127.0.0.1:5174/";
const FIXED_NOW = 1_793_723_107_000;

await mkdir(OUT, { recursive: true });
const browser = await chromium.launch({ executablePath: EDGE, headless: true });
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
});
await context.addInitScript(
  ({ fixedNow }) => {
    Date.now = () => fixedNow;
    if (sessionStorage.getItem("noesis.level.seeded") === "1") return;
    sessionStorage.setItem("noesis.level.seeded", "1");
    localStorage.setItem(
      "noesis.safety.v1",
      JSON.stringify({
        version: 1,
        acknowledged: true,
        photosensitive: false,
        exerciseConcern: false,
        consent: true,
        updatedAt: new Date(fixedNow).toISOString(),
      }),
    );
    localStorage.setItem(
      "noesis.settings.v1",
      JSON.stringify({
        reducedMotion: false,
        difficulty: 3,
        sessionLength: "quick",
        motivationMode: true,
        largeText: false,
        highContrast: false,
        hideClock: false,
        weeklyGoal: 3,
      }),
    );
    localStorage.setItem(
      "noesis.adaptive.v1",
      JSON.stringify({
        enabled: true,
        levels: { nback: 1, gonogo: 3, reasoning: 2, speed: 2 },
        log: [],
      }),
    );
    localStorage.removeItem("noesis.history.v1");
    localStorage.removeItem("noesis.session.v1");
  },
  { fixedNow: FIXED_NOW },
);

const page = await context.newPage();
const consoleErrors = [];
page.on("console", (msg) => {
  if (msg.type() === "error") consoleErrors.push(msg.text());
});
page.on("pageerror", (error) => consoleErrors.push(error.message));
await page.goto(URL, { waitUntil: "networkidle" });
await page.waitForSelector('[data-testid="start-session"]');
await page.evaluate(async () => {
  const module = await import("/src/content/reasoningItems.ts");
  window.__NOESIS_REASONING__ = module.REASONING_ITEMS;
});

async function header() {
  return page.evaluate(() => {
    const state = window.__NOESIS__.getState();
    const view = window.__NOESIS__.getView();
    const eyebrow = document.querySelector(".session-header .eyebrow")?.textContent ?? "";
    return {
      blockIndex: view?.blockIndex ?? null,
      blockCount: view?.blockCount ?? null,
      blockDifficulty: view?.blockDifficulty ?? null,
      mechanic: state?.current?.mechanic ?? null,
      eyebrow: eyebrow.replace(/\s+/g, " ").trim(),
    };
  });
}

async function drive(untilBlockComplete) {
  for (let step = 0; step < 8000; step += 1) {
    const snap = await page.evaluate(() => {
      const state = window.__NOESIS__.getState();
      return state ? { phase: state.phase } : null;
    });
    if (!snap) break;
    if (snap.phase === "complete") break;
    if (snap.phase === "block_complete") {
      if (untilBlockComplete) return;
      const bank = await page.$('[data-testid="bank-next"]');
      if (bank) await bank.click();
      else {
        const next = await page.$('[data-testid="next-block"]');
        if (next) await next.click();
      }
      await page.waitForTimeout(120);
      continue;
    }
    if (snap.phase !== "running") continue;
    const action = await page.evaluate(() => {
      const state = window.__NOESIS__.getState();
      const current = state?.current;
      if (!current) return null;
      if (current.mechanic === "nback") {
        const trial = current.trials[current.index];
        if (current.phase === "trial" && !current.respondedThisTrial && trial?.target) return { type: "respond" };
      }
      if (current.mechanic === "gonogo") {
        const trial = current.trials[current.index];
        if ((current.phase === "stimulus" || current.phase === "response") && !current.respondedThisTrial && trial?.go) return { type: "respond" };
      }
      if (current.mechanic === "reasoning" && current.phase === "question") {
        const item = window.__NOESIS_REASONING__?.find((entry) => entry.id === current.order[current.index]);
        if (item) return { type: "answer", option: item.correctIndex };
      }
      if (current.mechanic === "speed" && current.phase === "stimulus" && !current.respondedThisTrial) return { type: "respond" };
      return null;
    });
    if (action) await page.evaluate((a) => window.__NOESIS__.dispatch(a), action);
    await page.evaluate(() => window.__NOESIS__.dispatch({ type: "advance", ms: 500 }));
  }
  await page.waitForSelector("text=Your blocks, separately", { timeout: 15000 });
}

await page.click('[data-testid="start-session"]');
await page.waitForSelector('[data-testid="session-root"]');
await page.waitForTimeout(400);
const first = await header();
await page.screenshot({ path: join(OUT, `${LABEL}-01-first-block-header.png`) });

await drive(true);
await page.waitForTimeout(150);
const bank = await page.$('[data-testid="bank-next"]');
if (!bank) throw new Error("expected a bank button at the first block boundary");
await bank.click();
await page.waitForTimeout(400);
const second = await header();
await page.screenshot({ path: join(OUT, `${LABEL}-02-second-block-header.png`) });

await drive(false);
await page.waitForTimeout(400);
const results = await page.evaluate(() => {
  const levelBadges = [...document.querySelectorAll('[data-testid^="level-"]')].map((el) => ({
    testId: el.getAttribute("data-testid"),
    text: (el.textContent ?? "").trim(),
  }));
  const levels = window.__NOESIS__.getState()?.results.map((result) => ({
    mechanic: result.mechanic,
    difficulty: result.difficulty ?? null,
    summary: result.summary,
  })) ?? [];
  return { levelBadges, levels };
});
await page.screenshot({ path: join(OUT, `${LABEL}-03-results-levels.png`), fullPage: true });

const report = {
  label: LABEL,
  first,
  second,
  results,
  levelsVisibleInHeaders: /Level \d/.test(first.eyebrow) && /Level \d/.test(second.eyebrow),
  levelsVisibleOnCards: results.levelBadges.length === 2,
  consoleErrors,
  shots: OUT,
};
await writeFile(join(OUT, `${LABEL}-level-report.json`), `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(JSON.stringify(report, null, 2));
await browser.close();
