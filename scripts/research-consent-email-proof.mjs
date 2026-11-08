import { chromium } from "playwright-core";
import { readFile } from "node:fs/promises";

const EDGE =
  process.env.EDGE_PATH ?? "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const URL = process.env.NOESIS_URL ?? "http://127.0.0.1:5174/";

const browser = await chromium.launch({ executablePath: EDGE, headless: true });
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  acceptDownloads: true,
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
  localStorage.setItem(
    "noesis.research.v1",
    JSON.stringify({ studyContactEmail: "study@example.org" }),
  );
  localStorage.removeItem("noesis.history.v1");
  localStorage.removeItem("noesis.session.v1");
  localStorage.removeItem("noesis.research-consent.v1");
});

const page = await context.newPage();
const consoleErrors = [];
page.on("console", (msg) => {
  if (msg.type() === "error") consoleErrors.push(msg.text());
});
page.on("pageerror", (error) => consoleErrors.push(error.message));

await page.goto(URL, { waitUntil: "networkidle" });
await page.waitForSelector('[data-testid="start-session"]');

await page.getByTestId("start-session").click();
await page.getByTestId("begin-test").click();
await page.getByTestId("pause").click();
await page.getByTestId("end-session").click();
await page.getByTestId("confirm-end").click();
await page.waitForSelector('[data-testid="start-session"]');

await page.getByRole("button", { name: "Settings", exact: true }).click();
await page.getByRole("heading", { name: "Local control" }).waitFor();

const disabledBeforeConsent = await page
  .getByTestId("send-research-data")
  .isDisabled();

await page.getByTestId("open-research-consent").click();
await page.getByRole("heading", { name: /informed consent for research data sharing/i }).waitFor();
const turkishTitle = await (async () => {
  await page.getByTestId("research-consent-language-tr").click();
  const title = await page.getByRole("heading", { level: 1 }).textContent();
  await page.getByTestId("research-consent-language-en").click();
  return title;
})();

const checkboxes = page.getByRole("checkbox");
const checkboxCount = await checkboxes.count();
for (let index = 0; index < checkboxCount; index += 1) {
  await checkboxes.nth(index).check();
}
await page.getByTestId("give-consent").click();
await page.getByTestId("research-consent-status").waitFor();
const consentStatus = await page.getByTestId("research-consent-status").textContent();

const downloadPromise = page.waitForEvent("download");
await page.getByTestId("send-research-data").click();
const download = await downloadPromise;
const downloadPath = await download.path();
const suggestedFilename = download.suggestedFilename();
const text = downloadPath ? await readFile(downloadPath, "utf8") : "";
const parsed = JSON.parse(text);
const draftVisible = await page.getByTestId("research-email-draft").isVisible();
const mailto = await page.getByTestId("open-email-app").getAttribute("href");
const draftText = await page.getByTestId("research-email-draft").textContent();

await page.getByRole("button", { name: "Withdraw research consent" }).click();
const withdrawnStatus = await page.getByTestId("research-consent-status").textContent();
const disabledAfterWithdrawal = await page
  .getByTestId("send-research-data")
  .isDisabled();

console.log(
  JSON.stringify(
    {
      consent: {
        disabledBeforeConsent,
        checkboxCount,
        turkishTitle,
        consentStatus,
        participantCode: parsed.research?.participantCode ?? null,
        consentVersion: parsed.research?.consentVersion ?? null,
        scopes: parsed.research?.scopes ?? null,
        hasStudyContactInFile: text.includes("study@example.org"),
        withdrawnStatus,
        disabledAfterWithdrawal,
      },
      adherence: {
        eventCount: Array.isArray(parsed.adherence) ? parsed.adherence.length : null,
        firstStatus: parsed.adherence?.[0]?.status ?? null,
        firstBlocksCompleted: parsed.adherence?.[0]?.blocksCompleted ?? null,
      },
      manifest: {
        appVersion: parsed.manifest?.appVersion ?? null,
        exportSchemaVersion: parsed.manifest?.exportSchemaVersion ?? null,
        evidenceReview: parsed.manifest?.evidenceReview ?? null,
        dataDictionaryVersion: parsed.manifest?.dataDictionaryVersion ?? null,
        consentVersion: parsed.manifest?.consentVersion ?? null,
        counts: parsed.manifest?.counts ?? null,
      },
      email: {
        suggestedFilename,
        draftVisible,
        mailtoPrefix: typeof mailto === "string" ? mailto.slice(0, 7) : null,
        bodyMentionsSessions: /Sessions:/.test(draftText ?? ""),
        bodyMentionsAttachment: /Attachment:/.test(draftText ?? ""),
      },
      consoleErrors,
    },
    null,
    2,
  ),
);

await browser.close();
