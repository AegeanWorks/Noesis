// Scripted Choose-a-test domain-filter proof: captures the unfiltered menu, then (after the
// feature) narrows to working memory and plays a real Change Detection focus session from the
// filtered list. Before the feature the filter control is absent.
// Usage: node scripts/menu-filter-proof.mjs <before|after> [shotDir]
import { chromium } from "playwright-core";
import { mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const LABEL = process.argv[2] ?? "run";
const OUT = process.argv[3] ?? join(tmpdir(), "noesis-menu-filter");
const EDGE =
  process.env.EDGE_PATH ?? "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const URL = process.env.NOESIS_URL ?? "http://127.0.0.1:5218/";
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
    if (sessionStorage.getItem("noesis.menufilter.seeded") === "1") return;
    sessionStorage.setItem("noesis.menufilter.seeded", "1");
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

const readMenu = () =>
  page.evaluate(() => {
    const cards = [...document.querySelectorAll('[data-testid^="menu-test-"]')].map((card) => ({
      testId: card.getAttribute("data-testid"),
      heading: (card.querySelector("h2")?.textContent ?? "").trim(),
    }));
    const select = document.querySelector('[data-testid="domain-filter"]');
    return {
      cards,
      filterPresent: Boolean(select),
      filterValue: select ? select.value : null,
      count: document
        .querySelector('[data-testid="menu-filter-count"]')
        ?.textContent?.replace(/\s+/g, " ")
        .trim() ?? null,
    };
  });

await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 60_000 });
await page.waitForSelector('[data-testid="start-session"]');
await page.getByRole("button", { name: "Menu", exact: true }).click();
await page.waitForSelector('[data-testid="menu-test-nback"]');
await page.waitForTimeout(300);
await page.screenshot({ path: join(OUT, `${LABEL}-00-choose-all.png`), fullPage: true });
const initial = await readMenu();

const filterPresent = initial.filterPresent;
if (filterPresent) {
  await page.selectOption('[data-testid="domain-filter"]', "working_memory");
  await page.waitForTimeout(300);
  await page.screenshot({ path: join(OUT, `${LABEL}-01-choose-working-memory.png`), fullPage: true });
}
const filtered = await readMenu();

// Play a real Change Detection focus session, starting from the (filtered) list.
await page.getByTestId("start-change").click();
await page.waitForSelector('[data-testid="test-briefing"]');
await page.getByTestId("begin-test").click();
await page.waitForSelector(".stage-change");
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
    const begin = await page.$('[data-testid="begin-test"]');
    if (begin) {
      await begin.click();
      await page.waitForSelector(".stage-change");
      await page.waitForTimeout(80);
    }
    continue;
  }
  if (state.phase !== "running") continue;
  await page.evaluate(() => {
    const current = window.__NOESIS__.getState()?.current;
    if (!current || current.mechanic !== "change") return;
    if (current.phase === "study") {
      window.__NOESIS__.dispatch({ type: "advance", ms: 1_000 });
      return;
    }
    if (current.phase === "delay") {
      window.__NOESIS__.dispatch({ type: "advance", ms: 700 });
      return;
    }
    if (current.phase !== "test") return;
    const trial = current.trials[current.index];
    window.__NOESIS__.dispatch({ type: "advance", ms: 400 });
    window.__NOESIS__.dispatch({
      type: "answer",
      option: trial.positions[trial.changedIndex],
    });
    window.__NOESIS__.dispatch({ type: "advance", ms: 700 });
  });
  await page.waitForTimeout(5);
}
await page.waitForSelector("text=Your blocks, separately", { timeout: 15000 });
await page.waitForTimeout(300);
await page.screenshot({ path: join(OUT, `${LABEL}-02-results.png`), fullPage: true });
const results = await page.evaluate(() => {
  const state = window.__NOESIS__.getState();
  return {
    mechanics: state?.results.map((result) => result.mechanic) ?? [],
    difficulties: state?.results.map((result) => result.difficulty ?? null) ?? [],
    summaries: state?.results.map((result) => result.summary) ?? [],
  };
});

const report = {
  label: LABEL,
  filterPresent,
  initial,
  filtered,
  results,
  consoleErrors,
  shots: OUT,
};
await writeFile(join(OUT, `${LABEL}-report.json`), `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(JSON.stringify(report, null, 2));
await browser.close();
