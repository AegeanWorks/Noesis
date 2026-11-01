import { chromium } from "playwright-core";
import { mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const OUT = process.env.SHOT_DIR ?? join(tmpdir(), "noesis-ui-shots");
const EDGE = process.env.EDGE_PATH ?? "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const URL = "http://127.0.0.1:5173/";

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

async function seed(context, overrides = {}) {
  await context.addInitScript(
    ({ safetyProfile, appSettings }) => {
      localStorage.setItem("noesis.safety.v1", JSON.stringify(safetyProfile));
      localStorage.setItem("noesis.settings.v1", JSON.stringify(appSettings));
      localStorage.removeItem("noesis.history.v1");
      localStorage.removeItem("noesis.session.v1");
      localStorage.removeItem("noesis.intention.v1");
    },
    { safetyProfile: { ...safety, ...overrides.safety }, appSettings: { ...settings, ...overrides.settings } },
  );
}

async function openPage(browser, viewport, overrides = {}) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 2 });
  await seed(context, overrides);
  const page = await context.newPage();
  page.on("console", (msg) => {
    if (msg.type() === "error") console.log("CONSOLE ERROR:", msg.text());
  });
  page.on("pageerror", (err) => console.log("PAGE ERROR:", err.message));
  await page.goto(URL, { waitUntil: "networkidle" });
  await page.waitForSelector('[data-testid="start-session"]');
  await page.evaluate(async () => {
    const module = await import("/src/content/reasoningItems.ts");
    window.__NOESIS_REASONING__ = module.REASONING_ITEMS;
  });
  return { context, page };
}

async function drive(page, onBlockComplete) {
  for (let step = 0; step < 4000; step += 1) {
    const snap = await page.evaluate(() => {
      const s = window.__NOESIS__.getState();
      if (!s) return null;
      return { phase: s.phase, blockIndex: s.blockIndex };
    });
    if (!snap) break;
    if (snap.phase === "complete") break;
    if (snap.phase === "block_complete") {
      if (onBlockComplete) {
        await onBlockComplete(snap.blockIndex);
      }
      const bank = await page.$('[data-testid="bank-next"]');
      if (bank) {
        await bank.click();
      } else {
        const next = await page.$('[data-testid="next-block"]');
        if (next) await next.click();
      }
      await page.waitForTimeout(120);
      continue;
    }
    if (snap.phase !== "running") continue;
    const action = await page.evaluate(() => {
      const s = window.__NOESIS__.getState();
      if (!s || !s.current) return null;
      const c = s.current;
      if (c.mechanic === "nback") {
        const trial = c.trials[c.index];
        if (c.phase === "trial" && !c.respondedThisTrial && trial && trial.target) {
          return { type: "respond" };
        }
      }
      if (c.mechanic === "gonogo") {
        const trial = c.trials[c.index];
        if (
          (c.phase === "stimulus" || c.phase === "response") &&
          !c.respondedThisTrial &&
          trial &&
          trial.go
        ) {
          return { type: "respond" };
        }
      }
      if (c.mechanic === "reasoning" && c.phase === "question") {
        const item = window.__NOESIS_REASONING__?.find((entry) => entry.id === c.order[c.index]);
        if (item) return { type: "answer", option: item.correctIndex };
      }
      if (c.mechanic === "speed" && c.phase === "stimulus" && !c.respondedThisTrial) {
        return { type: "respond" };
      }
      return null;
    });
    if (action) {
      await page.evaluate((a) => window.__NOESIS__.dispatch(a), action);
    }
    await page.evaluate(() => window.__NOESIS__.dispatch({ type: "advance", ms: 200 }));
  }
}

const browser = await chromium.launch({ executablePath: EDGE, headless: true });

// Mobile flow
const mobile = await openPage(browser, { width: 390, height: 844 });
await mobile.page.waitForTimeout(300);
await mobile.page.screenshot({ path: `${OUT}/01-home-mobile-empty.png`, fullPage: true });
await mobile.page.click('[data-testid="start-session"]');
await mobile.page.waitForSelector('[data-testid="session-root"]');
await mobile.page.waitForTimeout(1200);
await mobile.page.screenshot({ path: `${OUT}/02-session-mobile.png` });
let capturedSpeed = false;
await drive(mobile.page, async (blockIndex) => {
  await mobile.page.waitForTimeout(200);
  await mobile.page.screenshot({ path: `${OUT}/03-block-complete-mobile-${blockIndex}.png` });
  if (!capturedSpeed && blockIndex === 2) {
    capturedSpeed = true;
    await mobile.page.getByTestId("bank-next").click();
    await mobile.page.waitForSelector('[data-testid="stimulus"][data-shape="circle"]', {
      timeout: 5000,
    });
    await mobile.page.screenshot({ path: `${OUT}/03b-speed-mobile.png` });
  }
});
await mobile.page.waitForSelector('[data-testid="momentum-summary"]', { timeout: 15000 });
await mobile.page.waitForTimeout(400);
await mobile.page.screenshot({ path: `${OUT}/04-results-mobile.png`, fullPage: true });
await mobile.page.getByRole("button", { name: "Noesis home" }).click();
await mobile.page.waitForSelector('[data-testid="start-session"]');
await mobile.page.waitForTimeout(300);
await mobile.page.screenshot({ path: `${OUT}/05-home-mobile-history.png`, fullPage: true });
await mobile.page.getByRole("button", { name: "Settings", exact: true }).click();
await mobile.page.getByRole("heading", { name: "Local control" }).waitFor();
await mobile.page.waitForTimeout(300);
await mobile.page.screenshot({ path: `${OUT}/06-settings-mobile.png`, fullPage: true });
await mobile.page.getByRole("button", { name: "Evidence", exact: true }).click();
await mobile.page.getByRole("heading", { name: "What each mechanic can and cannot claim" }).waitFor();
await mobile.page.waitForTimeout(300);
await mobile.page.screenshot({ path: `${OUT}/07-evidence-mobile.png`, fullPage: true });
await mobile.context.close();

// Safety onboarding
const safetyContext = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
});
const safetyPage = await safetyContext.newPage();
await safetyPage.addInitScript(() => {
  localStorage.removeItem("noesis.safety.v1");
  localStorage.removeItem("noesis.history.v1");
  localStorage.removeItem("noesis.session.v1");
});
await safetyPage.goto(URL, { waitUntil: "networkidle" });
await safetyPage.getByRole("heading", { name: "Safety and consent" }).waitFor();
await safetyPage.waitForTimeout(300);
await safetyPage.screenshot({ path: `${OUT}/08-safety-mobile.png`, fullPage: true });
await safetyContext.close();

// High contrast + large text
const contrast = await openPage(
  browser,
  { width: 390, height: 844 },
  { settings: { highContrast: true, largeText: true } },
);
await contrast.page.waitForTimeout(300);
await contrast.page.screenshot({ path: `${OUT}/09-home-mobile-contrast.png`, fullPage: true });
await contrast.context.close();

// Desktop home + session
const desktop = await openPage(browser, { width: 1280, height: 900 });
await desktop.page.screenshot({ path: `${OUT}/10-home-desktop.png` });
await desktop.page.click('[data-testid="start-session"]');
await desktop.page.waitForSelector('[data-testid="session-root"]');
await desktop.page.waitForTimeout(1200);
await desktop.page.screenshot({ path: `${OUT}/11-session-desktop.png` });
await desktop.context.close();

await browser.close();
console.log(`Screenshots written to ${OUT}`);
