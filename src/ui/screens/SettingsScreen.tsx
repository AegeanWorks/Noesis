import { useState } from "react";
import { APP_VERSION, EVIDENCE_REVIEW_VERSION } from "../../content/appMeta";
import {
  FINISHER_BONUS,
  scheduleLabel,
  STEADY_SCHEDULE,
  VOLATILE_SCHEDULE,
} from "../../engine/motivation";
import type { AdverseEvent } from "../../storage/adverseEvents";
import { SYMPTOM_LABELS } from "../../storage/adverseEvents";
import type { AdherenceCounts } from "../../storage/adherence";
import { buildWeekSummaryText } from "../../storage/export";
import type { SessionRecord } from "../../storage/history";
import type { AdaptiveLevels } from "../../storage/adaptive";
import type { StudyArm, StudyState } from "../../storage/study";
import type { Difficulty, SessionLength } from "../../storage/settings";
import { Button } from "../components/Button";
import {
  ResearchDataPanel,
  type ResearchPanelState,
} from "../components/ResearchDataPanel";

interface SettingsScreenProps {
  reducedMotion: boolean;
  difficulty: Difficulty;
  sessionLength: SessionLength;
  weeklyGoal: number;
  motivationMode: boolean;
  largeText: boolean;
  highContrast: boolean;
  hideClock: boolean;
  historyCount: number;
  history: readonly SessionRecord[];
  adherenceCounts: AdherenceCounts;
  adverseEvents: AdverseEvent[];
  onClearAdverseEvents: () => void;
  motivationPaused: boolean;
  onResumeMotivation: () => void;
  adaptiveEnabled: boolean;
  adaptiveLevels: AdaptiveLevels;
  onAdaptiveToggle: (enabled: boolean) => void;
  study: StudyState;
  onEnrollStudy: (studyId: string, arm: StudyArm) => void;
  onWithdrawStudy: () => void;
  research: ResearchPanelState;
  onReducedMotion: (value: boolean) => void;
  onDifficulty: (value: Difficulty) => void;
  onSessionLength: (value: SessionLength) => void;
  onWeeklyGoal: (value: number) => void;
  onMotivationMode: (value: boolean) => void;
  onLargeText: (value: boolean) => void;
  onHighContrast: (value: boolean) => void;
  onHideClock: (value: boolean) => void;
  onResetSafety: () => void;
  onExportHistory: () => void;
  onExportSessionsCsv: () => void;
  onExportAdherenceCsv: () => void;
  onClearHistory: () => void;
  onClearData: () => void;
  onHome: () => void;
}

const AI_SNIPPET = `window.__NOESIS__.listMechanics()
window.__NOESIS__.createSession(window.__NOESIS__.defaultConfig(42))
window.__NOESIS__.dispatch({ type: "begin" })
window.__NOESIS__.getView()`;

function StudyEnrollForm({
  onEnroll,
}: {
  onEnroll: (studyId: string, arm: StudyArm) => void;
}) {
  const [studyId, setStudyId] = useState("");
  const [arm, setArm] = useState<StudyArm>("control");
  const [consented, setConsented] = useState(false);
  return (
    <div className="stack">
      <p className="fine">
        Joining a trial arm changes what the app shows: the engagement arm adds a daily
        streak reminder. Arm assignment comes from your trial protocol, not from the app.
        You can withdraw at any time without losing your data.
      </p>
      <label className="fine" htmlFor="study-id">
        Trial ID (from your investigator)
      </label>
      <input
        id="study-id"
        type="text"
        value={studyId}
        maxLength={60}
        placeholder="e.g. RCT-2026-01"
        onChange={(event) => setStudyId(event.target.value)}
      />
      <label className="fine" htmlFor="study-arm">
        Assigned arm
      </label>
      <select
        id="study-arm"
        value={arm}
        onChange={(event) => setArm(event.target.value === "engagement" ? "engagement" : "control")}
      >
        <option value="control">Control</option>
        <option value="engagement">Engagement</option>
      </select>
      <label className="check">
        <input
          type="checkbox"
          checked={consented}
          onChange={(event) => setConsented(event.target.checked)}
        />
        I understand this is an investigational use, my sessions will be tagged with this
        arm, and I can withdraw at any time.
      </label>
      <div className="hero-actions">
        <Button
          onClick={() => onEnroll(studyId.trim(), arm)}
          disabled={studyId.trim() === "" || !consented}
        >
          Enroll in study
        </Button>
      </div>
    </div>
  );
}

export function SettingsScreen({
  reducedMotion,
  difficulty,
  sessionLength,
  weeklyGoal,
  motivationMode,
  largeText,
  highContrast,
  hideClock,
  historyCount,
  history,
  adherenceCounts,
  adverseEvents,
  onClearAdverseEvents,
  motivationPaused,
  onResumeMotivation,
  adaptiveEnabled,
  adaptiveLevels,
  onAdaptiveToggle,
  study,
  onEnrollStudy,
  onWithdrawStudy,
  research,
  onReducedMotion,
  onDifficulty,
  onSessionLength,
  onWeeklyGoal,
  onMotivationMode,
  onLargeText,
  onHighContrast,
  onHideClock,
  onResetSafety,
  onExportHistory,
  onExportSessionsCsv,
  onExportAdherenceCsv,
  onClearHistory,
  onClearData,
  onHome,
}: SettingsScreenProps) {
  const [copied, setCopied] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);

  const copySnippet = async () => {
    try {
      await navigator.clipboard.writeText(AI_SNIPPET);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section className="screen settings-screen">
      <p className="eyebrow">Settings</p>
      <h1>Local control</h1>

      <nav className="settings-jump" aria-label="Jump to a settings section">
        <span className="settings-jump-label">Jump to</span>
        {[
          ["display", "Display"],
          ["session", "Session"],
          ["adaptive", "Adaptive"],
          ["study", "Study"],
          ["research", "Research"],
          ["ai", "AI mode"],
          ["symptoms", "Symptoms"],
          ["data", "Your data"],
        ].map(([id, label]) => (
          <button
            type="button"
            className="settings-jump-chip"
            aria-label={`Jump to ${label}`}
            onClick={() => {
              const reduced = document.documentElement.classList.contains("reduced-motion");
              document
                .getElementById(`settings-${id}`)
                ?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
              window.history.replaceState(null, "", `#settings-${id}`);
            }}
            key={id}
          >
            {label}
          </button>
        ))}
      </nav>

      <div className="card stack" id="settings-display">
        <h2>Display</h2>
        <label className="check">
          <input
            type="checkbox"
            checked={largeText}
            onChange={(event) => onLargeText(event.target.checked)}
          />
          Larger text
        </label>
        <label className="check">
          <input
            type="checkbox"
            checked={highContrast}
            onChange={(event) => onHighContrast(event.target.checked)}
          />
          Higher contrast
        </label>
        <label className="check">
          <input
            type="checkbox"
            checked={reducedMotion}
            onChange={(event) => onReducedMotion(event.target.checked)}
          />
          Reduce motion and animation
        </label>
        <label className="check">
          <input
            type="checkbox"
            checked={hideClock}
            onChange={(event) => onHideClock(event.target.checked)}
          />
          Hide the session clock
        </label>
        <p className="fine">
          The app already avoids flashing. These settings make text and controls easier to read
          and reduce non-essential motion. Hiding the clock removes time pressure; untimed
          practice favours anxious trainers most.
        </p>
        <p className="fine" data-testid="clock-evidence">
          <strong>What the literature says:</strong> a meta-analysis of 15 trials (759 older
          adults) reported small gains in processing speed (g=0.23), selective attention (g=0.40)
          and short-term memory (g=0.35); non-time-pressure formats were among the preferable
          design features. A separate 52-trial meta-analysis found a small overall benefit (g=0.22)
          but no advantage for unsupervised home practice or more than three sessions a week. That is
          group-level context, not a personal prescription.{" "}
          <a
            href="https://pubmed.ncbi.nlm.nih.gov/32980574/"
            target="_blank"
            rel="noreferrer"
          >
            Wang et al. 2021
          </a>{" "}
          <span className="pmid">PMID 32980574</span>{" "}
          <a
            href="https://pubmed.ncbi.nlm.nih.gov/25405755/"
            target="_blank"
            rel="noreferrer"
          >
            Lampit et al. 2014
          </a>{" "}
          <span className="pmid">PMID 25405755</span>
        </p>
      </div>

      <div className="card stack" id="settings-session">
        <h2>Session defaults</h2>
        <p className="fine">
          The one-click start uses these choices. Harder is not automatically better; choose the
          level you can sustain.
        </p>
        <fieldset>
          <legend>Length</legend>
          <div className="choice-row">
            <label className="choice">
              <input
                type="radio"
                name="sessionLength"
                checked={sessionLength === "quick"}
                onChange={() => onSessionLength("quick")}
              />
              Quick · 2 blocks · 5 min
            </label>
            <label className="choice">
              <input
                type="radio"
                name="sessionLength"
                checked={sessionLength === "standard"}
                onChange={() => onSessionLength("standard")}
              />
              Standard · 4 blocks · 8 min
            </label>
          </div>
        </fieldset>
        <fieldset>
          <legend>Difficulty</legend>
          <div className="choice-row">
            {([
              [1, "Gentle"],
              [2, "Standard"],
              [3, "Challenge"],
            ] as const).map(([value, label]) => (
              <label className="choice" key={value}>
                <input
                  type="radio"
                  name="difficulty"
                  checked={difficulty === value}
                  onChange={() => onDifficulty(value)}
                />
                {label}
              </label>
            ))}
          </div>
        </fieldset>
        <label className="fine" htmlFor="weekly-goal">
          Weekly practice-day goal
        </label>
        <select
          id="weekly-goal"
          value={weeklyGoal}
          onChange={(event) => onWeeklyGoal(Number(event.target.value))}
        >
          {[1, 2, 3, 4, 5, 6, 7].map((count) => (
            <option key={count} value={count}>
              {count} {count === 1 ? "day" : "days"} a week
            </option>
          ))}
        </select>
        <p className="fine">
          Spaced days beat crammed sessions: the goal counts days with at least one
          session, so spreading practice across the week is what counts.
        </p>
        <label className="check">
          <input
            type="checkbox"
            checked={motivationMode}
            onChange={(event) => onMotivationMode(event.target.checked)}
          />
          Motivation mode: streaks, bonus rolls and optional risk
        </label>
        <p className="fine">
          Momentum is cosmetic and never changes your cognitive scores. Bonus odds are{" "}
          {scheduleLabel(
            study.enrolled && study.arm === "engagement" ? VOLATILE_SCHEDULE : STEADY_SCHEDULE,
          )}
          . Risk is optional and only affects bonus points; core progress is never lost.
          {study.enrolled && study.arm === "engagement" ? (
            <>
              {" "}
              Your engagement arm uses the volatile schedule and earns a finisher bonus of{" "}
              {FINISHER_BONUS} momentum for completing a session.
            </>
          ) : null}
        </p>
        {motivationPaused ? (
          <p className="fine">
            Motivation bonuses are paused for today after heavy use. They return tomorrow, or
            you can resume now.
          </p>
        ) : null}
        {motivationPaused ? (
          <div className="hero-actions">
            <Button variant="ghost" onClick={onResumeMotivation}>
              Resume Motivation now
            </Button>
          </div>
        ) : null}
      </div>

      <div className="card stack" id="settings-adaptive">
        <h2>Adaptive difficulty</h2>
        <label className="check">
          <input
            type="checkbox"
            checked={adaptiveEnabled}
            onChange={(event) => onAdaptiveToggle(event.target.checked)}
          />
          Experimental: adjust each task level from recent accuracy
        </label>
        <p className="fine">
          When on, a task steps up after a block at 80% or better and steps down below 60%,
          between levels 1 and 3. Levels apply to the next session. This is an experiment, not
          a proven better way to train: compare blocks only within the same level.
        </p>
        {adaptiveEnabled ? (
          <ul className="practice-list">
            {(Object.keys(adaptiveLevels) as (keyof AdaptiveLevels)[]).map((mechanic) => (
              <li className="practice-row" key={mechanic}>
                <span>{mechanic}</span>
                <span>Level {adaptiveLevels[mechanic]}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <div className="card stack" id="settings-study">
        <h2>Research study</h2>
        {study.enrolled && study.studyId && study.arm ? (
          <>
            <p className="fine">
              Enrolled in {study.studyId}, arm: {study.arm}. Every session is tagged with
              this arm in the export. Safety monitoring stays on in every arm.
            </p>
            <div className="hero-actions">
              <Button variant="ghost" onClick={onWithdrawStudy}>
                Withdraw from study
              </Button>
            </div>
          </>
        ) : (
          <StudyEnrollForm onEnroll={onEnrollStudy} />
        )}
      </div>

      <div id="settings-research">
        <ResearchDataPanel {...research} />
      </div>

      <div className="card stack" id="settings-ai">
        <h2>AI test mode</h2>
        <p>
          Every mechanic is a deterministic state machine. Open the app with{" "}
          <code>?ai=1</code>, then drive the real session through{" "}
          <code>window.__NOESIS__</code>.
        </p>
        <pre className="code">{AI_SNIPPET}</pre>
        <div className="hero-actions">
          <Button variant="ghost" onClick={copySnippet}>
            {copied ? "Copied" : "Copy AI snippet"}
          </Button>
        </div>
        <p className="fine">
          The harness exposes session state on this device only. It is not a network API and
          sends no data anywhere.
        </p>
      </div>

      <div className="card stack" id="settings-symptoms">
        <h2>Symptom reports</h2>
        <p className="fine">
          {adverseEvents.length === 0
            ? "No symptoms have been reported. They are logged here after sessions."
            : `${adverseEvents.length} symptom ${adverseEvents.length === 1 ? "report is" : "reports are"} stored on this device.`}{" "}
          There is no account and no server.
        </p>
        {adverseEvents.length > 0 ? (
          <ul className="practice-list">
            {adverseEvents.map((event) => (
              <li className="practice-row" key={event.id}>
                <span>
                  {new Date(event.reportedAt).toLocaleDateString()} ·{" "}
                  {event.symptoms.map((symptom) => SYMPTOM_LABELS[symptom]).join(", ")} ·{" "}
                  {event.severity}
                  {event.stoppedSession ? " · stop advised" : ""}
                </span>
              </li>
            ))}
          </ul>
        ) : null}
        <div className="hero-actions">
          <Button variant="ghost" onClick={onClearAdverseEvents} disabled={adverseEvents.length === 0}>
            Clear symptom reports
          </Button>
        </div>
      </div>

      <div className="card stack" id="settings-data">
        <h2>Your data</h2>
        <p className="fine">
          {historyCount === 0
            ? "No completed sessions are stored yet."
            : `${historyCount} completed ${historyCount === 1 ? "session is" : "sessions are"} stored on this device.`}{" "}
          There is no account and no server.
        </p>
        <p className="fine" data-testid="adherence-summary">
          {adherenceCounts.started === 0
            ? "Session log: no sessions started yet. Starts, completions and early endings are included in research exports."
            : `Session log: ${adherenceCounts.started} started, ${adherenceCounts.completed} completed, ${adherenceCounts.aborted} ended early. This log is included in research exports.`}
        </p>
        <div className="hero-actions">
          <Button variant="ghost" onClick={onExportHistory} disabled={historyCount === 0}>
            Export practice data
          </Button>
          <Button
            variant="ghost"
            onClick={onExportSessionsCsv}
            disabled={historyCount === 0}
          >
            Download sessions CSV
          </Button>
          <Button
            variant="ghost"
            onClick={onExportAdherenceCsv}
            disabled={adherenceCounts.started === 0}
          >
            Download adherence CSV
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              const text = buildWeekSummaryText(history, weeklyGoal);
              if (typeof navigator !== "undefined" && navigator.clipboard) {
                navigator.clipboard.writeText(text).then(
                  () => {
                    setCopiedSummary(true);
                    window.setTimeout(() => setCopiedSummary(false), 1500);
                  },
                  () => setCopiedSummary(false),
                );
              }
            }}
            disabled={historyCount === 0}
          >
            {copiedSummary ? "Copied week summary" : "Copy week summary"}
          </Button>
          <Button variant="ghost" onClick={onClearHistory} disabled={historyCount === 0}>
            Clear practice history
          </Button>
          <Button variant="ghost" onClick={onResetSafety}>
            Reset safety profile
          </Button>
          <Button variant="danger" onClick={onClearData}>
            Delete local data
          </Button>
        </div>
      </div>

      <p className="fine">
        Noesis app {APP_VERSION} · evidence review {EVIDENCE_REVIEW_VERSION}
      </p>
      <Button variant="ghost" onClick={onHome}>
        Back to home
      </Button>
    </section>
  );
}
