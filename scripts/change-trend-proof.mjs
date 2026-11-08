// Scripted Change Detection history proof: seeds accuracy/set-size/RT at levels 1-3,
// captures Choose and History, plays a real level-2 session and verifies the level-aware
// trends plus the same-level result deltas.
// Usage: node scripts/change-trend-proof.mjs <before|after> [shotDir]
import { chromium } from "playwright-core";
import { mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const LABEL = process.argv[2] ?? "run";
const OUT = process.argv[3] ?? join(tmpdir(), "noesis-change-trend");
const EDGE =
  process.env.EDGE_PATH ?? "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const URL = process.env.NOESIS_URL ?? "http://127.0.0.1:5215/";
const FIXED_NOW = 1_793_723_107_000;

const changeRecord = (level, blocks, id, finishedAt) => ({
  id,
  finishedAt,
  seed: 42,
  results: blocks.map(([accuracy, setSize, responseMs], index) => ({
    mechanic: "change",
    domain: "working_memory",
    trials: 12,
    durationMs: 60_000,
    metrics: { accuracy, set_size: setSize, mean_response_ms: responseMs },
    summary: `Change Detection: ${Math.round(accuracy * 100)}% accuracy, set size ${setSize}.`,
    seed: 42,
    stateHash: `0123456789abcde${index}`,
    difficulty: level,
  })),
});

const seededHistory = [
  changeRecord(3, [[0.9, 6, 500], [1, 6, 400]], "h3", "2026-11-08T10:00:00.000Z"),
  changeRecord(2, [[0.8, 5, 600], [0.9, 5, 500]], "h2", "2026-11-07T10:00:00.000Z"),
  changeRecord(1, [[0.7, 4, 700]], "h1", "2026-11-06T10:00:00.000Z"),
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
          paired: 2,
          change: 2,
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
    const line = document.querySelector('[data-testid="menu-change-trend"]');
    return line ? (line.textContent ?? "").replace(/\s+/g, " ").trim() : null;
  });

const readPanel = () =>
  page.evaluate(() => {
    const panel = document.querySelector('[data-testid="change-trend"]');
    if (!panel) return null;
    const rows = [...document.querySelectorAll('[data-testid^="change-level-"]')].map((row) => ({
      testId: row.getAttribute("data-testid"),
      text: (row.textContent ?? "").replace(/\s+/g, " ").trim(),
    }));
    return { text: (panel.textContent ?? "").replace(/\s+/g, " ").trim(), rows };
  });

await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 60_000 });
await page.waitForSelector('[data-testid="start-session"]');
await page.getByRole("button", { name: "Menu", exact: true }).click();
await page.waitForSelector('[data-testid="menu-test-change"]');
await page.waitForTimeout(300);
await page.screenshot({ path: join(OUT, `${LABEL}-00-choose-tests.png`), fullPage: true });
const chooseSeeded = await readChoose();

await page.getByRole("tab", { name: /history/i }).click();
await page.waitForSelector('[data-testid="menu-history"]');
await page.waitForTimeout(300);
await page.screenshot({ path: join(OUT, `${LABEL}-01-history-seeded.png`), fullPage: true });
const seededPanel = await readPanel();

// Play a real level-2 Change Detection focus session from the Menu.
await page.getByRole("tab", { name: /choose a test/i }).click();
await page.getByTestId("start-change").click();
await page.waitForSelector('[data-testid="test-briefing"]');
await page.getByTestId("begin-test").click();
await page.waitForSelector(".stage-change");
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
  await page.evaluate(() => {
    const current = window.__NOESIS__.getState()?.current;
    if (!current || current.mechanic !== "change") return;
    if (current.phase === "study") {
      window.__NOESIS__.dispatch({ type: "advance", ms: 1_000 });
      return;
    }
    if (current.phase === "delay") {
      window.__NOESIS__.dispatch({ type: "advance", ms: 700 });
      return;
    }
    if (current.phase !== "test") return;
    const trial = current.trials[current.index];
    window.__NOESIS__.dispatch({ type: "advance", ms: 400 });
    window.__NOESIS__.dispatch({
      type: "answer",
      option: trial.positions[trial.changedIndex],
    });
    window.__NOESIS__.dispatch({ type: "advance", ms: 700 });
  });
  await page.waitForTimeout(5);
}
await page.waitForSelector("text=Your blocks, separately", { timeout: 15000 });
await page.waitForTimeout(300);
await page.screenshot({ path: join(OUT, `${LABEL}-04-change-results.png`), fullPage: true });
const played = await page.evaluate(() => {
  const state = window.__NOESIS__.getState();
  const changes = [
    ...document.querySelectorAll(
      '[data-testid^="change-accuracy-vs-previous-"], [data-testid^="change-rt-vs-previous-"]',
    ),
  ].map((node) => ({
    testId: node.getAttribute("data-testid"),
    text: (node.textContent ?? "").replace(/\s+/g, " ").trim(),
    direction: node.getAttribute("data-direction"),
  }));
  return {
    mechanics: state?.results.map((result) => result.mechanic) ?? [],
    difficulties: state?.results.map((result) => result.difficulty ?? null) ?? [],
    accuracies: state?.results.map((result) => result.metrics.accuracy ?? null) ?? [],
    setSizes: state?.results.map((result) => result.metrics.set_size ?? null) ?? [],
    responses: state?.results.map((result) => result.metrics.mean_response_ms ?? null) ?? [],
    changes,
  };
});

await page.getByRole("button", { name: "Menu", exact: true }).click();
await page.getByRole("tab", { name: /history/i }).click();
await page.waitForSelector('[data-testid="menu-history"]');
await page.waitForTimeout(300);
await page.screenshot({ path: join(OUT, `${LABEL}-02-history-after-play.png`), fullPage: true });
const playedPanel = await readPanel();
await page.getByRole("tab", { name: /choose a test/i }).click();
await page.waitForSelector('[data-testid="menu-test-change"]');
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
