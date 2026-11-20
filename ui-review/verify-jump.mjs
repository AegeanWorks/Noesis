// Verifies the evidence jump links scroll their target card into view.
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
await page.getByRole("button", { name: "Evidence", exact: true }).click();
await page.getByRole("heading", { name: "What each mechanic can and cannot claim" }).waitFor();
const before = await page.evaluate(() => window.scrollY);
// Desktop chips wrap; on mobile the row scrolls horizontally, so scroll it into view first.
await page.getByRole("button", { name: "Jump to Flanker", exact: true }).scrollIntoViewIfNeeded();
await page.getByRole("button", { name: "Jump to Flanker", exact: true }).click();
await page.waitForTimeout(1600);
const result = await page.evaluate(() => {
  const el = document.getElementById("evidence-flanker");
  const rect = el.getBoundingClientRect();
  return {
    scrollY: Math.round(window.scrollY),
    hash: location.hash,
    flankerTop: Math.round(rect.top),
    flankerVisible: rect.top < window.innerHeight && rect.bottom > 0,
  };
});
console.log(JSON.stringify({ scrollBefore: Math.round(before), ...result }, null, 2));
await browser.close();
