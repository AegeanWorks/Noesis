// Scripted Flanker focus playthrough with a mid-session reload and result-note capture.
// Usage: node scripts/flanker-resume-proof.mjs <before|after> [shotDir]
import { chromium } from "playwright-core";
import { mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const LABEL = process.argv[2] ?? "run";
const OUT = process.argv[3] ?? join(tmpdir(), "noesis-flanker-resume");
const EDGE =
  process.env.EDGE_PATH ?? "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const URL = process.env.NOESIS_URL ?? "http://127.0.0.1:5192/";
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
    if (sessionStorage.getItem("noesis.flankerresume.seeded") === "1") return;
    sessionStorage.setItem("noesis.flankerresume.seeded", "1");
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
await page.goto(URL, { waitUntil: "domcontentloaded" });
await page.waitForSelector('[data-testid="start-session"]');
await page.getByRole("button", { name: "Menu", exact: true }).click();
await page.getByTestId("start-flanker").click();
await page.waitForSelector('[data-testid="test-briefing"]');
const briefing = await page.$eval('[data-testid="test-briefing"]', (node) =>
  (node.textContent ?? "").replace(/\s+/g, " ").trim(),
);
await page.getByTestId("begin-test").click();
await page.waitForSelector(".stage-flanker");
await page.waitForTimeout(300);

async function snapshot() {
  return page.evaluate(() => {
    const state = window.__NOESIS__.getState();
    const view = window.__NOESIS__.getView();
    return state && view
      ? {
          seed: state.config.seed,
          phase: state.phase,
          blockIndex: state.blockIndex,
          blockCount: state.config.blocks.length,
          blockMechanics: state.config.blocks.map((block) => block.mechanic),
          blockDifficulty: state.config.blocks.map((block) => block.difficulty),
          mechanic: state.current?.mechanic ?? null,
          trialIndex: state.current?.index ?? null,
          trialPhase: state.current?.phase ?? null,
          header: (document.querySelector(".session-header .eyebrow")?.textContent ?? "")
            .replace(/\s+/g, " ")
            .trim(),
        }
      : null;
  });
}

async function answerCorrect() {
  return page.evaluate(() => {
    const current = window.__NOESIS__.getState()?.current;
    if (!current || current.mechanic !== "flanker" || current.phase !== "question") {
      return false;
    }
    const trial = current.trials[current.index];
    window.__NOESIS__.dispatch({
      type: "answer",
      option: trial.centre === "left" ? 0 : 1,
    });
    return true;
  });
}

for (let step = 0; step < 8; step += 1) {
  await answerCorrect();
  await page.evaluate(() => window.__NOESIS__.dispatch({ type: "advance", ms: 500 }));
}
await page.waitForTimeout(300);
const mid = await snapshot();
await page.screenshot({ path: join(OUT, `${LABEL}-01-flanker-mid-session.png`) });

await page.waitForTimeout(1_800); // let the 1.5 s snapshot interval write
const stored = await page.evaluate(() =>
  JSON.parse(localStorage.getItem("noesis.session.v1") ?? "null"),
);
const storedSummary = {
  phase: stored?.state?.phase ?? null,
  seed: stored?.state?.config?.seed ?? null,
  blockIndex: stored?.state?.blockIndex ?? null,
  mechanic: stored?.state?.current?.mechanic ?? null,
  difficulty: stored?.state?.config?.blocks?.[stored?.state?.blockIndex]?.difficulty ?? null,
  trialIndex: stored?.state?.current?.index ?? null,
};

await page.reload({ waitUntil: "domcontentloaded" });
await page.waitForSelector('[data-testid="start-session"]');
const resumeLabel = (await page.getByTestId("start-session").innerText()).replace(/\s+/g, " ").trim();
await page.screenshot({ path: join(OUT, `${LABEL}-02-home-after-reload.png`), fullPage: true });
await page.getByTestId("start-session").click();
await page.waitForSelector('[data-testid="session-root"]');
await page.waitForTimeout(300);
const resumed = await snapshot();
await page.screenshot({ path: join(OUT, `${LABEL}-03-flanker-resumed.png`) });

let guard = 0;
while (guard < 4000) {
  guard += 1;
  const state = await page.evaluate(() => {
    const current = window.__NOESIS__.getState();
    return current ? { phase: current.phase } : null;
  });
  if (!state) throw new Error("session disappeared after resume");
  if (state.phase === "complete") break;
  if (state.phase === "block_complete") {
    const next = await page.$('[data-testid="next-block"]');
    if (next) await next.click();
    await page.waitForTimeout(80);
    continue;
  }
  if (state.phase !== "running") continue;
  await answerCorrect();
  await page.evaluate(() => window.__NOESIS__.dispatch({ type: "advance", ms: 500 }));
}
await page.waitForSelector("text=Your blocks, separately", { timeout: 15000 });
await page.waitForTimeout(300);
await page.screenshot({ path: join(OUT, `${LABEL}-04-flanker-results.png`), fullPage: true });
const results = await page.evaluate(() => {
  const state = window.__NOESIS__.getState();
  const note = document.querySelector('[data-testid="flanker-interference-note"]');
  return {
    mechanics: state?.results.map((result) => result.mechanic) ?? [],
    difficulties: state?.results.map((result) => result.difficulty ?? null) ?? [],
    interference: state?.results.map((result) => result.metrics.interference_cost_ms ?? null) ?? [],
    note: note ? (note.textContent ?? "").replace(/\s+/g, " ").trim() : null,
  };
});

const report = {
  label: LABEL,
  briefingHasInterference: /interference control/i.test(briefing),
  mid,
  stored: storedSummary,
  resumeLabel,
  resumed,
  results,
  consoleErrors,
  shots: OUT,
};
await writeFile(join(OUT, `${LABEL}-report.json`), `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(JSON.stringify(report, null, 2));
await browser.close();
