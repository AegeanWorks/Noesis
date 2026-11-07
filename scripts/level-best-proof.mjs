// Scripted level-aware best/near-best playthrough: seeds a level-1 and a level-3 best,
// plays a level-1 N-back block to 85%, and reads the home best claim and near-best cue.
// Usage: node scripts/level-best-proof.mjs <before|after> [shotDir]
import { chromium } from "playwright-core";
import { mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const LABEL = process.argv[2] ?? "run";
const OUT = process.argv[3] ?? join(tmpdir(), "noesis-level-best");
const EDGE =
  process.env.EDGE_PATH ?? "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const URL = process.env.NOESIS_URL ?? "http://127.0.0.1:5174/";
const FIXED_NOW = 1_793_723_107_000;
const HIT_TARGETS = 2;

const seededResult = (accuracy, difficulty) => ({
  mechanic: "nback",
  domain: "working_memory",
  trials: 20,
  durationMs: 60_000,
  metrics: { accuracy },
  summary: `2-back: ${Math.round(accuracy * 100)}% accuracy.`,
  seed: 42,
  stateHash: "0123456789abcdef",
  difficulty,
});

const history = [
  {
    id: "level1-best",
    finishedAt: "2026-11-02T10:00:00.000Z",
    seed: 42,
    results: [seededResult(0.85, 1)],
  },
  {
    id: "level3-best",
    finishedAt: "2026-11-01T10:00:00.000Z",
    seed: 43,
    results: [seededResult(0.95, 3)],
  },
];

await mkdir(OUT, { recursive: true });
const browser = await chromium.launch({ executablePath: EDGE, headless: true });
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
});
await context.addInitScript(
  ({ fixedNow, seededHistory }) => {
    Date.now = () => fixedNow;
    localStorage.setItem("noesis.history.v1", JSON.stringify(seededHistory));
    if (sessionStorage.getItem("noesis.levelbest.seeded") === "1") return;
    sessionStorage.setItem("noesis.levelbest.seeded", "1");
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
        sessionLength: "standard",
        motivationMode: true,
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
        levels: { nback: 1, gonogo: 2, reasoning: 2, speed: 2 },
        log: [],
      }),
    );
    localStorage.removeItem("noesis.session.v1");
  },
  { fixedNow: FIXED_NOW, seededHistory: history },
);

const page = await context.newPage();
const consoleErrors = [];
page.on("console", (msg) => {
  if (msg.type() === "error") consoleErrors.push(msg.text());
});
page.on("pageerror", (error) => consoleErrors.push(error.message));
await page.goto(URL, { waitUntil: "networkidle" });
await page.waitForSelector('[data-testid="start-session"]');
await page.waitForTimeout(300);

async function readPracticeRow() {
  return page.evaluate(() => {
    const row = [...document.querySelectorAll(".practice-row")].find(
      (entry) => entry.querySelector("dt")?.textContent === "N-back",
    );
    return {
      last: row?.querySelector(".practice-last")?.textContent ?? null,
      best: row?.querySelector(".practice-best")?.textContent ?? null,
    };
  });
}

const homeBefore = await readPracticeRow();
await page.screenshot({ path: join(OUT, `${LABEL}-01-home-best.png`), fullPage: true });

await page.evaluate(() => {
  const button = [...document.querySelectorAll("button")].find((entry) =>
    (entry.textContent ?? "").trim().startsWith("Focus N-back"),
  );
  if (!button) throw new Error("Focus N-back button not found");
  button.click();
});
await page.waitForSelector('[data-testid="session-root"]');
await page.waitForTimeout(300);

let hits = 0;
for (let step = 0; step < 4000; step += 1) {
  const snap = await page.evaluate(() => {
    const state = window.__NOESIS__.getState();
    const current = state?.current;
    return state
      ? {
          phase: state.phase,
          currentPhase: current?.phase ?? null,
          target: current?.trials?.[current.index]?.target ?? null,
          responded: current?.respondedThisTrial ?? false,
        }
      : null;
  });
  if (!snap) throw new Error("session disappeared");
  if (snap.phase === "block_complete") break;
  if (snap.phase !== "running") {
    await page.evaluate(() => window.__NOESIS__.dispatch({ type: "advance", ms: 500 }));
    continue;
  }
  if (snap.currentPhase === "trial" && snap.target && !snap.responded && hits < HIT_TARGETS) {
    hits += 1;
    await page.evaluate(() => window.__NOESIS__.dispatch({ type: "respond" }));
  } else {
    await page.evaluate(() => window.__NOESIS__.dispatch({ type: "advance", ms: 500 }));
  }
}

await page.waitForSelector('[data-testid="momentum"]');
await page.waitForTimeout(300);
await page.screenshot({ path: join(OUT, `${LABEL}-02-block-complete-near-best.png`) });

const block = await page.evaluate(() => {
  const state = window.__NOESIS__.getState();
  const result = state?.results[0];
  const momentum = document.querySelector('[data-testid="momentum"]');
  return {
    accuracy: result?.metrics.accuracy ?? null,
    difficulty: result?.difficulty ?? null,
    momentumText: (momentum?.textContent ?? "").replace(/\s+/g, " ").trim(),
  };
});

const report = {
  label: LABEL,
  homeBefore,
  block,
  nearBestCue: /near best|so close to your best/i.test(block.momentumText),
  earnedTenBonus: /\+10/.test(block.momentumText),
  consoleErrors,
  shots: OUT,
};
await writeFile(join(OUT, `${LABEL}-level-best-report.json`), `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(JSON.stringify(report, null, 2));
await browser.close();

