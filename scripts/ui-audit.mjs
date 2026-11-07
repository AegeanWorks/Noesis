import { chromium } from "playwright-core";
import { mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const OUT = process.argv[2] ?? join(tmpdir(), "noesis-ui-audit");
const EDGE =
  process.env.EDGE_PATH ?? "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const URL = process.env.NOESIS_URL ?? "http://127.0.0.1:5174/";
const FIXED_NOW = 1_793_723_107_000;
await mkdir(OUT, { recursive: true });

const browser = await chromium.launch({ executablePath: EDGE, headless: true });
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
await context.addInitScript(({ fixedNow }) => {
  Date.now = () => fixedNow;
  if (sessionStorage.getItem("noesis.audit.seeded") === "1") return;
  sessionStorage.setItem("noesis.audit.seeded", "1");
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
      reducedMotion: false,
      difficulty: 2,
      sessionLength: "quick",
      motivationMode: true,
      largeText: false,
      highContrast: false,
      hideClock: false,
      weeklyGoal: 3,
    }),
  );
  localStorage.removeItem("noesis.history.v1");
  localStorage.removeItem("noesis.session.v1");
}, { fixedNow: FIXED_NOW });

const page = await context.newPage();
const consoleErrors = [];
page.on("console", (msg) => {
  if (msg.type() === "error") consoleErrors.push(msg.text());
});
page.on("pageerror", (error) => consoleErrors.push(error.message));
await page.goto(URL, { waitUntil: "networkidle" });
await page.waitForSelector('[data-testid="start-session"]');

async function audit(label) {
  return page.evaluate((name) => {
    const issues = { overflow: [], tinyText: [], smallTargets: [], clipped: [] };
    const seen = new Set();
    for (const el of document.querySelectorAll("body *")) {
      const rect = el.getBoundingClientRect();
      const style = getComputedStyle(el);
      if (style.display === "none" || style.visibility === "hidden" || rect.width < 1 || rect.height < 1) continue;
      const text = (el.textContent ?? "").trim().slice(0, 60);
      const key = `${el.tagName}.${el.className}`;
      if ((rect.right > window.innerWidth + 1 || rect.left < -1) && style.position !== "fixed") {
        if (!seen.has(`o:${key}`)) {
          seen.add(`o:${key}`);
          issues.overflow.push({ tag: el.tagName, className: String(el.className).slice(0, 80), left: Math.round(rect.left), right: Math.round(rect.right), text });
        }
      }
      if (text && parseFloat(style.fontSize) < 12) {
        if (!seen.has(`f:${key}`)) {
          seen.add(`f:${key}`);
          issues.tinyText.push({ tag: el.tagName, className: String(el.className).slice(0, 80), fontSize: style.fontSize, text });
        }
      }
      if (["BUTTON", "A", "INPUT", "SELECT", "SUMMARY"].includes(el.tagName)) {
        if ((rect.width < 44 || rect.height < 44) && !seen.has(`t:${key}:${text}`)) {
          seen.add(`t:${key}:${text}`);
          issues.smallTargets.push({ tag: el.tagName, className: String(el.className).slice(0, 80), width: Math.round(rect.width), height: Math.round(rect.height), text });
        }
      }
      if (text && el.scrollWidth > el.clientWidth + 2 && ["hidden", "clip"].includes(style.overflowX) && style.textOverflow !== "ellipsis") {
        if (!seen.has(`c:${key}:${text}`)) {
          seen.add(`c:${key}:${text}`);
          issues.clipped.push({ tag: el.tagName, className: String(el.className).slice(0, 80), client: el.clientWidth, scroll: el.scrollWidth, text });
        }
      }
    }
    return {
      label: name,
      viewport: { width: window.innerWidth, height: window.innerHeight },
      documentWidth: document.documentElement.scrollWidth,
      horizontalScroll: document.documentElement.scrollWidth > window.innerWidth + 1,
      issues,
    };
  }, label);
}

const results = [];
await page.waitForTimeout(300);
await page.screenshot({ path: join(OUT, "01-home.png"), fullPage: true });
results.push(await audit("home-empty"));

await page.click('[data-testid="start-session"]');
await page.waitForSelector('[data-testid="session-root"]');
await page.waitForTimeout(900);
await page.screenshot({ path: join(OUT, "02-session-nback.png") });
results.push(await audit("session-nback"));

for (let step = 0; step < 6000; step += 1) {
  const snap = await page.evaluate(() => {
    const state = window.__NOESIS__.getState();
    return state ? { phase: state.phase, blockIndex: state.blockIndex } : null;
  });
  if (!snap) break;
  if (snap.phase === "complete") break;
  if (snap.phase === "block_complete") {
    const bank = await page.$('[data-testid="bank-next"]');
    if (bank) await bank.click();
    else {
      const next = await page.$('[data-testid="next-block"]');
      if (next) await next.click();
    }
    await page.waitForTimeout(120);
    continue;
  }
  if (snap.phase !== "running") continue;
  const action = await page.evaluate(() => {
    const state = window.__NOESIS__.getState();
    const current = state?.current;
    if (!current) return null;
    if (current.mechanic === "nback") {
      const trial = current.trials[current.index];
      if (current.phase === "trial" && !current.respondedThisTrial && trial?.target) return { type: "respond" };
    }
    if (current.mechanic === "gonogo") {
      const trial = current.trials[current.index];
      if ((current.phase === "stimulus" || current.phase === "response") && !current.respondedThisTrial && trial?.go) return { type: "respond" };
    }
    return null;
  });
  if (action) await page.evaluate((a) => window.__NOESIS__.dispatch(a), action);
  await page.evaluate(() => window.__NOESIS__.dispatch({ type: "advance", ms: 5000 }));
}
await page.waitForSelector('[data-testid="momentum-summary"]', { timeout: 15000 });
await page.waitForTimeout(300);
await page.screenshot({ path: join(OUT, "03-results.png"), fullPage: true });
results.push(await audit("results"));

await page.getByRole("button", { name: "Noesis home" }).click();
await page.waitForSelector('[data-testid="start-session"]');
await page.waitForTimeout(300);
await page.screenshot({ path: join(OUT, "04-home-history.png"), fullPage: true });
results.push(await audit("home-history"));

await page.getByRole("button", { name: "Settings", exact: true }).click();
await page.getByRole("heading", { name: "Local control" }).waitFor();
await page.waitForTimeout(300);
await page.screenshot({ path: join(OUT, "05-settings.png"), fullPage: true });
results.push(await audit("settings"));

await page.getByRole("button", { name: "Evidence", exact: true }).click();
await page.getByRole("heading", { name: "What each mechanic can and cannot claim" }).waitFor();
await page.waitForTimeout(300);
const citationLinks = await page.$$eval(".citations a", (links) =>
  links.map((link) => {
    const rect = link.getBoundingClientRect();
    return {
      text: (link.textContent ?? "").replace(/\s+/g, " ").trim(),
      href: link.getAttribute("href"),
      height: Math.round(rect.height),
      width: Math.round(rect.width),
    };
  }),
);
const popupPromise = page.waitForEvent("popup", { timeout: 5000 }).catch(() => null);
await page.locator(".citations a").first().click();
const popup = await popupPromise;
const popupUrl = popup ? popup.url() : null;
if (popup) await popup.close().catch(() => {});
const citationReport = {
  count: citationLinks.length,
  allAtLeast44High: citationLinks.every((link) => link.height >= 44),
  minHeight: Math.min(...citationLinks.map((link) => link.height)),
  allCarryPmid: citationLinks.every((link) => /PMID \d+/.test(link.text)),
  firstHref: citationLinks[0]?.href ?? null,
  popupUrl,
};
await page.screenshot({ path: join(OUT, "06-evidence.png"), fullPage: true });
results.push(await audit("evidence"));

await page.getByRole("button", { name: "Noesis home" }).click();
await page.waitForSelector('[data-testid="start-session"]');
await page.evaluate(() => document.documentElement.classList.add("large-text"));
await page.waitForTimeout(300);
await page.screenshot({ path: join(OUT, "07-home-large-text.png"), fullPage: true });
results.push(await audit("home-large-text"));

await writeFile(
  join(OUT, "audit-report.json"),
  `${JSON.stringify({ consoleErrors, citationReport, results }, null, 2)}\n`,
  "utf8",
);
console.log(JSON.stringify({ consoleErrors, citationReport, summary: results.map((r) => ({
  label: r.label,
  horizontalScroll: r.horizontalScroll,
  documentWidth: r.documentWidth,
  overflow: r.issues.overflow.length,
  tinyText: r.issues.tinyText.length,
  smallTargets: r.issues.smallTargets.length,
  clipped: r.issues.clipped.length,
})) }, null, 2));
await browser.close();
