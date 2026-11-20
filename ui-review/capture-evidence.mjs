// Focused before/after captures for the evidence screen.
// Usage: SHOT_DIR=<dir> NOESIS_URL=<url> node ui-review/capture-evidence.mjs
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
  });
  const page = await ctx.newPage();
  await page.goto(URL, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Evidence", exact: true }).click();
  await page.getByRole("heading", { name: "What each mechanic can and cannot claim" }).waitFor();
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${OUT}/07-evidence-${name}-top.png` });
  await ctx.close();
}

console.log(`Evidence shots written to ${OUT}`);
await browser.close();
