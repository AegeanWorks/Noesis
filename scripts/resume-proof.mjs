// Scripted save/resume playthrough used as screenshot + mechanics evidence.
// Requires: npm run dev (http://127.0.0.1:5173)
// Usage: node scripts/resume-proof.mjs <before|after> [shotDir]
import { chromium } from "playwright-core";
import { mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const LABEL = process.argv[2] ?? "run";
const OUT = process.argv[3] ?? process.env.SHOT_DIR ?? join(tmpdir(), "noesis-resume-proof");
const EDGE =
  process.env.EDGE_PATH ?? "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const URL = process.env.NOESIS_URL ?? "http://127.0.0.1:5173/";
const FIXED_NOW = 1_793_723_107_000; // pins Date.now so the session seed is reproducible

await mkdir(OUT, { recursive: true });

const browser = await chromium.launch({ executablePath: EDGE, headless: true });
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
});
await context.addInitScript(
  ({ fixedNow }) => {
    Date.now = () => fixedNow;
    if (sessionStorage.getItem("noesis.proof.seeded") === "1") return;
    sessionStorage.setItem("noesis.proof.seeded", "1");
    const safety = {
      version: 1,
      acknowledged: true,
      photosensitive: false,
      exerciseConcern: false,
      consent: true,
      updatedAt: new Date(fixedNow).toISOString(),
    };
    const settings = {
      reducedMotion: false,
      difficulty: 2,
      sessionLength: "standard",
      motivationMode: true,
      largeText: false,
      highContrast: false,
      hideClock: false,
      weeklyGoal: 3,
    };
    localStorage.setItem("noesis.safety.v1", JSON.stringify(safety));
    localStorage.setItem("noesis.settings.v1", JSON.stringify(settings));
    localStorage.removeItem("noesis.history.v1");
    localStorage.removeItem("noesis.session.v1");
    localStorage.removeItem("noesis.intention.v1");
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

for (let step = 0; step < 4000; step += 1) {
  const snap = await page.evaluate(() => {
    const state = window.__NOESIS__.getState();
    return state ? { phase: state.phase, mechanic: state.current?.mechanic ?? null } : null;
  });
  if (!snap) throw new Error("no session state after start");
  if (snap.phase !== "running") break;
  const action = await page.evaluate(() => {
    const state = window.__NOESIS__.getState();
    const current = state?.current;
    if (!current || current.mechanic !== "nback") return null;
    const trial = current.trials[current.index];
    if (current.phase === "trial" && !current.respondedThisTrial && trial?.target) {
      return { type: "respond" };
    }
    return null;
  });
  if (action) await page.evaluate((a) => window.__NOESIS__.dispatch(a), action);
  await page.evaluate(() => window.__NOESIS__.dispatch({ type: "advance", ms: 200 }));
}

const live = await page.evaluate(() => {
  const state = window.__NOESIS__.getState();
  return {
    phase: state?.phase ?? null,
    seed: state?.config.seed ?? null,
    summary: state?.results[0]?.summary ?? null,
    savedAtBlockComplete: null,
  };
});
if (live.phase !== "block_complete") {
  throw new Error(`expected a completed block, got ${JSON.stringify(live)}`);
}

await page.waitForTimeout(1800); // let the 1.5 s snapshot interval write the boundary state
const saved = await page.evaluate(() =>
  JSON.parse(localStorage.getItem("noesis.session.v1") ?? "null"),
);
const boundary = {
  ...live,
  snapshotPhase: saved?.state?.phase ?? null,
  snapshotUnbanked: saved?.motivation?.unbanked ?? null,
  snapshotOutcomes: saved?.motivation?.outcomes?.length ?? null,
};
if (boundary.snapshotPhase !== "block_complete" || boundary.snapshotUnbanked === null) {
  throw new Error(`expected a persisted block boundary, got ${JSON.stringify(boundary)}`);
}
await page.reload({ waitUntil: "networkidle" });
await page.waitForSelector('[data-testid="start-session"]');
const resumeLabel = (await page.getByTestId("start-session").innerText()).replace(/\s+/g, " ").trim();
await page.screenshot({ path: join(OUT, `${LABEL}-01-resume-home.png`), fullPage: true });
await page.click('[data-testid="start-session"]');
await page.waitForSelector('[data-testid="momentum"]');
await page.waitForTimeout(200);
await page.screenshot({ path: join(OUT, `${LABEL}-02-resumed-block-complete.png`), fullPage: true });
const momentumText = (await page.getByTestId("momentum").innerText()).replace(/\s+/g, " ").trim();
const shownUnbanked = Number(/Unbanked (\d+)/.exec(momentumText)?.[1]);
await page.getByTestId("bank-next").click();
await page.waitForTimeout(1800); // persist the banked motivation on the next running block
const afterBank = await page.evaluate(() =>
  JSON.parse(localStorage.getItem("noesis.session.v1") ?? "null"),
);
await page.screenshot({ path: join(OUT, `${LABEL}-03-next-block-after-resume.png`), fullPage: true });

const report = {
  label: LABEL,
  seed: boundary.seed,
  summary: boundary.summary,
  resumeLabel,
  savedUnbanked: saved?.motivation?.unbanked ?? null,
  savedOutcomes: saved?.motivation?.outcomes?.length ?? null,
  shownUnbanked: Number.isFinite(shownUnbanked) ? shownUnbanked : null,
  doubled: Number.isFinite(shownUnbanked) && shownUnbanked === (saved?.motivation?.unbanked ?? -1) * 2,
  bankedAfterResume: {
    banked: afterBank?.motivation?.banked ?? null,
    unbanked: afterBank?.motivation?.unbanked ?? null,
  },
  consoleErrors,
  shots: OUT,
};
await writeFile(join(OUT, `${LABEL}-report.json`), `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(JSON.stringify(report, null, 2));
await browser.close();
