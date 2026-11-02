import { useEffect } from "react";
import { mechanicMeta } from "../../engine/evidence";
import type { MotivationState } from "../../engine/motivation";
import { MOTIVATION_TIERS, riskThreshold, totalMomentum } from "../../engine/motivation";
import type { SessionView } from "../../engine/types";
import { Button } from "../components/Button";
import { MechanicStage } from "../components/MechanicStage";
import { ProgressBar } from "../components/ProgressBar";

interface SessionScreenProps {
  view: SessionView;
  paused: boolean;
  motivation: MotivationState | null;
  targetMs: number;
  elapsedMs: number;
  showClock: boolean;
  onPause: () => void;
  onResume: () => void;
  onEnd: () => void;
  onNext: () => void;
  onBankAndNext: () => void;
  onRiskAndNext: () => void;
  onRespond: () => void;
  onAnswer: (option: number) => void;
}

function isInteractiveTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return ["BUTTON", "INPUT", "TEXTAREA", "SELECT", "A"].includes(target.tagName);
}

function formatMs(ms: number): string {
  const totalSeconds = Math.max(0, Math.round(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function SessionScreen({
  view,
  paused,
  motivation,
  targetMs,
  elapsedMs,
  showClock,
  onPause,
  onResume,
  onEnd,
  onNext,
  onBankAndNext,
  onRiskAndNext,
  onRespond,
  onAnswer,
}: SessionScreenProps) {
  const isLastBlock = view.blockIndex + 1 >= view.blockCount;
  const outcome = motivation?.outcomes[motivation.outcomes.length - 1] ?? null;

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.defaultPrevented || isInteractiveTarget(event.target)) return;
      if (view.phase === "block_complete") {
        if (event.key === "Enter") {
          event.preventDefault();
          if (motivation) onBankAndNext();
          else onNext();
        }
        return;
      }
      if (paused || !view.mechanic) return;
      if (
        (view.mechanic.mechanic === "nback" ||
          view.mechanic.mechanic === "gonogo" ||
          view.mechanic.mechanic === "speed") &&
        event.code === "Space"
      ) {
        event.preventDefault();
        if (view.mechanic.canRespond) onRespond();
        return;
      }
      if (view.mechanic.mechanic === "reasoning" && /^[1-4]$/.test(event.key)) {
        event.preventDefault();
        if (view.mechanic.canRespond) onAnswer(Number(event.key) - 1);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [view, paused, motivation, onNext, onBankAndNext, onRespond, onAnswer]);

  const mechanic = view.mechanic;
  const meta = mechanic ? mechanicMeta(mechanic.mechanic) : null;
  const lastResult = view.results[view.results.length - 1] ?? null;
  const streak = mechanic?.metrics.current_streak ?? 0;
  const bestStreak = mechanic?.metrics.max_streak ?? 0;

  return (
    <section className="screen session-screen" data-testid="session-root" data-phase={view.phase}>
      <header className="session-header">
        <div>
          <p className="eyebrow">
            Block {view.blockIndex + 1} of {view.blockCount}
          </p>
        <h1>{view.blockLabel}</h1>
        {showClock ? (
          <p className={`session-clock ${elapsedMs > targetMs ? "session-clock-over" : ""}`}>
            Elapsed {formatMs(elapsedMs)} · Target {formatMs(targetMs)}
          </p>
        ) : null}
        </div>
        <Button
          variant="ghost"
          onClick={onPause}
          disabled={paused || view.phase !== "running"}
          data-testid="pause"
        >
          Pause
        </Button>
      </header>

      {mechanic ? (
        <>
          <ProgressBar
            current={mechanic.progressCurrent}
            total={mechanic.progressTotal}
            label={`${meta?.name ?? "Block"} progress`}
          />
          {motivation ? (
            <div className="streak-row" data-testid="streak">
              <span>
                Streak <strong>{streak}</strong>
              </span>
              <span>
                Best <strong>{bestStreak}</strong>
              </span>
              <span className="streak-momentum">
                Momentum {totalMomentum(motivation)}
                {motivation.risk ? ` · ${motivation.riskAmount} at risk` : ""}
              </span>
            </div>
          ) : null}
          <p className="instruction">{meta?.instructions}</p>
          {view.phase === "block_complete" ? (
            <div className="card completion-card" data-testid="block-complete">
              <p className="eyebrow">Block complete</p>
              <h2>{meta?.name}</h2>
              <p>{lastResult?.summary ?? "Block finished."}</p>

              {motivation && outcome ? (
                <div className="momentum-block" data-testid="momentum">
                  <div className="momentum-headline">
                    <span className="momentum-points">+{outcome.points} momentum</span>
                    <span className={`badge tier-${outcome.tier}`}>
                      {MOTIVATION_TIERS[outcome.tier].label}
                    </span>
                  </div>
                  <p className="fine">
                    Streak {outcome.streak} · x{outcome.multiplier} multiplier
                    {outcome.nearBest ? " · So close to your best: +10" : ""}
                  </p>
                  <p className="fine">
                    Banked {motivation.banked} · Unbanked {motivation.unbanked}
                  </p>
                </div>
              ) : null}

              {motivation && !isLastBlock ? (
                <div className="completion-actions">
                  <Button
                    onClick={onBankAndNext}
                    className="wide"
                    data-testid="bank-next"
                  >
                    {motivation.unbanked > 0
                      ? `Bank ${motivation.unbanked} and continue`
                      : "Bank and continue"}
                  </Button>
                  {motivation.unbanked > 0 ? (
                    <Button
                      variant="ghost"
                      onClick={onRiskAndNext}
                      className="wide"
                      data-testid="risk-next"
                    >
                      Risk {motivation.unbanked} on the next block (need{" "}
                      {Math.round(riskThreshold() * 100)}% accuracy)
                    </Button>
                  ) : null}
                </div>
              ) : (
                <Button
                  onClick={motivation ? onBankAndNext : onNext}
                  className="wide"
                  data-testid="next-block"
                >
                  {isLastBlock ? "Finish" : "Continue"}
                </Button>
              )}
            </div>
          ) : (
            <MechanicStage view={mechanic} onRespond={onRespond} onAnswer={onAnswer} />
          )}
        </>
      ) : (
        <p className="muted">Preparing session…</p>
      )}

      {view.error ? (
        <p className="error" role="alert">
          {view.error}
        </p>
      ) : null}

      {paused ? (
        <div className="overlay" role="dialog" aria-modal="true" aria-label="Session paused">
          <div className="card overlay-card">
            <h2>Paused</h2>
            <p className="muted">The clock is stopped. Take your time.</p>
            <div className="hero-actions">
              <Button onClick={onResume}>Resume</Button>
              <Button variant="danger" onClick={onEnd}>
                End session
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
