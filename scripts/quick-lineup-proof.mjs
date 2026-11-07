// Scripted quick-session lineup playthrough: starts quick sessions under four fixed
// clocks, records each lineup, then completes one quick session end to end.
// Usage: node scripts/quick-lineup-proof.mjs <before|after> [shotDir]
import { chromium } from "playwright-core";
import { mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const LABEL = process.argv[2] ?? "run";
const OUT = process.argv[3] ?? join(tmpdir(), "noesis-quick-lineup");
const EDGE =
  process.env.EDGE_PATH ?? "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const URL = process.env.NOESIS_URL ?? "http://127.0.0.1:5174/";
const BASE_NOW = 1_793_723_107_000;

await mkdir(OUT, { recursive: true });
const browser = await chromium.launch({ executablePath: EDGE, headless: true });
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
});
await context.addInitScript(
  ({ baseNow }) => {
    window.__PROOF_NOW__ = baseNow;
    Date.now = () => window.__PROOF_NOW__ ?? baseNow;
    if (sessionStorage.getItem("noesis.lineup.seeded") === "1") return;
    sessionStorage.setItem("noesis.lineup.seeded", "1");
    localStorage.setItem(
      "noesis.safety.v1",
      JSON.stringify({
        version: 1,
        acknowledged: true,
        photosensitive: false,
        exerciseConcern: false,
        consent: true,
        updatedAt: new Date(baseNow).toISOString(),
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
  { baseNow: BASE_NOW },
);

const page = await context.newPage();
const consoleErrors = [];
page.on("console", (msg) => {
  if (msg.type() === "error") consoleErrors.push(msg.text());
});
page.on("pageerror", (error) => consoleErrors.push(error.message));
await page.goto(URL, { waitUntil: "networkidle" });
await page.waitForSelector('[data-testid="start-session"]');
await page.evaluate(async () => {
  const module = await import("/src/content/reasoningItems.ts");
  window.__NOESIS_REASONING__ = module.REASONING_ITEMS;
});

async function startQuick(proofNow) {
  await page.evaluate((now) => {
    window.__PROOF_NOW__ = now;
  }, proofNow);
  await page.waitForSelector('[data-testid="start-session"]');
  const secondary = await page.$('text=Start a new session');
  if (secondary) await page.getByRole("button", { name: "Start a new session" }).click();
  else await page.click('[data-testid="start-session"]');
  await page.waitForSelector('[data-testid="session-root"]');
  return page.evaluate(() => {
    const state = window.__NOESIS__.getState();
    return {
      seed: state?.config.seed ?? null,
      mechanics: state?.config.blocks.map((block) => block.mechanic) ?? [],
      first: state?.config.blocks[0]?.mechanic ?? null,
      blockCount: state?.config.blocks.length ?? 0,
    };
  });
}

async function driveToCompletion() {
  for (let step = 0; step < 6000; step += 1) {
    const snap = await page.evaluate(() => {
      const state = window.__NOESIS__.getState();
      return state ? { phase: state.phase } : null;
    });
    if (!snap) break;
    if (snap.phase === "complete") break;
    if (snap.phase === "block_complete") {
      const bank = await page.$('[data-testid="bank-next"]');
      if (bank) await bank.click();
      else {
        const next = await page.$('[data-testid="next-block"]');
        if (next) await next.click();
      }
      await page.waitForTimeout(100);
      continue;
    }
    if (snap.phase !== "running") continue;
    const action = await page.evaluate(() => {
      const state = window.__NOESIS__.getState();
      const current = state?.current;
      if (!current) return null;
      if (current.mechanic === "nback") {
        const trial = current.trials[current.index];
        if (current.phase === "trial" && !current.respondedThisTrial && trial?.target) return { type: "respond" };
      }
      if (current.mechanic === "gonogo") {
        const trial = current.trials[current.index];
        if ((current.phase === "stimulus" || current.phase === "response") && !current.respondedThisTrial && trial?.go) return { type: "respond" };
      }
      if (current.mechanic === "reasoning" && current.phase === "question") {
        const item = window.__NOESIS_REASONING__?.find((entry) => entry.id === current.order[current.index]);
        if (item) return { type: "answer", option: item.correctIndex };
      }
      if (current.mechanic === "speed" && current.phase === "stimulus" && !current.respondedThisTrial) return { type: "respond" };
      return null;
    });
    if (action) await page.evaluate((a) => window.__NOESIS__.dispatch(a), action);
    await page.evaluate(() => window.__NOESIS__.dispatch({ type: "advance", ms: 500 }));
  }
  await page.waitForSelector("text=Your blocks, separately", { timeout: 15000 });
  return page.evaluate(() => {
    const results = window.__NOESIS__.getState()?.results ?? [];
    return {
      mechanics: results.map((result) => result.mechanic),
      summaries: results.map((result) => result.summary),
    };
  });
}

const lineups = [];
for (let offset = 0; offset < 4; offset += 1) {
  const lineup = await startQuick(BASE_NOW + offset);
  await page.waitForTimeout(400);
  lineups.push(lineup);
  if (offset === 1) {
    await page.screenshot({ path: join(OUT, `${LABEL}-01-first-block-seed2.png`) });
  }
  if (offset === 1) {
    const completed = await driveToCompletion();
    await page.screenshot({ path: join(OUT, `${LABEL}-02-results-seed2.png`), fullPage: true });
    lineups[lineups.length - 1] = { ...lineup, completed };
  }
  await page.getByRole("button", { name: "Noesis home" }).click();
  await page.waitForSelector('[data-testid="start-session"]');
}

const seen = [...new Set(lineups.flatMap((lineup) => lineup.mechanics))].sort();
const pairs = [...new Set(lineups.map((lineup) => lineup.mechanics.join(",")))];
const report = {
  label: LABEL,
  lineups,
  pairs,
  distinctPairs: pairs.length,
  seen,
  allFourCovered: ["gonogo", "nback", "reasoning", "speed"].every((id) => seen.includes(id)),
  completed: lineups[1]?.completed ?? null,
  consoleErrors,
  shots: OUT,
};
await writeFile(join(OUT, `${LABEL}-lineup-report.json`), `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(JSON.stringify(report, null, 2));
await browser.close();
