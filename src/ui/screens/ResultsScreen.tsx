import { mechanicMeta } from "../../engine/evidence";
import type { MotivationState } from "../../engine/motivation";
import { MOTIVATION_TIERS } from "../../engine/motivation";
import type { AdverseEvent } from "../../storage/adverseEvents";
import type { SessionRecord } from "../../storage/history";
import type { MechanicResult } from "../../engine/types";
import { Button } from "../components/Button";
import { SymptomCheckin } from "../components/SymptomCheckin";

interface ResultsScreenProps {
  results: MechanicResult[];
  history: readonly SessionRecord[];
  motivation: MotivationState | null;
  sessionId: string | null;
  newBests: MechanicResult["mechanic"][];
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
  switch_trials: "Switch trials",
  repeat_trials: "Repeat trials",
  switch_correct: "Switch correct",
  repeat_correct: "Repeat correct",
  switch_accuracy: "Switch accuracy",
  repeat_accuracy: "Repeat accuracy",
  switch_mean_response_ms: "Switch reaction",
  repeat_mean_response_ms: "Repeat reaction",
  switch_cost_ms: "Switch cost",
  congruent_trials: "Congruent trials",
  incongruent_trials: "Incongruent trials",
  congruent_accuracy: "Congruent accuracy",
  incongruent_accuracy: "Incongruent accuracy",
  congruent_mean_response_ms: "Congruent reaction",
  incongruent_mean_response_ms: "Incongruent reaction",
  interference_cost_ms: "Interference cost",
};

const PRIMARY_METRICS: Record<MechanicResult["mechanic"], readonly string[]> = {
  nback: ["accuracy", "mean_hit_reaction_ms", "max_streak"],
  gonogo: ["accuracy", "commissions", "mean_go_reaction_ms"],
  reasoning: ["accuracy", "mean_response_ms", "timed_out"],
  speed: ["accuracy", "median_reaction_ms", "lapses"],
  switching: ["accuracy", "switch_cost_ms", "switch_accuracy"],
  flanker: ["accuracy", "interference_cost_ms", "incongruent_accuracy"],
};

export function formatMetric(key: string, value: number): string {
  if (key.includes("accuracy")) return `${Math.round(value * 100)}%`;
  if (key.endsWith("_ms")) return `${Math.round(value)} ms`;
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

interface SwitchCostComparison {
  previous: number;
  delta: number;
}

function costComparisons(
  history: readonly SessionRecord[],
  sessionId: string | null,
  results: readonly MechanicResult[],
  mechanic: MechanicResult["mechanic"],
  metricKey: string,
): Array<SwitchCostComparison | null> {
  const previousByLevel = new Map<number, number>();
  for (const record of [...history].reverse()) {
    if (record.id === sessionId) continue;
    for (const result of record.results) {
      if (result.mechanic !== mechanic) continue;
      const level = result.difficulty;
      const cost = result.metrics[metricKey];
      if (typeof level === "number" && typeof cost === "number" && Number.isFinite(cost)) {
        previousByLevel.set(level, cost);
      }
    }
  }
  return results.map((result) => {
    if (result.mechanic !== mechanic) return null;
    const level = result.difficulty;
    const cost = result.metrics[metricKey];
    if (typeof level !== "number" || typeof cost !== "number" || !Number.isFinite(cost)) {
      return null;
    }
    const previous = previousByLevel.get(level);
    previousByLevel.set(level, cost);
    return previous === undefined ? null : { previous, delta: cost - previous };
  });
}

function switchCostComparisons(
  history: readonly SessionRecord[],
  sessionId: string | null,
  results: readonly MechanicResult[],
): Array<SwitchCostComparison | null> {
  return costComparisons(history, sessionId, results, "switching", "switch_cost_ms");
}

function interferenceCostComparisons(
  history: readonly SessionRecord[],
  sessionId: string | null,
  results: readonly MechanicResult[],
): Array<SwitchCostComparison | null> {
  return costComparisons(history, sessionId, results, "flanker", "interference_cost_ms");
}

function costChange(
  comparison: SwitchCostComparison | null,
  level: number | undefined,
  current: number | undefined,
  metricName: string,
): { direction: string; text: string } {
  if (comparison === null) {
    return {
      direction: "first",
      text:
        typeof level === "number"
          ? `First block at this level; no earlier ${metricName} comparison.`
          : `No earlier ${metricName} comparison.`,
    };
  }
  if (comparison.delta < 0) {
    return {
      direction: "improved",
      text: `Improved ${Math.abs(comparison.delta)} ms vs previous Level ${level} block (${comparison.previous} → ${Math.round(current ?? 0)} ms).`,
    };
  }
  if (comparison.delta > 0) {
    return {
      direction: "worsened",
      text: `Worsened +${comparison.delta} ms vs previous Level ${level} block (${comparison.previous} → ${Math.round(current ?? 0)} ms).`,
    };
  }
  return {
    direction: "same",
    text: `No change vs previous Level ${level} block (${comparison.previous} ms).`,
  };
}

function ResultCard({
  result,
  index,
  isNewBest,
  switchCostComparison,
  interferenceCostComparison,
}: {
  result: MechanicResult;
  index: number;
  isNewBest: boolean;
  switchCostComparison: SwitchCostComparison | null;
  interferenceCostComparison: SwitchCostComparison | null;
}) {
  const meta = mechanicMeta(result.mechanic);
  const primaryKeys = PRIMARY_METRICS[result.mechanic].filter(
    (key) => typeof result.metrics[key] === "number",
  );
  const secondary = Object.entries(result.metrics).filter(
    ([key]) => !primaryKeys.includes(key),
  );
  const switchChange = costChange(
    switchCostComparison,
    result.difficulty,
    result.metrics.switch_cost_ms,
    "switch-cost",
  );
  const interferenceChange = costChange(
    interferenceCostComparison,
    result.difficulty,
    result.metrics.interference_cost_ms,
    "interference-cost",
  );

  return (
    <article className="card result-card">
      <div className="card-top">
        <div>
          <p className="eyebrow">{meta.tagline}</p>
          <h2>{meta.name}</h2>
        </div>
        {typeof result.difficulty === "number" ? (
          <span className="level-badge" data-testid={`level-${result.mechanic}`}>
            Level {result.difficulty}
          </span>
        ) : null}
      </div>
      <p className="result-summary">{result.summary}</p>
      {result.mechanic === "switching" ? (
        <>
          <p className="fine switch-cost-note" data-testid="switch-cost-note">
            Switch cost = mean reaction on switch trials minus repeat trials. A negative value
            means switching was faster than repeating in this block; it is a descriptive
            within-session measure, not a diagnosis.
          </p>
          <p
            className={`fine switch-cost-change switch-cost-change-${switchChange.direction}`}
            data-testid={`switch-cost-vs-previous-${index}`}
            data-direction={switchChange.direction}
          >
            {switchChange.text}
          </p>
        </>
      ) : null}
      {result.mechanic === "flanker" ? (
        <>
          <p className="fine flanker-interference-note" data-testid="flanker-interference-note">
            Interference cost = mean reaction on incongruent trials minus congruent trials. A
            negative value means conflicting flankers did not slow you in this block; it is a
            descriptive within-session measure, not a diagnosis.
          </p>
          <p
            className={`fine switch-cost-change switch-cost-change-${interferenceChange.direction}`}
            data-testid={`flanker-cost-vs-previous-${index}`}
            data-direction={interferenceChange.direction}
          >
            {interferenceChange.text}
          </p>
        </>
      ) : null}
      {isNewBest ? (
        <p className="best-badge" data-testid={`new-best-${result.mechanic}`}>
          New personal best
        </p>
      ) : null}
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
  history,
  motivation,
  sessionId,
  newBests,
  onAdverseLogged,
  onRestart,
  onEvidence,
  onHome,
}: ResultsScreenProps) {
  const notClaimed = Array.from(
    new Set(results.flatMap((result) => mechanicMeta(result.mechanic).notClaimed)),
  );
  const switchComparisons = switchCostComparisons(history, sessionId, results);
  const interferenceComparisons = interferenceCostComparisons(history, sessionId, results);

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
            <ResultCard
              key={`${result.mechanic}-${index}`}
              result={result}
              index={index}
              isNewBest={newBests.includes(result.mechanic)}
              switchCostComparison={switchComparisons[index] ?? null}
              interferenceCostComparison={interferenceComparisons[index] ?? null}
            />
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
            {motivation.completionBonus > 0 ? (
              <li key="finisher">
                <span>Finisher bonus</span>
                <span>+{motivation.completionBonus} for completing every block</span>
              </li>
            ) : null}
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
