// Scripted Mental Rotation history proof: seeds accuracy/RT at levels 1-3, captures the
// Choose card and Menu History, then plays a real level-2 Mental Rotation focus session
// and verifies the level-aware accuracy/RT trend updates.
// Usage: node scripts/rotation-trend-proof.mjs <before|after> [shotDir]
import { chromium } from "playwright-core";
import { mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const LABEL = process.argv[2] ?? "run";
const OUT = process.argv[3] ?? join(tmpdir(), "noesis-rotation-trend");
const EDGE =
  process.env.EDGE_PATH ?? "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const URL = process.env.NOESIS_URL ?? "http://127.0.0.1:5201/";
const FIXED_NOW = 1_793_723_107_000;

const rotationRecord = (level, blocks, id, finishedAt) => ({
  id,
  finishedAt,
  seed: 42,
  results: blocks.map(([accuracy, responseMs], index) => ({
    mechanic: "rotation",
    domain: "reasoning",
    trials: 12,
    durationMs: 60_000,
    metrics: { accuracy, mean_response_ms: responseMs, mirror_accuracy: accuracy },
    summary: `Mental Rotation: ${Math.round(accuracy * 100)}% accuracy.`,
    seed: 42,
    stateHash: `0123456789abcde${index}`,
    difficulty: level,
  })),
});

const seededHistory = [
  rotationRecord(3, [[0.9, 500], [1, 400]], "r3", "2026-11-08T10:00:00.000Z"),
  rotationRecord(2, [[0.8, 600], [0.9, 500]], "r2", "2026-11-07T10:00:00.000Z"),
  rotationRecord(1, [[0.7, 700]], "r1", "2026-11-06T10:00:00.000Z"),
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
    const line = document.querySelector('[data-testid="menu-rotation-trend"]');
    return line ? (line.textContent ?? "").replace(/\s+/g, " ").trim() : null;
  });

const readPanel = () =>
  page.evaluate(() => {
    const panel = document.querySelector('[data-testid="rotation-trend"]');
    if (!panel) return null;
    const rows = [...document.querySelectorAll('[data-testid^="rotation-level-"]')].map(
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
await page.waitForSelector('[data-testid="menu-test-rotation"]');
await page.waitForTimeout(300);
await page.screenshot({ path: join(OUT, `${LABEL}-00-choose-tests.png`), fullPage: true });
const chooseSeeded = await readChoose();

await page.getByRole("tab", { name: /history/i }).click();
await page.waitForSelector('[data-testid="menu-history"]');
await page.waitForTimeout(300);
await page.screenshot({ path: join(OUT, `${LABEL}-01-history-seeded.png`), fullPage: true });
const seededPanel = await readPanel();

// Play a real level-2 Mental Rotation focus session from the Menu.
await page.getByRole("tab", { name: /choose a test/i }).click();
await page.getByTestId("start-rotation").click();
await page.waitForSelector('[data-testid="test-briefing"]');
await page.getByTestId("begin-test").click();
await page.waitForSelector(".stage-rotation");
for (let step = 0; step < 5000; step += 1) {
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
    if (!current || current.mechanic !== "rotation" || current.phase !== "question") {
      return false;
    }
    const trial = current.trials[current.index];
    window.__NOESIS__.dispatch({ type: "advance", ms: 400 });
    window.__NOESIS__.dispatch({
      type: "answer",
      option: trial.mirrored ? 1 : 0,
    });
    return true;
  });
  await page.evaluate(() => window.__NOESIS__.dispatch({ type: "advance", ms: 700 }));
  if (!answered) await page.waitForTimeout(5);
}
await page.waitForSelector("text=Your blocks, separately", { timeout: 15000 });
await page.waitForTimeout(300);
await page.screenshot({ path: join(OUT, `${LABEL}-04-rotation-results.png`), fullPage: true });
const played = await page.evaluate(() => {
  const state = window.__NOESIS__.getState();
  const accuracyChanges = [
    ...document.querySelectorAll('[data-testid^="rotation-accuracy-vs-previous-"]'),
  ].map((node) => ({
    testId: node.getAttribute("data-testid"),
    text: (node.textContent ?? "").replace(/\s+/g, " ").trim(),
    direction: node.getAttribute("data-direction"),
  }));
  const responseChanges = [
    ...document.querySelectorAll('[data-testid^="rotation-rt-vs-previous-"]'),
  ].map((node) => ({
    testId: node.getAttribute("data-testid"),
    text: (node.textContent ?? "").replace(/\s+/g, " ").trim(),
    direction: node.getAttribute("data-direction"),
  }));
  return {
    mechanics: state?.results.map((result) => result.mechanic) ?? [],
    difficulties: state?.results.map((result) => result.difficulty ?? null) ?? [],
    accuracies: state?.results.map((result) => result.metrics.accuracy ?? null) ?? [],
    responses: state?.results.map((result) => result.metrics.mean_response_ms ?? null) ?? [],
    accuracyChanges,
    responseChanges,
  };
});

await page.getByRole("button", { name: "Menu", exact: true }).click();
await page.getByRole("tab", { name: /history/i }).click();
await page.waitForSelector('[data-testid="menu-history"]');
await page.waitForTimeout(300);
await page.screenshot({ path: join(OUT, `${LABEL}-02-history-after-play.png`), fullPage: true });
const playedPanel = await readPanel();
await page.getByRole("tab", { name: /choose a test/i }).click();
await page.waitForSelector('[data-testid="menu-test-rotation"]');
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
