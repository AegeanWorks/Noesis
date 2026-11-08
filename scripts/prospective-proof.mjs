// Scripted Prospective Memory focus proof: Menu card, briefing, played three-block
// session, cue/false-alarm metrics and screenshots. Before the feature the card is absent.
// Usage: node scripts/prospective-proof.mjs <before|after> [shotDir]
import { chromium } from "playwright-core";
import { mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const LABEL = process.argv[2] ?? "run";
const OUT = process.argv[3] ?? join(tmpdir(), "noesis-prospective");
const EDGE =
  process.env.EDGE_PATH ?? "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const URL = process.env.NOESIS_URL ?? "http://127.0.0.1:5203/";
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
    if (sessionStorage.getItem("noesis.prospective.seeded") === "1") return;
    sessionStorage.setItem("noesis.prospective.seeded", "1");
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
await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 60_000 });
await page.waitForSelector('[data-testid="start-session"]');
await page.getByRole("button", { name: "Menu", exact: true }).click();
await page.waitForSelector('[data-testid="menu-test-nback"]');
await page.waitForTimeout(300);
const menuHasProspective = Boolean(await page.$('[data-testid="menu-test-prospective"]'));
await page.screenshot({ path: join(OUT, `${LABEL}-01-menu.png`), fullPage: true });

const report = { label: LABEL, menuHasProspective, consoleErrors, shots: OUT };
if (!menuHasProspective) {
  console.log(JSON.stringify(report, null, 2));
  await writeFile(join(OUT, `${LABEL}-report.json`), `${JSON.stringify(report, null, 2)}\n`, "utf8");
  await browser.close();
  process.exit(0);
}

await page.getByTestId("start-prospective").click();
await page.waitForSelector('[data-testid="test-briefing"]');
const briefing = await page.$eval('[data-testid="test-briefing"]', (node) =>
  (node.textContent ?? "").replace(/\s+/g, " ").trim(),
);
await page.getByTestId("begin-test").click();
await page.waitForSelector(".stage-prospective");
await page.waitForTimeout(300);
await page.screenshot({ path: join(OUT, `${LABEL}-02-prospective-stage.png`) });

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
await page.screenshot({ path: join(OUT, `${LABEL}-03-prospective-results.png`), fullPage: true });
const results = await page.evaluate(() => {
  const state = window.__NOESIS__.getState();
  return {
    mechanics: state?.results.map((result) => result.mechanic) ?? [],
    difficulties: state?.results.map((result) => result.difficulty ?? null) ?? [],
    summaries: state?.results.map((result) => result.summary) ?? [],
    metrics: state?.results.map((result) => ({
      accuracy: result.metrics.accuracy,
      ongoing_accuracy: result.metrics.ongoing_accuracy,
      cue_hits: result.metrics.cue_hits,
      cue_trials: result.metrics.cue_trials,
      false_alarms: result.metrics.false_alarms,
      mean_response_ms: result.metrics.mean_response_ms,
    })) ?? [],
  };
});

Object.assign(report, {
  briefingHasProspective: /prospective|delayed/i.test(briefing),
  results,
});
console.log(JSON.stringify(report, null, 2));
await writeFile(join(OUT, `${LABEL}-report.json`), `${JSON.stringify(report, null, 2)}\n`, "utf8");
await browser.close();
