// Close-up captures of the practice menu and settings screens.
// Usage: SHOT_DIR=<dir> NOESIS_URL=<url> node ui-review/capture-menu-settings.mjs
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
    localStorage.setItem("noesis.research.v1", JSON.stringify({ studyContactEmail: "study@example.org" }));
    localStorage.removeItem("noesis.history.v1");
  });
  const page = await ctx.newPage();
  await page.goto(URL, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Menu", exact: true }).click();
  await page.getByRole("heading", { name: "Choose a test or review your history" }).waitFor();
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${OUT}/05b-menu-tests-${name}-top.png` });
  if (name === "mobile") {
    await page.screenshot({ path: `${OUT}/05b-menu-tests-mobile-full.png`, fullPage: true });
  }
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.getByRole("heading", { name: "Local control" }).waitFor();
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${OUT}/06-settings-${name}-top.png` });
  await ctx.close();
}
console.log(`Menu/settings shots written to ${OUT}`);
await browser.close();
