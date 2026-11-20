// Focused before/after capture of the pre-test briefing.
// Usage: SHOT_DIR=<dir> NOESIS_URL=<url> node ui-review/capture-briefing.mjs
import { chromium } from "playwright-core";
import { mkdir } from "node:fs/promises";

const OUT = process.env.SHOT_DIR;
const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const URL = process.env.NOESIS_URL ?? "http://127.0.0.1:5175/";
await mkdir(OUT, { recursive: true });

const browser = await chromium.launch({ executablePath: EDGE, headless: true });
for (const [name, viewport] of [
  ["mobile", { width: 390, height: 844 }],
  ["desktop", { width: 1280, height: 900 }],
]) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 2 });
  await ctx.addInitScript(() => {
    localStorage.setItem(
      "noesis.safety.v1",
      JSON.stringify({
        version: 1,
        acknowledged: true,
        photosensitive: false,
        exerciseConcern: false,
        consent: true,
        updatedAt: new Date().toISOString(),
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
      }),
    );
    localStorage.removeItem("noesis.history.v1");
    localStorage.removeItem("noesis.session.v1");
  });
  const page = await ctx.newPage();
  await page.goto(URL, { waitUntil: "networkidle" });
  await page.waitForSelector('[data-testid="start-session"]');
  await page.click('[data-testid="start-session"]');
  await page.waitForSelector('[data-testid="test-briefing"]');
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${OUT}/02-session-briefing-${name}.png`, fullPage: true });
  await ctx.close();
}
console.log(`Briefing shots written to ${OUT}`);
await browser.close();
