// Verifies the settings jump controls scroll their target section into view.
import { chromium } from "playwright-core";

const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const URL = process.env.NOESIS_URL ?? "http://127.0.0.1:5175/";
const browser = await chromium.launch({ executablePath: EDGE, headless: true });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
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
await page.getByRole("button", { name: "Settings", exact: true }).click();
await page.getByRole("heading", { name: "Local control" }).waitFor();
const before = await page.evaluate(() => window.scrollY);
const chip = page.getByRole("button", { name: "Jump to Your data", exact: true });
await chip.scrollIntoViewIfNeeded();
await chip.click();
await page.waitForTimeout(1600);
const result = await page.evaluate(() => {
  const el = document.getElementById("settings-data");
  const rect = el.getBoundingClientRect();
  return {
    scrollY: Math.round(window.scrollY),
    hash: location.hash,
    dataTop: Math.round(rect.top),
    dataVisible: rect.top < window.innerHeight && rect.bottom > 0,
  };
});
console.log(JSON.stringify({ scrollBefore: Math.round(before), ...result }, null, 2));
await browser.close();
