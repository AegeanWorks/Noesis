// Focused before/after capture of the results screen (mobile + desktop).
// Usage: SHOT_DIR=<dir> NOESIS_URL=<url> node ui-review/capture-results.mjs
import { chromium } from "playwright-core";
import { mkdir } from "node:fs/promises";

const OUT = process.env.SHOT_DIR;
const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const URL = process.env.NOESIS_URL ?? "http://127.0.0.1:5175/";
await mkdir(OUT, { recursive: true });

const safety = {
  version: 1,
  acknowledged: true,
  photosensitive: false,
  exerciseConcern: false,
  consent: true,
  updatedAt: new Date().toISOString(),
};
const settings = {
  reducedMotion: false,
  difficulty: 2,
  sessionLength: "standard",
  motivationMode: true,
  largeText: false,
  highContrast: false,
};

async function drive(page) {
  for (let step = 0; step < 4000; step += 1) {
    const snap = await page.evaluate(() => {
      const s = window.__NOESIS__.getState();
      return s ? { phase: s.phase, blockIndex: s.blockIndex } : null;
    });
    if (!snap || snap.phase === "complete") break;
    if (snap.phase === "block_complete") {
      const bank = await page.$('[data-testid="bank-next"]');
      if (bank) await bank.click();
      else {
        const next = await page.$('[data-testid="next-block"]');
        if (next) await next.click();
      }
      await page.waitForTimeout(90);
      continue;
    }
    if (snap.phase !== "running") continue;
    const begin = await page.$('[data-testid="begin-test"]');
    if (begin) {
      await begin.click();
      await page.waitForTimeout(90);
      continue;
    }
    const action = await page.evaluate(() => {
      const s = window.__NOESIS__.getState();
      if (!s || !s.current) return null;
      const c = s.current;
      if (c.mechanic === "nback") {
        const trial = c.trials[c.index];
        if (c.phase === "trial" && !c.respondedThisTrial && trial?.target) return { type: "respond" };
      }
      if (c.mechanic === "gonogo") {
        const trial = c.trials[c.index];
        if ((c.phase === "stimulus" || c.phase === "response") && !c.respondedThisTrial && trial?.go)
          return { type: "respond" };
      }
      if (c.mechanic === "reasoning" && c.phase === "question") {
        const item = window.__NOESIS_REASONING__?.find((entry) => entry.id === c.order[c.index]);
        if (item) return { type: "answer", option: item.correctIndex };
      }
      if (c.mechanic === "speed" && c.phase === "stimulus" && !c.respondedThisTrial)
        return { type: "respond" };
      return null;
    });
    if (action) await page.evaluate((a) => window.__NOESIS__.dispatch(a), action);
    await page.evaluate(() => window.__NOESIS__.dispatch({ type: "advance", ms: 200 }));
  }
}

const browser = await chromium.launch({ executablePath: EDGE, headless: true });

for (const [name, viewport] of [
  ["mobile", { width: 390, height: 844 }],
  ["desktop", { width: 1280, height: 900 }],
]) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 2 });
  await ctx.addInitScript(({ safetyProfile, appSettings }) => {
    localStorage.setItem("noesis.safety.v1", JSON.stringify(safetyProfile));
    localStorage.setItem("noesis.settings.v1", JSON.stringify(appSettings));
    localStorage.setItem("noesis.research.v1", JSON.stringify({ studyContactEmail: "study@example.org" }));
    localStorage.removeItem("noesis.research-consent.v1");
    localStorage.removeItem("noesis.history.v1");
    localStorage.removeItem("noesis.session.v1");
  }, { safetyProfile: safety, appSettings: settings });
  const page = await ctx.newPage();
  await page.goto(URL, { waitUntil: "networkidle" });
  await page.waitForSelector('[data-testid="start-session"]');
  await page.evaluate(async () => {
    const module = await import("/src/content/reasoningItems.ts");
    window.__NOESIS_REASONING__ = module.REASONING_ITEMS;
  });
  await page.click('[data-testid="start-session"]');
  await page.waitForSelector('[data-testid="test-briefing"]');
  await page.click('[data-testid="begin-test"]');
  await page.waitForSelector('[data-testid="session-root"]');
  await drive(page);
  await page.waitForSelector('[data-testid="momentum-summary"]', { timeout: 15000 });
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${OUT}/04-results-${name}.png`, fullPage: name === "mobile" });
  await ctx.close();
}

console.log(`Results shots written to ${OUT}`);
await browser.close();
