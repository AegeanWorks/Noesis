import { chromium } from "playwright-core";
import { mkdir } from "node:fs/promises";

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
await page.getByTestId("start-switching").click();
await page.waitForSelector('[data-testid="test-briefing"]');
const briefing = await page.$eval('[data-testid="test-briefing"]', (node) =>
  (node.textContent ?? "").replace(/\s+/g, " ").trim(),
);
await page.getByTestId("begin-test").click();
await page.waitForSelector(".stage-switching");

const trial = await page.evaluate(() => {
  const state = window.__NOESIS__.getState();
  const current = state.current;
  const next = current.trials[current.index];
  return {
    cue: next.cue,
    colour: next.colour,
    shape: next.shape,
  };
});
const correct =
  trial.cue === "colour"
    ? trial.colour === "red"
      ? 0
      : 1
    : trial.shape === "circle"
      ? 0
      : 1;
const labels = await page.$$eval(".stage-switching .option", (nodes) =>
  nodes.map((node) => (node.textContent ?? "").trim()),
);
const prompt = await page.$eval(".switch-cue", (node) => node.textContent ?? "");
if (process.env.SHOT_DIR) {
  await mkdir(process.env.SHOT_DIR, { recursive: true });
  await page.screenshot({
    path: `${process.env.SHOT_DIR}/task-switch-mobile.png`,
    fullPage: true,
  });
}
await page.getByTestId(`option-${correct}`).click();
const feedback = await page.getByTestId("feedback").textContent();
await page.getByTestId("pause").click();
await page.getByTestId("end-session").click();
await page.getByTestId("confirm-end").click();

console.log(
  JSON.stringify(
    {
      menuHasTaskSwitch: true,
      briefingHasClaim: /task-switching practice/i.test(briefing),
      trial,
      prompt,
      labels,
      correct,
      feedback,
      consoleErrors,
    },
    null,
    2,
  ),
);

await browser.close();
