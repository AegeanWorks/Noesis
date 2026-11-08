// Scripted confidence-check proof: start a Paired Associates focus session, select a
// confidence level in the briefing, complete three blocks, and capture the results note.
// Usage: node scripts/confidence-proof.mjs <before|after> [shotDir]
import { chromium } from "playwright-core";
import { mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const LABEL = process.argv[2] ?? "run";
const OUT = process.argv[3] ?? join(tmpdir(), "noesis-confidence");
const EDGE =
  process.env.EDGE_PATH ?? "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const URL = process.env.NOESIS_URL ?? "http://127.0.0.1:5211/";
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
    if (sessionStorage.getItem("noesis.confidence.seeded") === "1") return;
    sessionStorage.setItem("noesis.confidence.seeded", "1");
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
await page.getByTestId("start-paired").click();
await page.waitForSelector('[data-testid="test-briefing"]');

const confidenceButton = await page.$('[data-testid="confidence-high"]');
if (confidenceButton) {
  await confidenceButton.click();
  await page.waitForTimeout(100);
}
const confidenceSelected = await page.evaluate(() => {
  const button = document.querySelector('[data-testid="confidence-high"]');
  return button ? button.getAttribute("aria-pressed") : null;
});
await page.screenshot({ path: join(OUT, `${LABEL}-01-briefing.png`), fullPage: true });

await page.waitForTimeout(1_800); // let the snapshot include the confidence choice
await page.reload({ waitUntil: "domcontentloaded", timeout: 60_000 });
await page.waitForSelector('[data-testid="start-session"]');
await page.getByTestId("start-session").click();
await page.waitForSelector('[data-testid="session-root"]');
await page.waitForTimeout(300);
const confidencePersisted = await page.evaluate(() => {
  const button = document.querySelector('[data-testid="confidence-high"]');
  return button ? button.getAttribute("aria-pressed") : null;
});
await page.screenshot({ path: join(OUT, `${LABEL}-02-resumed-briefing.png`), fullPage: true });

if (await page.$('[data-testid="begin-test"]')) {
  await page.getByTestId("begin-test").click();
}
await page.waitForSelector(".stage-paired");
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
    await page.waitForTimeout(120);
    const confidence = await page.$('[data-testid="confidence-high"]');
    if (confidence) await confidence.click();
    const begin = await page.$('[data-testid="begin-test"]');
    if (begin) await begin.click();
    await page.waitForTimeout(80);
    continue;
  }
  if (state.phase !== "running") continue;
  await page.evaluate(() => {
    const current = window.__NOESIS__.getState()?.current;
    if (!current || current.mechanic !== "paired") return;
    if (current.phase === "study") {
      window.__NOESIS__.dispatch({ type: "advance", ms: 2_000 });
      return;
    }
    if (current.phase !== "test") return;
    const trial = current.trials[current.index];
    window.__NOESIS__.dispatch({ type: "advance", ms: 400 });
    window.__NOESIS__.dispatch({ type: "answer", option: trial.correctIndex });
    window.__NOESIS__.dispatch({ type: "advance", ms: 900 });
  });
  await page.waitForTimeout(5);
}
await page.waitForSelector("text=Your blocks, separately", { timeout: 15000 });
await page.waitForTimeout(300);
await page.screenshot({ path: join(OUT, `${LABEL}-02-results.png`), fullPage: true });
const results = await page.evaluate(() => {
  const state = window.__NOESIS__.getState();
  const notes = [...document.querySelectorAll('[data-testid^="confidence-note-"]')].map(
    (node) => (node.textContent ?? "").replace(/\s+/g, " ").trim(),
  );
  return {
    mechanics: state?.results.map((result) => result.mechanic) ?? [],
    notes,
  };
});

await page.getByRole("button", { name: "Menu", exact: true }).click();
await page.getByRole("tab", { name: /history/i }).click();
await page.waitForSelector('[data-testid="menu-history"]');
await page.waitForTimeout(300);
await page.screenshot({ path: join(OUT, `${LABEL}-03-history.png`), fullPage: true });
const historySummary = await page.evaluate(() => {
  const card = document.querySelector('[data-testid="confidence-summary"]');
  return card ? (card.textContent ?? "").replace(/\s+/g, " ").trim() : null;
});

const report = {
  label: LABEL,
  confidenceSelected,
  confidencePersisted,
  results,
  historySummary,
  consoleErrors,
  shots: OUT,
};
await writeFile(join(OUT, `${LABEL}-report.json`), `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(JSON.stringify(report, null, 2));
await browser.close();
