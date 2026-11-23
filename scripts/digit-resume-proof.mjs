// Scripted Digit Span focus playthrough with a mid-session reload.
// Verifies the adaptive level, the persisted snapshot, Resume session and completion.
// Usage: node scripts/digit-resume-proof.mjs [shotDir]
import { chromium } from "playwright-core";
import { mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const OUT = process.argv[2] ?? join(tmpdir(), "noesis-digit-resume");
const EDGE =
  process.env.EDGE_PATH ?? "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const URL = process.env.NOESIS_URL ?? "http://127.0.0.1:5198/";
const FIXED_NOW = 1_793_723_107_000;
const ADAPTIVE_LEVEL = 2;

await mkdir(OUT, { recursive: true });
const browser = await chromium.launch({ executablePath: EDGE, headless: true });
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
});
await context.addInitScript(
  ({ fixedNow, level }) => {
    Date.now = () => fixedNow;
    if (sessionStorage.getItem("noesis.digitresume.seeded") === "1") return;
    sessionStorage.setItem("noesis.digitresume.seeded", "1");
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
          spatial: level,
          digit: level,
        },
        log: [],
      }),
    );
    localStorage.removeItem("noesis.history.v1");
    localStorage.removeItem("noesis.session.v1");
  },
  { fixedNow: FIXED_NOW, level: ADAPTIVE_LEVEL },
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
await page.getByTestId("start-digit").click();
await page.waitForSelector('[data-testid="test-briefing"]');
const briefing = await page.$eval('[data-testid="test-briefing"]', (node) =>
  (node.textContent ?? "").replace(/\s+/g, " ").trim(),
);
await page.getByTestId("begin-test").click();
await page.waitForSelector(".stage-digit");
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

async function reachRecall() {
  for (let step = 0; step < 100; step += 1) {
    const phase = await page.evaluate(() => {
      const state = window.__NOESIS__.getState();
      return state?.current ? state.current.phase : `session:${state?.phase ?? "none"}`;
    });
    if (phase === "recall" || phase === "complete" || phase === "session:complete") return true;
    await page.evaluate(() => window.__NOESIS__.dispatch({ type: "advance", ms: 800 }));
  }
  return false;
}

async function answerTrial() {
  if (!(await reachRecall())) throw new Error("trial never reached recall");
  const ready = await page.evaluate(() => {
    const current = window.__NOESIS__.getState()?.current;
    return Boolean(current && current.phase === "recall");
  });
  if (!ready) return;
  const span = await page.evaluate(() => {
    const current = window.__NOESIS__.getState()?.current;
    return current ? (current.trials[current.index]?.sequence.length ?? 0) : 0;
  });
  for (let digitIndex = 0; digitIndex < span; digitIndex += 1) {
    const digit = await page.evaluate(() => {
      const current = window.__NOESIS__.getState()?.current;
      const trial = current?.trials[current.index];
      if (!trial) return null;
      const sequence = trial.direction === "backward" ? [...trial.sequence].reverse() : trial.sequence;
      return sequence[current.selected.length] ?? null;
    });
    if (digit === null) throw new Error("missing next digit");
    await page.evaluate(
      (option) => window.__NOESIS__.dispatch({ type: "answer", option }),
      digit,
    );
    await page.evaluate(() => window.__NOESIS__.dispatch({ type: "advance", ms: 800 }));
  }
}

for (let trial = 0; trial < 3; trial += 1) {
  await answerTrial();
}
await page.waitForTimeout(300);
const mid = await snapshot();
await page.screenshot({ path: join(OUT, "01-digit-mid-session.png") });

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
  trialPhase: stored?.state?.current?.phase ?? null,
};

await page.reload({ waitUntil: "domcontentloaded", timeout: 60_000 });
await page.waitForSelector('[data-testid="start-session"]');
const resumeLabel = (await page.getByTestId("start-session").innerText())
  .replace(/\s+/g, " ")
  .trim();
await page.screenshot({ path: join(OUT, "02-home-after-reload.png"), fullPage: true });
await page.getByTestId("start-session").click();
await page.waitForSelector('[data-testid="session-root"]');
if (await page.$('[data-testid="test-briefing"]')) {
  await page.getByTestId("begin-test").click();
  await page.waitForSelector(".stage-digit");
}
await page.waitForTimeout(300);
const resumed = await snapshot();
await page.screenshot({ path: join(OUT, "03-digit-resumed.png") });

let guard = 0;
while (guard < 6000) {
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
  await answerTrial();
}
await page.waitForSelector("text=Your blocks, separately", { timeout: 15000 });
await page.waitForTimeout(300);
await page.screenshot({ path: join(OUT, "04-digit-results.png"), fullPage: true });
const results = await page.evaluate(() => {
  const state = window.__NOESIS__.getState();
  return {
    mechanics: state?.results.map((result) => result.mechanic) ?? [],
    difficulties: state?.results.map((result) => result.difficulty ?? null) ?? [],
    summaries: state?.results.map((result) => result.summary) ?? [],
    metrics: state?.results.map((result) => ({
      accuracy: result.metrics.accuracy,
      mean_span: result.metrics.mean_span,
      max_span: result.metrics.max_span,
      forward_accuracy: result.metrics.forward_accuracy,
      backward_accuracy: result.metrics.backward_accuracy,
    })) ?? [],
  };
});

const report = {
  briefingHasDigit: /digit/i.test(briefing),
  mid,
  stored: storedSummary,
  resumeLabel,
  resumed,
  results,
  consoleErrors,
  shots: OUT,
};
await writeFile(join(OUT, "digit-resume-report.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(JSON.stringify(report, null, 2));
await browser.close();
