// Scripted feedback-state playthrough: drives a focus session to a target/no-go trial,
// captures the feedback frame and reports the stage attributes. Requires `npm run dev`.
// Usage: node scripts/feedback-proof.mjs <before|after> [shotDir]
import { chromium } from "playwright-core";
import { mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const LABEL = process.argv[2] ?? "run";
const OUT = process.argv[3] ?? join(tmpdir(), "noesis-feedback-proof");
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
    if (sessionStorage.getItem("noesis.feedback.seeded") === "1") return;
    sessionStorage.setItem("noesis.feedback.seeded", "1");
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

async function home() {
  await page.getByRole("button", { name: "Noesis home" }).click();
  await page.waitForSelector('[data-testid="start-session"]');
}

async function handleBlockComplete() {
  const bank = await page.$('[data-testid="bank-next"]');
  if (bank) {
    await bank.click();
    return;
  }
  const next = await page.$('[data-testid="next-block"]');
  if (next) await next.click();
}

async function driveToFeedback(mechanic) {
  for (let step = 0; step < 8000; step += 1) {
    const snap = await page.evaluate(() => {
      const state = window.__NOESIS__.getState();
      return state
        ? {
            phase: state.phase,
            currentPhase: state.current?.phase ?? null,
            currentMechanic: state.current?.mechanic ?? null,
            index: state.current?.index ?? null,
            go: state.current?.trials?.[state.current.index]?.go ?? null,
            target: state.current?.trials?.[state.current.index]?.target ?? null,
            responded: state.current?.respondedThisTrial ?? null,
          }
        : null;
    });
    if (!snap) throw new Error("session disappeared");
    if (snap.phase === "complete") throw new Error("session completed before feedback capture");
    if (snap.phase === "block_complete") {
      await handleBlockComplete();
      await page.waitForTimeout(80);
      continue;
    }
    if (snap.phase !== "running") continue;
    const shouldRespond =
      mechanic === "nback"
        ? snap.currentMechanic === "nback" &&
          snap.currentPhase === "trial" &&
          snap.target === true &&
          snap.responded === false
        : snap.currentMechanic === "gonogo" &&
          (snap.currentPhase === "stimulus" || snap.currentPhase === "response") &&
          snap.go === false &&
          snap.responded === false;
    if (shouldRespond) {
      await page.evaluate(() => window.__NOESIS__.dispatch({ type: "respond" }));
      await page.waitForFunction(
        () =>
          window.__NOESIS__.getView()?.mechanic?.phase === "feedback" &&
          (document.querySelector('[data-testid="feedback"]')?.textContent ?? "").trim().length > 0,
        undefined,
        { timeout: 3000 },
      );
      return;
    }
    await page.evaluate(() => window.__NOESIS__.dispatch({ type: "advance", ms: 400 }));
  }
  throw new Error(`no capture point reached for ${mechanic}`);
}

async function snapshot() {
  return page.evaluate(() => {
    const view = window.__NOESIS__.getView();
    const stage = document.querySelector(".stage");
    return {
      phase: view?.mechanic?.phase ?? null,
      mechanic: view?.mechanic?.mechanic ?? null,
      feedback: view?.mechanic?.feedback ?? null,
      tone: view?.mechanic?.feedbackTone ?? null,
      stimulus: view?.mechanic?.stimulus ?? null,
      stageFeedback: stage?.getAttribute("data-feedback") ?? null,
      feedbackText: (document.querySelector('[data-testid="feedback"]')?.textContent ?? "").trim(),
    };
  });
}

const report = { label: LABEL, consoleErrors, captures: {} };

await page.getByRole("button", { name: "Focus N-back" }).click();
await page.waitForSelector('[data-testid="session-root"]');
await driveToFeedback("nback");
report.captures.nback = await snapshot();
await page.screenshot({ path: join(OUT, `${LABEL}-01-nback-hit-feedback.png`) });

await page.screenshot({ path: join(OUT, `${LABEL}-01b-nback-feedback-zoom.png`), clip: { x: 0, y: 250, width: 390, height: 560 } });

await home();
await page.getByRole("button", { name: "Focus Go / No-Go" }).click();
await page.waitForSelector('[data-testid="session-root"]');
await driveToFeedback("gonogo");
report.captures.gonogo = await snapshot();
await page.screenshot({ path: join(OUT, `${LABEL}-02-gonogo-commission-feedback.png`) });

report.shots = OUT;
await writeFile(join(OUT, `${LABEL}-feedback-report.json`), `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(JSON.stringify(report, null, 2));
await browser.close();
