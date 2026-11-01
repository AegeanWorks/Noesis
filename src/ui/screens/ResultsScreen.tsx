import { mechanicMeta } from "../../engine/evidence";
import type { MotivationState } from "../../engine/motivation";
import { MOTIVATION_TIERS } from "../../engine/motivation";
import type { MechanicResult } from "../../engine/types";
import { Button } from "../components/Button";

interface ResultsScreenProps {
  results: MechanicResult[];
  motivation: MotivationState | null;
  onRestart: () => void;
  onEvidence: () => void;
  onHome: () => void;
}

const METRIC_LABELS: Record<string, string> = {
  trials_seen: "Trials seen",
  targets: "Targets",
  hits: "Hits",
  misses: "Misses",
  false_alarms: "False alarms",
  correct_rejections: "Correct rejections",
  accuracy: "Accuracy",
  d_prime: "d′",
  mean_hit_reaction_ms: "Mean hit RT",
  go_trials: "Go trials",
  no_go_trials: "No-go trials",
  commissions: "Impulse errors",
  go_accuracy: "Go accuracy",
  no_go_accuracy: "No-go accuracy",
  mean_go_reaction_ms: "Mean go RT",
  items_seen: "Items seen",
  correct: "Correct",
  incorrect: "Incorrect",
  timed_out: "Timed out",
  mean_response_ms: "Mean response time",
  items_total: "Items in block",
  current_streak: "Current streak",
  max_streak: "Best streak",
  near_misses: "Near misses",
};

function formatMetric(key: string, value: number): string {
  if (key.includes("accuracy")) return `${Math.round(value * 100)}%`;
  if (key.endsWith("_ms")) return `${Math.round(value)} ms`;
  if (key === "d_prime") return value.toFixed(2);
  return String(value);
}

function ResultCard({ result }: { result: MechanicResult }) {
  const meta = mechanicMeta(result.mechanic);
  return (
    <article className="card result-card">
      <div className="card-top">
        <div>
          <p className="eyebrow">{meta.tagline}</p>
          <h2>{meta.name}</h2>
        </div>
        <span className="seed">seed {result.seed}</span>
      </div>
      <p className="result-summary">{result.summary}</p>
      <dl className="metrics">
        {Object.entries(result.metrics).map(([key, value]) => (
          <div key={key} className="metric">
            <dt>{METRIC_LABELS[key] ?? key.replaceAll("_", " ")}</dt>
            <dd>{formatMetric(key, value)}</dd>
          </div>
        ))}
      </dl>
      <p className="fine">{meta.qualifier}</p>
    </article>
  );
}

export function ResultsScreen({
  results,
  motivation,
  onRestart,
  onEvidence,
  onHome,
}: ResultsScreenProps) {
  const notClaimed = Array.from(
    new Set(results.flatMap((result) => mechanicMeta(result.mechanic).notClaimed)),
  );

  return (
    <section className="screen results-screen">
      <p className="eyebrow">Session complete</p>
      <h1>Your blocks, separately</h1>
      <p className="lede">
        These are practice metrics, not a diagnosis or a single brain score. Compare a block
        only with your own earlier performance on the same task.
      </p>

      {results.length === 0 ? (
        <p className="notice">No results yet. Start a session to measure a block.</p>
      ) : (
        <div className="stack">
          {results.map((result, index) => (
            <ResultCard key={`${result.mechanic}-${index}`} result={result} />
          ))}
        </div>
      )}

      {motivation ? (
        <section className="card momentum-summary" data-testid="momentum-summary">
          <div className="card-top">
            <div>
              <p className="eyebrow">Motivation mode</p>
              <h2>Momentum: {motivation.banked}</h2>
            </div>
          </div>
          <ul className="momentum-list">
            {motivation.outcomes.map((outcome) => (
              <li key={outcome.blockIndex}>
                <span>
                  Block {outcome.blockIndex + 1} · {MOTIVATION_TIERS[outcome.tier].label}
                </span>
                <span>
                  +{outcome.points} · streak {outcome.streak}
                  {outcome.nearBest ? " · near best" : ""}
                </span>
              </li>
            ))}
          </ul>
          <p className="fine">
            Momentum is cosmetic. It does not change your cognitive scores, and a risky choice
            never puts core progress at stake.
          </p>
        </section>
      ) : null}

      <aside className="notice">
        <h3>What this does not mean</h3>
        <ul>
          {notClaimed.map((claim) => (
            <li key={claim}>{claim}</li>
          ))}
          <li>A change in one session is not evidence of durable improvement.</li>
        </ul>
      </aside>

      <div className="hero-actions">
        <Button onClick={onRestart}>Run another session</Button>
        <Button variant="ghost" onClick={onEvidence}>
          Read the evidence
        </Button>
        <Button variant="subtle" onClick={onHome}>
          Home
        </Button>
      </div>
    </section>
  );
}
