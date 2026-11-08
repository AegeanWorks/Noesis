// Scripted Go/No-Go sensitivity proof: plays a real three-block focus session with a few
// deliberate commissions, then captures the result sensitivity tile and response-bias note.
// Before the feature the tile and note are absent.
// Usage: node scripts/gonogo-dprime-proof.mjs <before|after> [shotDir]
import { chromium } from "playwright-core";
import { mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const LABEL = process.argv[2] ?? "run";
const OUT = process.argv[3] ?? join(tmpdir(), "noesis-gonogo-dprime");
const EDGE =
  process.env.EDGE_PATH ?? "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const URL = process.env.NOESIS_URL ?? "http://127.0.0.1:5219/";
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
    if (sessionStorage.getItem("noesis.gonogodprime.seeded") === "1") return;
    sessionStorage.setItem("noesis.gonogodprime.seeded", "1");
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
await page.getByTestId("start-gonogo").click();
await page.waitForSelector('[data-testid="test-briefing"]');
await page.getByTestId("begin-test").click();
await page.waitForSelector(".stage");
for (let step = 0; step < 9000; step += 1) {
  const state = await page.evaluate(() => {
    const current = window.__NOESIS__.getState();
    return current ? { phase: current.phase } : null;
  });
  if (!state) throw new Error("session disappeared");
  if (state.phase === "complete") break;
  if (state.phase === "block_complete") {
    const next = await page.$('[data-testid="next-block"]');
    if (next) await next.click();
    await page.waitForTimeout(120);
    const begin = await page.$('[data-testid="begin-test"]');
    if (begin) {
      await begin.click();
      await page.waitForSelector(".stage");
      await page.waitForTimeout(80);
    }
    continue;
  }
  if (state.phase !== "running") continue;
  await page.evaluate(() => {
    const current = window.__NOESIS__.getState()?.current;
    if (!current || current.mechanic !== "gonogo") return;
    const canRespond =
      (current.phase === "stimulus" || current.phase === "response") &&
      !current.respondedThisTrial;
    if (!canRespond) return;
    const trial = current.trials[current.index];
    // Correct Go responses, plus a few deliberate commissions on No-Go trials so the
    // signal-detection sensitivity is based on both hits and false alarms.
    if (trial.go || current.index % 6 === 0) {
      window.__NOESIS__.dispatch({ type: "respond" });
    }
  });
  await page.evaluate(() => window.__NOESIS__.dispatch({ type: "advance", ms: 100 }));
}
await page.waitForSelector("text=Your blocks, separately", { timeout: 15000 });
await page.waitForTimeout(300);
await page.screenshot({ path: join(OUT, `${LABEL}-01-results.png`), fullPage: true });
const report = await page.evaluate(() => {
  const state = window.__NOESIS__.getState();
  const note = document.querySelector('[data-testid="gonogo-dprime-note"]');
  return {
    mechanics: state?.results.map((result) => result.mechanic) ?? [],
    difficulties: state?.results.map((result) => result.difficulty ?? null) ?? [],
    metrics: state?.results.map((result) => ({
      accuracy: result.metrics.accuracy,
      commissions: result.metrics.commissions,
      d_prime: result.metrics.d_prime ?? null,
    })) ?? [],
    note: note ? (note.textContent ?? "").replace(/\s+/g, " ").trim() : null,
  };
});

const output = { label: LABEL, ...report, consoleErrors, shots: OUT };
await writeFile(join(OUT, `${LABEL}-report.json`), `${JSON.stringify(output, null, 2)}\n`, "utf8");
console.log(JSON.stringify(output, null, 2));
await browser.close();
