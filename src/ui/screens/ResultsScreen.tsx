import { mechanicMeta } from "../../engine/evidence";
import type { MotivationState } from "../../engine/motivation";
import { MOTIVATION_TIERS } from "../../engine/motivation";
import type { AdverseEvent } from "../../storage/adverseEvents";
import type { MechanicResult } from "../../engine/types";
import { Button } from "../components/Button";
import { SymptomCheckin } from "../components/SymptomCheckin";

interface ResultsScreenProps {
  results: MechanicResult[];
  motivation: MotivationState | null;
  sessionId: string | null;
  onAdverseLogged: (events: AdverseEvent[]) => void;
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
  d_prime: "Sensitivity (d′)",
  mean_hit_reaction_ms: "Reaction time",
  go_trials: "Go trials",
  no_go_trials: "No-go trials",
  commissions: "Impulse errors",
  go_accuracy: "Go accuracy",
  no_go_accuracy: "No-go accuracy",
  mean_go_reaction_ms: "Reaction time",
  mean_reaction_ms: "Mean reaction",
  median_reaction_ms: "Median reaction",
  fastest_reaction_ms: "Fastest reaction",
  reaction_sd_ms: "Timing variability",
  lapses: "Lapses",
  items_seen: "Items seen",
  correct: "Correct",
  incorrect: "Incorrect",
  timed_out: "Timed out",
  mean_response_ms: "Response time",
  items_total: "Items in block",
  current_streak: "Current streak",
  max_streak: "Best streak",
  near_misses: "Near misses",
};

const PRIMARY_METRICS: Record<MechanicResult["mechanic"], readonly string[]> = {
  nback: ["accuracy", "mean_hit_reaction_ms", "max_streak"],
  gonogo: ["accuracy", "commissions", "mean_go_reaction_ms"],
  reasoning: ["accuracy", "mean_response_ms", "timed_out"],
  speed: ["accuracy", "median_reaction_ms", "lapses"],
};

function formatMetric(key: string, value: number): string {
  if (key.includes("accuracy")) return `${Math.round(value * 100)}%`;
  if (key.endsWith("_ms")) {
    return value > 0 && value < 40 ? "<40 ms" : `${Math.round(value)} ms`;
  }
  if (key === "d_prime") return value.toFixed(2);
  return String(value);
}

function MetricTile({ metricKey, value }: { metricKey: string; value: number }) {
  return (
    <div className="metric">
      <dt>{METRIC_LABELS[metricKey] ?? metricKey.replaceAll("_", " ")}</dt>
      <dd>{formatMetric(metricKey, value)}</dd>
    </div>
  );
}

function ResultCard({ result }: { result: MechanicResult }) {
  const meta = mechanicMeta(result.mechanic);
  const primaryKeys = PRIMARY_METRICS[result.mechanic].filter(
    (key) => typeof result.metrics[key] === "number",
  );
  const secondary = Object.entries(result.metrics).filter(
    ([key]) => !primaryKeys.includes(key),
  );

  return (
    <article className="card result-card">
      <div className="card-top">
        <div>
          <p className="eyebrow">{meta.tagline}</p>
          <h2>{meta.name}</h2>
        </div>
      </div>
      <p className="result-summary">{result.summary}</p>
      <dl className="metrics">
        {primaryKeys.map((key) => (
          <MetricTile key={key} metricKey={key} value={result.metrics[key] ?? 0} />
        ))}
      </dl>
      {secondary.length > 0 ? (
        <details className="metric-details">
          <summary>All metrics</summary>
          <dl className="metrics metrics-secondary">
            {secondary.map(([key, value]) => (
              <MetricTile key={key} metricKey={key} value={value} />
            ))}
          </dl>
        </details>
      ) : null}
      <p className="fine">{meta.qualifier}</p>
    </article>
  );
}

export function ResultsScreen({
  results,
  motivation,
  sessionId,
  onAdverseLogged,
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
        These are practice metrics, not a diagnosis, a test score or a single brain score.
        Compare a block only with your own earlier performance on the same task.
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

      <SymptomCheckin sessionId={sessionId} onLogged={onAdverseLogged} />

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
