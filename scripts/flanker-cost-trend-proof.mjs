// Scripted Flanker interference-cost history proof: seeds Flanker results at levels 1-3,
// captures the Choose card and Menu History, then plays a real level-2 Flanker focus
// session and verifies the level-aware trend updates from the new history.
// Usage: node scripts/flanker-cost-trend-proof.mjs <before|after> [shotDir]
import { chromium } from "playwright-core";
import { mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const LABEL = process.argv[2] ?? "run";
const OUT = process.argv[3] ?? join(tmpdir(), "noesis-flanker-cost-trend");
const EDGE =
  process.env.EDGE_PATH ?? "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const URL = process.env.NOESIS_URL ?? "http://127.0.0.1:5193/";
const FIXED_NOW = 1_793_723_107_000;

const flankerRecord = (level, costs, id, finishedAt) => ({
  id,
  finishedAt,
  seed: 42,
  results: costs.map((cost, index) => ({
    mechanic: "flanker",
    domain: "executive_function",
    trials: 20,
    durationMs: 60_000,
    metrics: { accuracy: 1, interference_cost_ms: cost },
    summary: `Flanker: 100% accuracy, 20/20 correct, ${cost} ms interference cost.`,
    seed: 42,
    stateHash: `0123456789abcde${index}`,
    difficulty: level,
  })),
});

const seededHistory = [
  flankerRecord(3, [120, 90], "f3", "2026-11-08T10:00:00.000Z"),
  flankerRecord(2, [60, 80], "f2", "2026-11-07T10:00:00.000Z"),
  flankerRecord(1, [40], "f1", "2026-11-06T10:00:00.000Z"),
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
        levels: { nback: 2, gonogo: 2, reasoning: 2, speed: 2, switching: 2, flanker: 2 },
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
    const line = document.querySelector('[data-testid="menu-flanker-cost"]');
    return line ? (line.textContent ?? "").replace(/\s+/g, " ").trim() : null;
  });

const readPanel = () =>
  page.evaluate(() => {
    const panel = document.querySelector('[data-testid="flanker-cost-trend"]');
    if (!panel) return null;
    const rows = [...document.querySelectorAll('[data-testid^="flanker-cost-level-"]')].map(
      (row) => ({
        testId: row.getAttribute("data-testid"),
        text: (row.textContent ?? "").replace(/\s+/g, " ").trim(),
        direction: row.querySelector('[data-testid^="flanker-cost-change-"]')?.getAttribute(
          "data-direction",
        ),
      }),
    );
    return { text: (panel.textContent ?? "").replace(/\s+/g, " ").trim(), rows };
  });

await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 60_000 });
await page.waitForSelector('[data-testid="start-session"]');
await page.getByRole("button", { name: "Menu", exact: true }).click();
await page.waitForSelector('[data-testid="menu-test-flanker"]');
await page.waitForTimeout(300);
await page.screenshot({ path: join(OUT, `${LABEL}-00-choose-tests.png`), fullPage: true });
const chooseSeeded = await readChoose();

await page.getByRole("tab", { name: /history/i }).click();
await page.waitForSelector('[data-testid="menu-history"]');
await page.waitForTimeout(300);
await page.screenshot({ path: join(OUT, `${LABEL}-01-history-seeded.png`), fullPage: true });
const seededPanel = await readPanel();

// Play a real level-2 Flanker focus session from the Menu.
await page.getByRole("tab", { name: /choose a test/i }).click();
await page.getByTestId("start-flanker").click();
await page.waitForSelector('[data-testid="test-briefing"]');
const briefing = await page.$eval('[data-testid="test-briefing"]', (node) =>
  (node.textContent ?? "").replace(/\s+/g, " ").trim(),
);
await page.getByTestId("begin-test").click();
await page.waitForSelector(".stage-flanker");
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
    const session = window.__NOESIS__.getState();
    const current = session?.current;
    if (!current || current.mechanic !== "flanker" || current.phase !== "question") {
      return false;
    }
    const trial = current.trials[current.index];
    // On the last block, slow the incongruent trials to make interference cost visible.
    if (session.blockIndex === 2 && !trial.congruent) {
      window.__NOESIS__.dispatch({ type: "advance", ms: 300 });
    }
    window.__NOESIS__.dispatch({
      type: "answer",
      option: trial.centre === "left" ? 0 : 1,
    });
    return true;
  });
  await page.evaluate(() => window.__NOESIS__.dispatch({ type: "advance", ms: 500 }));
  if (!answered) await page.waitForTimeout(10);
}
await page.waitForSelector("text=Your blocks, separately", { timeout: 15000 });
const played = await page.evaluate(() => {
  const state = window.__NOESIS__.getState();
  return {
    mechanics: state?.results.map((result) => result.mechanic) ?? [],
    difficulties: state?.results.map((result) => result.difficulty ?? null) ?? [],
    interference: state?.results.map(
      (result) => result.metrics.interference_cost_ms ?? null,
    ) ?? [],
    note: document.querySelector('[data-testid="flanker-interference-note"]')
      ? "present"
      : null,
  };
});

await page.getByRole("button", { name: "Menu", exact: true }).click();
await page.getByRole("tab", { name: /history/i }).click();
await page.waitForSelector('[data-testid="menu-history"]');
await page.waitForTimeout(300);
await page.screenshot({ path: join(OUT, `${LABEL}-02-history-after-play.png`), fullPage: true });
const playedPanel = await readPanel();
await page.getByRole("tab", { name: /choose a test/i }).click();
await page.waitForSelector('[data-testid="menu-test-flanker"]');
await page.waitForTimeout(300);
await page.screenshot({ path: join(OUT, `${LABEL}-03-choose-tests-after-play.png`), fullPage: true });
const chooseAfter = await readChoose();

const report = {
  label: LABEL,
  briefingHasInterference: /interference control/i.test(briefing),
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
