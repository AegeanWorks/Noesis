// Scripted Prospective Memory history proof: seeds ongoing/cue/false-alarm data at levels
// 1-3, captures Choose and History, then plays a real level-2 session and verifies the
// level-aware trends and same-level result delta.
// Usage: node scripts/prospective-trend-proof.mjs <before|after> [shotDir]
import { chromium } from "playwright-core";
import { mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const LABEL = process.argv[2] ?? "run";
const OUT = process.argv[3] ?? join(tmpdir(), "noesis-prospective-trend");
const EDGE =
  process.env.EDGE_PATH ?? "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const URL = process.env.NOESIS_URL ?? "http://127.0.0.1:5205/";
const FIXED_NOW = 1_793_723_107_000;

const prospectiveRecord = (level, blocks, id, finishedAt) => ({
  id,
  finishedAt,
  seed: 42,
  results: blocks.map(([ongoing, cueHits, cueTrials, falseAlarms], index) => ({
    mechanic: "prospective",
    domain: "episodic_memory",
    trials: 24,
    durationMs: 60_000,
    metrics: {
      accuracy: ongoing,
      ongoing_accuracy: ongoing,
      cue_hits: cueHits,
      cue_trials: cueTrials,
      cue_accuracy: cueTrials === 0 ? 0 : cueHits / cueTrials,
      false_alarms: falseAlarms,
    },
    summary: `Prospective Memory: ${Math.round(ongoing * 100)}% ongoing accuracy.`,
    seed: 42,
    stateHash: `0123456789abcde${index}`,
    difficulty: level,
  })),
});

const seededHistory = [
  prospectiveRecord(3, [[1, 4, 4, 0], [1, 4, 4, 0]], "m3", "2026-11-08T10:00:00.000Z"),
  prospectiveRecord(2, [[0.8, 3, 4, 1], [0.9, 3, 4, 1]], "m2", "2026-11-07T10:00:00.000Z"),
  prospectiveRecord(1, [[0.8, 2, 4, 2]], "m1", "2026-11-06T10:00:00.000Z"),
];

await mkdir(OUT, { recursive: true });
const browser = await chromium.launch({ executablePath: EDGE, headless: true });
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
});
await context.addInitScript(
  ({ fixedNow, history }) => {
    Date.now = () => fixedNow;
    localStorage.setItem("noesis.history.v1", JSON.stringify(history));
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
        reducedMotion: true,
        difficulty: 1,
        sessionLength: "quick",
        motivationMode: false,
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
        levels: {
          nback: 2,
          gonogo: 2,
          reasoning: 2,
          speed: 2,
          switching: 2,
          flanker: 2,
          spatial: 2,
          rotation: 2,
          prospective: 2,
        },
        log: [],
      }),
    );
    localStorage.removeItem("noesis.session.v1");
  },
  { fixedNow: FIXED_NOW, history: seededHistory },
);

const page = await context.newPage();
const consoleErrors = [];
page.on("console", (msg) => {
  if (msg.type() === "error") consoleErrors.push(msg.text());
});
page.on("pageerror", (error) => consoleErrors.push(error.message));

const readChoose = () =>
  page.evaluate(() => {
    const line = document.querySelector('[data-testid="menu-prospective-trend"]');
    return line ? (line.textContent ?? "").replace(/\s+/g, " ").trim() : null;
  });

const readPanel = () =>
  page.evaluate(() => {
    const panel = document.querySelector('[data-testid="prospective-trend"]');
    if (!panel) return null;
    const rows = [...document.querySelectorAll('[data-testid^="prospective-level-"]')].map(
      (row) => ({
        testId: row.getAttribute("data-testid"),
        text: (row.textContent ?? "").replace(/\s+/g, " ").trim(),
      }),
    );
    return { text: (panel.textContent ?? "").replace(/\s+/g, " ").trim(), rows };
  });

await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 60_000 });
await page.waitForSelector('[data-testid="start-session"]');
await page.getByRole("button", { name: "Menu", exact: true }).click();
await page.waitForSelector('[data-testid="menu-test-prospective"]');
await page.waitForTimeout(300);
await page.screenshot({ path: join(OUT, `${LABEL}-00-choose-tests.png`), fullPage: true });
const chooseSeeded = await readChoose();

await page.getByRole("tab", { name: /history/i }).click();
await page.waitForSelector('[data-testid="menu-history"]');
await page.waitForTimeout(300);
await page.screenshot({ path: join(OUT, `${LABEL}-01-history-seeded.png`), fullPage: true });
const seededPanel = await readPanel();

// Play a real level-2 Prospective Memory focus session from the Menu.
await page.getByRole("tab", { name: /choose a test/i }).click();
await page.getByTestId("start-prospective").click();
await page.waitForSelector('[data-testid="test-briefing"]');
await page.getByTestId("begin-test").click();
await page.waitForSelector(".stage-prospective");
for (let step = 0; step < 6000; step += 1) {
  const state = await page.evaluate(() => {
    const current = window.__NOESIS__.getState();
    return current ? { phase: current.phase } : null;
  });
  if (!state) throw new Error("session disappeared");
  if (state.phase === "complete") break;
  if (state.phase === "block_complete") {
    const next = await page.$('[data-testid="next-block"]');
    if (next) await next.click();
    await page.waitForTimeout(80);
    continue;
  }
  if (state.phase !== "running") continue;
  const answered = await page.evaluate(() => {
    const current = window.__NOESIS__.getState()?.current;
    if (!current || current.mechanic !== "prospective" || current.phase !== "question") {
      return false;
    }
    const trial = current.trials[current.index];
    const option = trial.cue ? 2 : ["A", "E", "I", "U"].includes(trial.letter) ? 0 : 1;
    window.__NOESIS__.dispatch({ type: "advance", ms: 400 });
    window.__NOESIS__.dispatch({ type: "answer", option });
    return true;
  });
  await page.evaluate(() => window.__NOESIS__.dispatch({ type: "advance", ms: 700 }));
  if (!answered) await page.waitForTimeout(5);
}
await page.waitForSelector("text=Your blocks, separately", { timeout: 15000 });
await page.waitForTimeout(300);
await page.screenshot({ path: join(OUT, `${LABEL}-04-prospective-results.png`), fullPage: true });
const played = await page.evaluate(() => {
  const state = window.__NOESIS__.getState();
  const deltas = [...document.querySelectorAll('[data-testid^="prospective-vs-previous-"]')].map(
    (node) => ({
      testId: node.getAttribute("data-testid"),
      text: (node.textContent ?? "").replace(/\s+/g, " ").trim(),
      direction: node.getAttribute("data-direction"),
    }),
  );
  return {
    mechanics: state?.results.map((result) => result.mechanic) ?? [],
    difficulties: state?.results.map((result) => result.difficulty ?? null) ?? [],
    ongoing: state?.results.map((result) => result.metrics.ongoing_accuracy ?? null) ?? [],
    cueHits: state?.results.map((result) => result.metrics.cue_hits ?? null) ?? [],
    falseAlarms: state?.results.map((result) => result.metrics.false_alarms ?? null) ?? [],
    deltas,
  };
});

await page.getByRole("button", { name: "Menu", exact: true }).click();
await page.getByRole("tab", { name: /history/i }).click();
await page.waitForSelector('[data-testid="menu-history"]');
await page.waitForTimeout(300);
await page.screenshot({ path: join(OUT, `${LABEL}-02-history-after-play.png`), fullPage: true });
const playedPanel = await readPanel();
await page.getByRole("tab", { name: /choose a test/i }).click();
await page.waitForSelector('[data-testid="menu-test-prospective"]');
await page.waitForTimeout(300);
await page.screenshot({ path: join(OUT, `${LABEL}-03-choose-tests-after-play.png`), fullPage: true });
const chooseAfter = await readChoose();

const report = {
  label: LABEL,
  chooseSeeded,
  seededPanel,
  played,
  chooseAfter,
  playedPanel,
  consoleErrors,
  shots: OUT,
};
await writeFile(join(OUT, `${LABEL}-report.json`), `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(JSON.stringify(report, null, 2));
await browser.close();
