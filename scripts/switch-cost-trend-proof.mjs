// Scripted switch-cost history proof: seeds Task Switch results at levels 1-3,
// captures the Menu History panel, then plays a real level-2 focus session and
// verifies the level-aware trend updates from the new history.
// Usage: node scripts/switch-cost-trend-proof.mjs <before|after> [shotDir]
import { chromium } from "playwright-core";
import { mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const LABEL = process.argv[2] ?? "run";
const OUT = process.argv[3] ?? join(tmpdir(), "noesis-switch-cost-trend");
const EDGE =
  process.env.EDGE_PATH ?? "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const URL = process.env.NOESIS_URL ?? "http://127.0.0.1:5187/";
const FIXED_NOW = 1_793_723_107_000;

const switchingRecord = (level, costs, id, finishedAt) => ({
  id,
  finishedAt,
  seed: 42,
  results: costs.map((cost, index) => ({
    mechanic: "switching",
    domain: "cognitive_flexibility",
    trials: 24,
    durationMs: 70_000,
    metrics: { accuracy: 1, switch_cost_ms: cost },
    summary: `Task Switch: 100% accuracy, 24/24 correct, ${cost} ms switch cost.`,
    seed: 42,
    stateHash: `0123456789abcde${index}`,
    difficulty: level,
  })),
});

const seededHistory = [
  switchingRecord(3, [180, 200], "s3", "2026-11-08T10:00:00.000Z"),
  switchingRecord(2, [90, 70], "s2", "2026-11-07T10:00:00.000Z"),
  switchingRecord(1, [50], "s1", "2026-11-06T10:00:00.000Z"),
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
        levels: { nback: 2, gonogo: 2, reasoning: 2, speed: 2, switching: 2 },
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
await page.goto(URL, { waitUntil: "networkidle" });
await page.waitForSelector('[data-testid="start-session"]');
await page.getByRole("button", { name: "Menu", exact: true }).click();
await page.waitForSelector('[data-testid="menu-test-switching"]');
await page.waitForTimeout(300);
await page.screenshot({ path: join(OUT, `${LABEL}-00-choose-tests.png`), fullPage: true });
const chooseBefore = await page.$eval('[data-testid="menu-test-switching"]', (node) => {
  const line = node.querySelector('[data-testid="menu-switch-cost"]');
  return line ? (line.textContent ?? "").replace(/\s+/g, " ").trim() : null;
});
await page.getByRole("tab", { name: /history/i }).click();
await page.waitForSelector('[data-testid="menu-history"]');
await page.waitForTimeout(300);
await page.screenshot({ path: join(OUT, `${LABEL}-01-history-seeded.png`), fullPage: true });

const readPanel = () =>
  page.evaluate(() => {
    const panel = document.querySelector('[data-testid="switch-cost-trend"]');
    if (!panel) return null;
    const rows = [...document.querySelectorAll('[data-testid^="switch-cost-level-"]')].map(
      (row) => ({
        testId: row.getAttribute("data-testid"),
        text: (row.textContent ?? "").replace(/\s+/g, " ").trim(),
      }),
    );
    return { text: (panel.textContent ?? "").replace(/\s+/g, " ").trim(), rows };
  });

const seededPanel = await readPanel();

// Play a real level-2 Task Switch focus session from the Menu.
await page.getByRole("tab", { name: /choose a test/i }).click();
await page.getByTestId("start-switching").click();
await page.waitForSelector('[data-testid="test-briefing"]');
await page.getByTestId("begin-test").click();
await page.waitForSelector(".stage-switching");
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
    const state = window.__NOESIS__.getState();
    const current = state?.current;
    if (!current || current.mechanic !== "switching" || current.phase !== "question") {
      return false;
    }
    const trial = current.trials[current.index];
    const correct =
      trial.cue === "colour"
        ? trial.colour === "red"
          ? 0
          : 1
        : trial.shape === "circle"
          ? 0
          : 1;
    if (state.blockIndex === 2 && trial.switched) {
      window.__NOESIS__.dispatch({ type: "advance", ms: 300 });
    }
    window.__NOESIS__.dispatch({ type: "answer", option: correct });
    return true;
  });
  await page.evaluate(() => window.__NOESIS__.dispatch({ type: "advance", ms: 700 }));
  if (!answered) await page.waitForTimeout(10);
}
await page.waitForSelector("text=Your blocks, separately", { timeout: 15000 });
const played = await page.evaluate(() => {
  const state = window.__NOESIS__.getState();
  return {
    mechanics: state?.results.map((result) => result.mechanic) ?? [],
    difficulties: state?.results.map((result) => result.difficulty ?? null) ?? [],
    costs: state?.results.map((result) => result.metrics.switch_cost_ms ?? null) ?? [],
  };
});
await page.getByRole("button", { name: "Menu", exact: true }).click();
await page.getByRole("tab", { name: /history/i }).click();
await page.waitForSelector('[data-testid="menu-history"]');
await page.waitForTimeout(300);
await page.screenshot({ path: join(OUT, `${LABEL}-02-history-after-play.png`), fullPage: true });
const playedPanel = await readPanel();
await page.getByRole("tab", { name: /choose a test/i }).click();
await page.waitForSelector('[data-testid="menu-test-switching"]');
await page.waitForTimeout(300);
await page.screenshot({ path: join(OUT, `${LABEL}-03-choose-tests-after-play.png`), fullPage: true });
const chooseAfter = await page.$eval('[data-testid="menu-test-switching"]', (node) => {
  const line = node.querySelector('[data-testid="menu-switch-cost"]');
  return line ? (line.textContent ?? "").replace(/\s+/g, " ").trim() : null;
});

const report = {
  label: LABEL,
  chooseBefore,
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
