// Scripted results-copy playthrough: completes a quick N-back + Go/No-Go session with
// exactly one commission and fast go reactions, then reads the summary and tile copy.
// Usage: node scripts/results-copy-proof.mjs <before|after> [shotDir]
import { chromium } from "playwright-core";
import { mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const LABEL = process.argv[2] ?? "run";
const OUT = process.argv[3] ?? join(tmpdir(), "noesis-results-copy");
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
    // Drive the logical clock only through dispatch, so reactions are exactly 15 ms.
    window.requestAnimationFrame = () => 0;
    window.cancelAnimationFrame = () => {};
    if (sessionStorage.getItem("noesis.resultscopy.seeded") === "1") return;
    sessionStorage.setItem("noesis.resultscopy.seeded", "1");
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
        difficulty: 2,
        sessionLength: "quick",
        motivationMode: true,
        largeText: false,
        highContrast: false,
        hideClock: false,
        weeklyGoal: 3,
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
await page.click('[data-testid="start-session"]');
await page.waitForSelector('[data-testid="session-root"]');
await page.waitForTimeout(300);

let commissioned = false;
for (let step = 0; step < 8000; step += 1) {
  const snap = await page.evaluate(() => {
    const state = window.__NOESIS__.getState();
    const current = state?.current;
    return state
      ? {
          phase: state.phase,
          mechanic: current?.mechanic ?? null,
          currentPhase: current?.phase ?? null,
          index: current?.index ?? null,
          go: current?.trials?.[current.index]?.go ?? null,
          target: current?.trials?.[current.index]?.target ?? null,
          responded: current?.respondedThisTrial ?? false,
        }
      : null;
  });
  if (!snap) throw new Error("session disappeared");
  if (snap.phase === "complete") break;
  if (snap.phase === "block_complete") {
    const bank = await page.$('[data-testid="bank-next"]');
    if (bank) await bank.click();
    else {
      const next = await page.$('[data-testid="next-block"]');
      if (next) await next.click();
    }
    await page.waitForTimeout(80);
    continue;
  }
  if (snap.phase !== "running") continue;

  if (snap.mechanic === "nback") {
    if (snap.currentPhase === "trial" && snap.target && !snap.responded) {
      await page.evaluate(() => window.__NOESIS__.dispatch({ type: "respond" }));
    } else {
      await page.evaluate(() => window.__NOESIS__.dispatch({ type: "advance", ms: 500 }));
    }
    continue;
  }

  if (snap.mechanic === "gonogo") {
    const inWindow = snap.currentPhase === "stimulus" || snap.currentPhase === "response";
    const wantsCommission = snap.go === false && !commissioned;
    if (inWindow && !snap.responded && (snap.go === true || wantsCommission)) {
      await page.evaluate(() => window.__NOESIS__.dispatch({ type: "advance", ms: 15 }));
      if (wantsCommission) commissioned = true;
      await page.evaluate(() => window.__NOESIS__.dispatch({ type: "respond" }));
    } else {
      await page.evaluate(() => window.__NOESIS__.dispatch({ type: "advance", ms: 200 }));
    }
    continue;
  }

  await page.evaluate(() => window.__NOESIS__.dispatch({ type: "advance", ms: 500 }));
}

await page.waitForSelector("text=Your blocks, separately", { timeout: 15000 });
await page.waitForTimeout(400);
await page.screenshot({ path: join(OUT, `${LABEL}-01-results-copy.png`), fullPage: true });

const report = await page.evaluate(() => {
  const state = window.__NOESIS__.getState();
  const gonogo = state?.results.find((result) => result.mechanic === "gonogo");
  const cards = [...document.querySelectorAll(".result-card")];
  const card = cards.find((entry) => entry.querySelector("h2")?.textContent === "Go / No-Go");
  const metrics = card
    ? [...card.querySelectorAll(".metric")].map((entry) => ({
        label: entry.querySelector("dt")?.textContent ?? "",
        value: entry.querySelector("dd")?.textContent ?? "",
      }))
    : [];
  return {
    summary: gonogo?.summary ?? null,
    meanGoReaction: gonogo?.metrics.mean_go_reaction_ms ?? null,
    commissions: gonogo?.metrics.commissions ?? null,
    tileReaction: metrics.find((entry) => entry.label === "Reaction time")?.value ?? null,
    metrics,
  };
});

const output = {
  label: LABEL,
  ...report,
  singularCopy: /1 impulse error,/.test(report.summary ?? ""),
  pluralCopy: /1 impulse errors/.test(report.summary ?? ""),
  tileMatchesSummary:
    report.tileReaction === `${Math.round(report.meanGoReaction ?? -1)} ms`,
  consoleErrors,
  shots: OUT,
};
await writeFile(join(OUT, `${LABEL}-results-copy-report.json`), `${JSON.stringify(output, null, 2)}\n`, "utf8");
console.log(JSON.stringify(output, null, 2));
await browser.close();
