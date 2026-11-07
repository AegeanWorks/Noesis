import { chromium } from "playwright-core";

const EDGE =
  process.env.EDGE_PATH ?? "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const URL = process.env.NOESIS_URL ?? "http://127.0.0.1:5174/";

const browser = await chromium.launch({ executablePath: EDGE, headless: true });
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
});
await context.addInitScript(() => {
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
      reducedMotion: true,
      difficulty: 2,
      sessionLength: "quick",
      motivationMode: false,
      largeText: false,
      highContrast: false,
      hideClock: false,
      weeklyGoal: 3,
    }),
  );
  localStorage.removeItem("noesis.history.v1");
  localStorage.removeItem("noesis.session.v1");
});

const page = await context.newPage();
const consoleErrors = [];
page.on("console", (msg) => {
  if (msg.type() === "error") consoleErrors.push(msg.text());
});
page.on("pageerror", (error) => consoleErrors.push(error.message));

await page.goto(URL, { waitUntil: "networkidle" });
await page.waitForSelector('[data-testid="start-session"]');

await page.getByRole("button", { name: "Menu", exact: true }).click();
await page.getByRole("heading", { name: "Choose a test or review your history" }).waitFor();
const cards = await page.$$eval(".menu-test-card", (nodes) =>
  nodes.map((node) => ({
    text: (node.textContent ?? "").replace(/\s+/g, " ").trim(),
    hasMeasures: /what the evidence supports/i.test(node.textContent ?? ""),
    hasBoundary: /does not claim/i.test(node.textContent ?? ""),
    hasPmid: /PMID \d+/.test(node.textContent ?? ""),
  })),
);
await page.getByRole("tab", { name: /History/ }).click();
const historyEmpty = await page.$eval(
  '[data-testid="menu-history-empty"]',
  (node) => (node.textContent ?? "").replace(/\s+/g, " ").trim(),
);

await page.getByRole("tab", { name: /Choose a test/ }).click();
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
const scrollBeforeStart = await page.evaluate(() => window.scrollY);
await page.getByTestId("start-speed").click();
await page.waitForSelector('[data-testid="test-briefing"]');
await page.waitForTimeout(900);
const chosenMechanic = await page.evaluate(
  () => window.__NOESIS__.getState().current.mechanic,
);
const beforeBegin = await page.evaluate(() => window.__NOESIS__.getState().tick);
const scrollOnBriefing = await page.evaluate(() => window.scrollY);
const briefing = await page.$eval('[data-testid="test-briefing"]', (node) =>
  (node.textContent ?? "").replace(/\s+/g, " ").trim(),
);
await page.getByTestId("begin-test").click();
await page.waitForTimeout(900);
const afterBegin = await page.evaluate(() => window.__NOESIS__.getState().tick);

await page.getByTestId("pause").click();
const atPause = await page.evaluate(() => window.__NOESIS__.getState().tick);
await page.waitForTimeout(700);
const afterPauseWait = await page.evaluate(() => window.__NOESIS__.getState().tick);

console.log(
  JSON.stringify(
    {
      menu: {
        cardCount: cards.length,
        allHaveClaim: cards.every((card) => card.hasMeasures),
        allHaveBoundary: cards.every((card) => card.hasBoundary),
        allHavePmid: cards.every((card) => card.hasPmid),
        historyEmpty,
      },
      briefing: {
        visible: true,
        chosenMechanic,
        scrollBeforeStartPx: scrollBeforeStart,
        scrollOnBriefingPx: scrollOnBriefing,
        tickWhileBriefingMs: beforeBegin,
        tickAfterBeginMs: afterBegin,
        hasMeasures: /what this measures/i.test(briefing),
        hasSupport: /what the evidence supports/i.test(briefing),
        hasNotClaimed: /not claimed/i.test(briefing),
        hasPmid: /PMID \d+/.test(briefing),
        hasSafety: /safety/i.test(briefing),
      },
      pause: {
        tickAtPauseMs: atPause,
        tickAfterPauseWaitMs: afterPauseWait,
        clockStopped: afterPauseWait === atPause,
      },
      consoleErrors,
    },
    null,
    2,
  ),
);

await browser.close();
