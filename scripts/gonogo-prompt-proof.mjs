// Scripted Go/No-Go response-window playthrough: reaches the blank response phase of a
// no-go trial and of a go trial, records the prompt and completes the block.
// Usage: node scripts/gonogo-prompt-proof.mjs <before|after> [shotDir]
import { chromium } from "playwright-core";
import { mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const LABEL = process.argv[2] ?? "run";
const OUT = process.argv[3] ?? join(tmpdir(), "noesis-gonogo-prompt");
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
    if (sessionStorage.getItem("noesis.gonogo.seeded") === "1") return;
    sessionStorage.setItem("noesis.gonogo.seeded", "1");
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
await page.getByRole("button", { name: "Focus Go / No-Go" }).click();
await page.waitForSelector('[data-testid="session-root"]');

const trials = await page.evaluate(() =>
  window.__NOESIS__.getState()?.current?.trials.map((trial) => trial.go) ?? [],
);
const noGoIndex = trials.findIndex((go, index) => !go && index > 0);
if (noGoIndex < 0) throw new Error("trial mix lacked a no-go trial after the opening");
const goIndex = trials.findIndex((go, index) => go && index > noGoIndex);
if (goIndex < 0) throw new Error("trial mix lacked a go trial after the no-go trial");

async function readState() {
  return page.evaluate(() => {
    const state = window.__NOESIS__.getState();
    const view = window.__NOESIS__.getView();
    return state && view
      ? {
          phase: state.phase,
          index: state.current?.index ?? null,
          currentPhase: state.current?.phase ?? null,
          phaseElapsed: state.current?.phaseElapsed ?? null,
          phaseDuration: state.current?.phaseDuration ?? null,
          canRespond: view.mechanic?.canRespond ?? null,
          stimulus: view.mechanic?.stimulus ?? null,
          prompt: view.mechanic?.prompt ?? null,
          feedback: view.mechanic?.feedback ?? null,
          feedbackTone: view.mechanic?.feedbackTone ?? null,
        }
      : null;
  });
}

async function reachResponse(targetIndex) {
  for (let step = 0; step < 4000; step += 1) {
    const snap = await readState();
    if (!snap) throw new Error("no state");
    if (snap.phase === "complete") throw new Error("session completed");
    if (snap.phase === "block_complete") {
      const bank = await page.$('[data-testid="bank-next"]');
      if (bank) await bank.click();
      else {
        const next = await page.$('[data-testid="next-block"]');
        if (next) await next.click();
      }
      await page.waitForTimeout(60);
      continue;
    }
    if (snap.phase !== "running") continue;
    if (snap.index === targetIndex) {
      if (snap.currentPhase === "response") return snap;
      if (snap.currentPhase === "stimulus") {
        const jump = Math.max(1, Math.round(snap.phaseDuration - snap.phaseElapsed));
        await page.evaluate((ms) => window.__NOESIS__.dispatch({ type: "advance", ms }), jump);
        const atResponse = await readState();
        if (atResponse?.currentPhase === "response") return atResponse;
      }
      if (snap.currentPhase === "feedback" || snap.currentPhase === "iti") {
        throw new Error(`missed response window at index ${targetIndex}`);
      }
      continue;
    }
    if (snap.index > targetIndex) throw new Error(`passed index ${targetIndex}`);
    await page.evaluate(() => window.__NOESIS__.dispatch({ type: "advance", ms: 100 }));
  }
  throw new Error(`never reached index ${targetIndex}`);
}

const noGo = await reachResponse(noGoIndex);
await page.screenshot({ path: join(OUT, `${LABEL}-01-gonogo-nogo-response.png`) });
await page.evaluate(() => window.__NOESIS__.dispatch({ type: "respond" }));
const noGoResponse = await page.evaluate(() => {
  const state = window.__NOESIS__.getState();
  const response = state?.current?.responses.at(-1);
  return response ? { kind: response.kind, go: response.go, correct: response.correct } : null;
});

const go = await reachResponse(goIndex);
await page.screenshot({ path: join(OUT, `${LABEL}-02-gonogo-go-response.png`) });

for (let step = 0; step < 200; step += 1) {
  const snap = await page.evaluate(() => window.__NOESIS__.getState()?.phase ?? null);
  if (snap === "block_complete" || snap === "complete") break;
  await page.evaluate(() => window.__NOESIS__.dispatch({ type: "advance", ms: 10000 }));
}
const result = await page.evaluate(() => {
  const state = window.__NOESIS__.getState();
  return {
    phase: state?.phase ?? null,
    summary: state?.results?.[0]?.summary ?? null,
    commissions: state?.results?.[0]?.metrics?.commissions ?? null,
  };
});

const report = {
  label: LABEL,
  seed: await page.evaluate(() => window.__NOESIS__.getState()?.config.seed ?? null),
  noGoIndex,
  goIndex,
  noGo,
  go,
  promptsEqual: noGo.prompt === go.prompt,
  noGoResponse,
  result,
  consoleErrors,
  shots: OUT,
};
await writeFile(join(OUT, `${LABEL}-prompt-report.json`), `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(JSON.stringify(report, null, 2));
await browser.close();
