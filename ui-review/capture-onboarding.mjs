// Focused before/after captures for the safety + research-consent screens.
// Usage: SHOT_DIR=<dir> NOESIS_URL=<url> node ui-review/capture-onboarding.mjs
import { chromium } from "playwright-core";
import { mkdir } from "node:fs/promises";

const OUT = process.env.SHOT_DIR;
const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const URL = process.env.NOESIS_URL ?? "http://127.0.0.1:5175/";
await mkdir(OUT, { recursive: true });

const browser = await chromium.launch({ executablePath: EDGE, headless: true });
const viewport = { width: 390, height: 844 };

// Safety onboarding: no stored profile.
const safetyCtx = await browser.newContext({ viewport });
await safetyCtx.addInitScript(() => {
  localStorage.removeItem("noesis.safety.v1");
  localStorage.removeItem("noesis.history.v1");
});
const safetyPage = await safetyCtx.newPage();
await safetyPage.goto(URL, { waitUntil: "networkidle" });
await safetyPage.getByRole("heading", { name: "Safety and consent" }).waitFor();
await safetyPage.waitForTimeout(300);
await safetyPage.screenshot({ path: `${OUT}/08-safety-mobile.png`, fullPage: true });
await safetyCtx.close();

// Research consent: acknowledged safety + study contact email.
const consentCtx = await browser.newContext({ viewport });
await consentCtx.addInitScript(() => {
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
    "noesis.research.v1",
    JSON.stringify({ studyContactEmail: "study@example.org" }),
  );
  localStorage.removeItem("noesis.research-consent.v1");
});
const consentPage = await consentCtx.newPage();
await consentPage.goto(URL, { waitUntil: "networkidle" });
await consentPage.getByRole("button", { name: "Settings", exact: true }).click();
await consentPage.getByTestId("open-research-consent").click();
await consentPage.getByRole("heading", { name: /informed consent for research data sharing/i }).waitFor();
await consentPage.waitForTimeout(300);
await consentPage.screenshot({ path: `${OUT}/06b-research-consent-mobile.png`, fullPage: true });
await consentCtx.close();

console.log(`Onboarding shots written to ${OUT}`);
await browser.close();
