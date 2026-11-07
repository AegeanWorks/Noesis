// Scripted pause/end playthrough: pauses a running quick session, clicks End session,
// records whether a confirmation appears, keeps the session, then ends it for real.
// Usage: node scripts/end-guard-proof.mjs <before|after> [shotDir]
import { chromium } from "playwright-core";
import { mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const LABEL = process.argv[2] ?? "run";
const OUT = process.argv[3] ?? join(tmpdir(), "noesis-end-guard");
const EDGE =
  process.env.EDGE_PATH ?? "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const URL = process.env.NOESIS_URL ?? "http://127.0.0.1:5174/";
const FIXED_NOW = 1_793_723_107_000;

await mkdir(OUT, { recursive: true });
const browser = await chromium.launch({ executablePath: EDGE, headless: true });
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
});
await context.addInitScript(
  ({ fixedNow }) => {
    Date.now = () => fixedNow;
    if (sessionStorage.getItem("noesis.endguard.seeded") === "1") return;
    sessionStorage.setItem("noesis.endguard.seeded", "1");
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
  },
  { fixedNow: FIXED_NOW },
);

const page = await context.newPage();
const consoleErrors = [];
page.on("console", (msg) => {
  if (msg.type() === "error") consoleErrors.push(msg.text());
});
page.on("pageerror", (error) => consoleErrors.push(error.message));
await page.goto(URL, { waitUntil: "networkidle" });
await page.waitForSelector('[data-testid="start-session"]');
await page.click('[data-testid="start-session"]');
await page.waitForSelector('[data-testid="session-root"]');
await page.waitForTimeout(500);
await page.click('[data-testid="pause"]');
await page.waitForSelector('[role="dialog"]');
await page.waitForTimeout(250);
await page.screenshot({ path: join(OUT, `${LABEL}-01-paused.png`) });

await page.getByRole("button", { name: "End session", exact: true }).click();
await page.waitForTimeout(300);
const afterFirstClick = await page.evaluate(() => ({
  confirmHeading: Boolean(
    [...document.querySelectorAll("h2")].find((el) => el.textContent === "End this session?"),
  ),
  sessionVisible: Boolean(document.querySelector('[data-testid="session-root"]')),
  homeVisible: Boolean(document.querySelector('[data-testid="start-session"]')),
  storePhase: window.__NOESIS__.getState()?.phase ?? null,
  snapshot: localStorage.getItem("noesis.session.v1") !== null,
}));
await page.screenshot({ path: join(OUT, `${LABEL}-02-after-first-end-click.png`) });

let keepReturnedToSession = null;
if (afterFirstClick.confirmHeading) {
  await page.click('[data-testid="keep-session"]');
  await page.waitForTimeout(250);
  keepReturnedToSession = await page.evaluate(
    () => Boolean(document.querySelector('[data-testid="session-root"]')) && window.__NOESIS__.getState() !== null,
  );
  await page.screenshot({ path: join(OUT, `${LABEL}-03-after-keep.png`) });
  await page.getByRole("button", { name: "End session", exact: true }).click();
  await page.click('[data-testid="confirm-end"]');
}

await page.waitForTimeout(400);
const afterEnd = await page.evaluate(() => ({
  homeVisible: Boolean(document.querySelector('[data-testid="start-session"]')),
  sessionVisible: Boolean(document.querySelector('[data-testid="session-root"]')),
  store: window.__NOESIS__.getState(),
  snapshot: localStorage.getItem("noesis.session.v1") !== null,
}));

const report = {
  label: LABEL,
  afterFirstClick,
  confirmShown: afterFirstClick.confirmHeading,
  keepReturnedToSession,
  afterEnd,
  consoleErrors,
  shots: OUT,
};
await writeFile(join(OUT, `${LABEL}-end-report.json`), `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(JSON.stringify(report, null, 2));
await browser.close();
