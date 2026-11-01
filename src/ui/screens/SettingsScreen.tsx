import { useState } from "react";
import type { Difficulty, SessionLength } from "../../storage/settings";
import { Button } from "../components/Button";

interface SettingsScreenProps {
  reducedMotion: boolean;
  difficulty: Difficulty;
  sessionLength: SessionLength;
  motivationMode: boolean;
  historyCount: number;
  onReducedMotion: (value: boolean) => void;
  onDifficulty: (value: Difficulty) => void;
  onSessionLength: (value: SessionLength) => void;
  onMotivationMode: (value: boolean) => void;
  onResetSafety: () => void;
  onExportHistory: () => void;
  onClearHistory: () => void;
  onClearData: () => void;
  onHome: () => void;
}

const AI_SNIPPET = `window.__NOESIS__.listMechanics()
window.__NOESIS__.createSession(window.__NOESIS__.defaultConfig(42))
window.__NOESIS__.dispatch({ type: "begin" })
window.__NOESIS__.getView()`;

export function SettingsScreen({
  reducedMotion,
  difficulty,
  sessionLength,
  motivationMode,
  historyCount,
  onReducedMotion,
  onDifficulty,
  onSessionLength,
  onMotivationMode,
  onResetSafety,
  onExportHistory,
  onClearHistory,
  onClearData,
  onHome,
}: SettingsScreenProps) {
  const [copied, setCopied] = useState(false);

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

      <div className="card stack">
        <label className="check">
          <input
            type="checkbox"
            checked={reducedMotion}
            onChange={(event) => onReducedMotion(event.target.checked)}
          />
          Reduce motion and animation
        </label>
        <p className="fine">
          The app already avoids flashing. This setting reduces transitions and non-essential
          motion.
        </p>
      </div>

      <div className="card stack">
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
              Quick · 2 blocks
            </label>
            <label className="choice">
              <input
                type="radio"
                name="sessionLength"
                checked={sessionLength === "standard"}
                onChange={() => onSessionLength("standard")}
              />
              Standard · 3 blocks
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
        <label className="check">
          <input
            type="checkbox"
            checked={motivationMode}
            onChange={(event) => onMotivationMode(event.target.checked)}
          />
          Motivation mode: streaks, bonus rolls and optional risk
        </label>
        <p className="fine">
          Momentum is cosmetic and never changes your cognitive scores. Bonus odds are 70%
          steady, 20% boost and 10% rare. Risk is optional and only affects bonus points; core
          progress is never lost.
        </p>
      </div>

      <div className="card stack">
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

      <div className="card stack">
        <h2>Your data</h2>
        <p className="fine">
          {historyCount === 0
            ? "No completed sessions are stored yet."
            : `${historyCount} completed ${historyCount === 1 ? "session is" : "sessions are"} stored on this device.`}{" "}
          There is no account and no server.
        </p>
        <div className="hero-actions">
          <Button variant="ghost" onClick={onExportHistory} disabled={historyCount === 0}>
            Export practice data
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

      <p className="fine">Noesis app 0.1.0 · evidence review v1.0</p>
      <Button variant="ghost" onClick={onHome}>
        Back to home
      </Button>
    </section>
  );
}
