// Verifies experimental mechanic cards stay compact but expand on demand.
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
await page.waitForSelector('[data-testid="start-session"]');
const cards = await page.locator(".mechanic-card").count();
const compact = await page.locator(".mechanic-card-compact").count();
const headings = await page.locator(".mechanic-card h3").allTextContents();
const taskSwitch = page.locator(".mechanic-card", { hasText: "Task Switch" });
const summary = taskSwitch.locator("summary");
const before = await taskSwitch.locator("details p").first().isVisible();
await summary.click();
const after = await taskSwitch.locator("details p").first().isVisible();
console.log(
  JSON.stringify({ cards, compact, headingCount: headings.length, detailsBefore: before, detailsAfter: after }, null, 2),
);
await browser.close();
