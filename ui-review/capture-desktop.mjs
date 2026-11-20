// Small helper for the UI before/after review: desktop home + briefing + session.
// Usage: SHOT_DIR=<dir> NOESIS_URL=<url> node ui-review/capture-desktop.mjs
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

const browser = await chromium.launch({ executablePath: EDGE, headless: true });
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
await context.addInitScript(({ safetyProfile, appSettings }) => {
  localStorage.setItem("noesis.safety.v1", JSON.stringify(safetyProfile));
  localStorage.setItem("noesis.settings.v1", JSON.stringify(appSettings));
  localStorage.removeItem("noesis.history.v1");
  localStorage.removeItem("noesis.session.v1");
}, { safetyProfile: safety, appSettings: settings });
const page = await context.newPage();
page.on("pageerror", (err) => console.log("PAGE ERROR:", err.message));
await page.goto(URL, { waitUntil: "networkidle" });
await page.waitForSelector('[data-testid="start-session"]');
await page.waitForTimeout(400);
await page.screenshot({ path: `${OUT}/10-home-desktop.png` });
await page.click('[data-testid="start-session"]');
await page.waitForSelector('[data-testid="test-briefing"]');
await page.waitForTimeout(300);
await page.screenshot({ path: `${OUT}/10b-session-briefing-desktop.png`, fullPage: true });
const mobile = await browser.newContext({ viewport: { width: 390, height: 844 } });
await mobile.addInitScript(({ safetyProfile, appSettings }) => {
  localStorage.setItem("noesis.safety.v1", JSON.stringify(safetyProfile));
  localStorage.setItem("noesis.settings.v1", JSON.stringify(appSettings));
  localStorage.removeItem("noesis.history.v1");
  localStorage.removeItem("noesis.session.v1");
}, { safetyProfile: safety, appSettings: settings });
const mobilePage = await mobile.newPage();
mobilePage.on("pageerror", (err) => console.log("PAGE ERROR:", err.message));
await mobilePage.goto(URL, { waitUntil: "networkidle" });
await mobilePage.waitForSelector('[data-testid="start-session"]');
await mobilePage.waitForTimeout(400);
await mobilePage.screenshot({ path: `${OUT}/01-home-mobile-top.png` });
await mobilePage.screenshot({ path: `${OUT}/01-home-mobile-full.png`, fullPage: true });

console.log(`Shots written to ${OUT}`);
await browser.close();
