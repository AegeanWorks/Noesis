import { chromium } from "playwright-core";
import { readFile } from "node:fs/promises";

const EDGE =
  process.env.EDGE_PATH ?? "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const URL = process.env.NOESIS_URL ?? "http://127.0.0.1:5174/";

const session = {
  id: "session-1",
  finishedAt: "2026-11-08T10:05:00.000Z",
  seed: 42,
  arm: "control",
  results: [
    {
      mechanic: "nback",
      domain: "working_memory",
      trials: 18,
      durationMs: 60000,
      metrics: { accuracy: 0.8, d_prime: 2.1 },
      summary: '2-back, "best"',
      seed: 42,
      stateHash: "0123456789abcdef",
      difficulty: 2,
    },
  ],
  motivation: null,
};
const adherence = [
  {
    id: "session-42-1",
    seed: 42,
    startedAt: "2026-11-08T10:00:00.000Z",
    endedAt: "2026-11-08T10:05:00.000Z",
    status: "completed",
    blocksCompleted: 1,
    blockCount: 1,
    arm: "control",
  },
];

const browser = await chromium.launch({ executablePath: EDGE, headless: true });
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  acceptDownloads: true,
});
await context.addInitScript(
  ({ sessionRecord, adherenceEvents }) => {
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
    localStorage.setItem("noesis.history.v1", JSON.stringify([sessionRecord]));
    localStorage.setItem("noesis.adherence.v1", JSON.stringify(adherenceEvents));
    localStorage.removeItem("noesis.session.v1");
  },
  { sessionRecord: session, adherenceEvents: adherence },
);

const page = await context.newPage();
const consoleErrors = [];
page.on("console", (msg) => {
  if (msg.type() === "error") consoleErrors.push(msg.text());
});
page.on("pageerror", (error) => consoleErrors.push(error.message));

await page.goto(URL, { waitUntil: "networkidle" });
await page.waitForSelector('[data-testid="start-session"]');
await page.getByRole("button", { name: "Settings", exact: true }).click();
await page.getByRole("heading", { name: "Local control" }).waitFor();

async function downloadCsv(buttonName) {
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: buttonName }).click();
  const download = await downloadPromise;
  const path = await download.path();
  const text = path ? await readFile(path, "utf8") : "";
  return {
    filename: download.suggestedFilename(),
    header: text.split("\n")[0] ?? "",
    rowCount: text.trimEnd().split("\n").length - 1,
    hasExpectedValue:
      buttonName.includes("sessions") ? text.includes("session-1") : text.includes("completed"),
  };
}

const sessions = await downloadCsv("Download sessions CSV");
const adherenceCsv = await downloadCsv("Download adherence CSV");

console.log(
  JSON.stringify(
    {
      sessions,
      adherence: adherenceCsv,
      consoleErrors,
    },
    null,
    2,
  ),
);

await browser.close();
