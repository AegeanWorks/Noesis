import { mechanicMeta } from "../../engine/evidence";
import type { MotivationState } from "../../engine/motivation";
import { MOTIVATION_TIERS } from "../../engine/motivation";
import type { AdverseEvent } from "../../storage/adverseEvents";
import type { SessionRecord } from "../../storage/history";
import type { MechanicResult, Confidence } from "../../engine/types";
import { Button } from "../components/Button";
import { SymptomCheckin } from "../components/SymptomCheckin";

interface ResultsScreenProps {
  results: MechanicResult[];
  history: readonly SessionRecord[];
  confidences?: readonly (Confidence | null)[];
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
  max_span: "Longest span",
  mean_span: "Mean span",
  same_trials: "Same trials",
  mirror_trials: "Mirror trials",
  same_accuracy: "Same accuracy",
  mirror_accuracy: "Mirror accuracy",
  ongoing_accuracy: "Ongoing accuracy",
  cue_accuracy: "Cue accuracy",
  cue_hits: "Cues remembered",
  cue_trials: "Cue trials",
};

const PRIMARY_METRICS: Record<MechanicResult["mechanic"], readonly string[]> = {
  nback: ["accuracy", "mean_hit_reaction_ms", "max_streak"],
  gonogo: ["accuracy", "commissions", "mean_go_reaction_ms"],
  reasoning: ["accuracy", "mean_response_ms", "timed_out"],
  speed: ["accuracy", "median_reaction_ms", "lapses"],
  switching: ["accuracy", "switch_cost_ms", "switch_accuracy"],
  flanker: ["accuracy", "interference_cost_ms", "incongruent_accuracy"],
  spatial: ["accuracy", "max_span", "mean_span"],
  rotation: ["accuracy", "mean_response_ms", "mirror_accuracy"],
  prospective: ["accuracy", "cue_accuracy", "false_alarms"],
  paired: ["accuracy", "mean_response_ms", "max_streak"],
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

function spanComparisons(
  history: readonly SessionRecord[],
  sessionId: string | null,
  results: readonly MechanicResult[],
): Array<SwitchCostComparison | null> {
  return costComparisons(history, sessionId, results, "spatial", "mean_span");
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

function spanChange(
  comparison: SwitchCostComparison | null,
  level: number | undefined,
  current: number | undefined,
): { direction: string; text: string } {
  if (comparison === null) {
    return {
      direction: "first",
      text:
        typeof level === "number"
          ? "First block at this level; no earlier mean-span comparison."
          : "No earlier mean-span comparison.",
    };
  }
  const delta = Math.round(comparison.delta * 10) / 10;
  if (delta > 0) {
    return {
      direction: "improved",
      text: `Improved +${delta.toFixed(1)} mean span vs previous Level ${level} block (${comparison.previous.toFixed(1)} → ${(current ?? 0).toFixed(1)}).`,
    };
  }
  if (delta < 0) {
    return {
      direction: "worsened",
      text: `Worsened ${delta.toFixed(1)} mean span vs previous Level ${level} block (${comparison.previous.toFixed(1)} → ${(current ?? 0).toFixed(1)}).`,
    };
  }
  return {
    direction: "same",
    text: `No change vs previous Level ${level} block (${comparison.previous.toFixed(1)} mean span).`,
  };
}

function accuracyChange(
  comparison: SwitchCostComparison | null,
  level: number | undefined,
  current: number | undefined,
): { direction: string; text: string } {
  if (comparison === null) {
    return {
      direction: "first",
      text:
        typeof level === "number"
          ? "First block at this level; no earlier accuracy comparison."
          : "No earlier accuracy comparison.",
    };
  }
  const delta = Math.round(comparison.delta * 100);
  const previous = `${Math.round(comparison.previous * 100)}%`;
  const currentText = `${Math.round((current ?? 0) * 100)}%`;
  if (delta > 0) {
    return {
      direction: "improved",
      text: `Accuracy improved +${delta} pp vs previous Level ${level} block (${previous} → ${currentText}).`,
    };
  }
  if (delta < 0) {
    return {
      direction: "worsened",
      text: `Accuracy worsened ${delta} pp vs previous Level ${level} block (${previous} → ${currentText}).`,
    };
  }
  return {
    direction: "same",
    text: `Accuracy unchanged vs previous Level ${level} block (${previous}).`,
  };
}

function responseTimeChange(
  comparison: SwitchCostComparison | null,
  level: number | undefined,
  current: number | undefined,
): { direction: string; text: string } {
  if (comparison === null) {
    return {
      direction: "first",
      text:
        typeof level === "number"
          ? "First block at this level; no earlier response-time comparison."
          : "No earlier response-time comparison.",
    };
  }
  const delta = Math.round(comparison.delta);
  const previous = `${Math.round(comparison.previous)}`;
  const previousWithUnit = `${previous} ms`;
  const currentText = `${Math.round(current ?? 0)} ms`;
  if (delta < 0) {
    return {
      direction: "improved",
      text: `Response time improved ${Math.abs(delta)} ms faster vs previous Level ${level} block (${previous} → ${currentText}).`,
    };
  }
  if (delta > 0) {
    return {
      direction: "worsened",
      text: `Response time worsened +${delta} ms slower vs previous Level ${level} block (${previous} → ${currentText}).`,
    };
  }
  return {
    direction: "same",
    text: `Response time unchanged vs previous Level ${level} block (${previousWithUnit}).`,
  };
}

interface ProspectiveSnapshot {
  ongoing: number;
  cueHits: number;
  cueTrials: number;
  falseAlarms: number;
}

interface ProspectiveComparison {
  previous: ProspectiveSnapshot;
  current: ProspectiveSnapshot;
}

function prospectiveComparisons(
  history: readonly SessionRecord[],
  sessionId: string | null,
  results: readonly MechanicResult[],
): Array<ProspectiveComparison | null> {
  const previousByLevel = new Map<number, ProspectiveSnapshot>();
  for (const record of [...history].reverse()) {
    if (record.id === sessionId) continue;
    for (const result of record.results) {
      if (result.mechanic !== "prospective") continue;
      const level = result.difficulty;
      const snapshot = prospectiveSnapshot(result);
      if (typeof level === "number" && snapshot) previousByLevel.set(level, snapshot);
    }
  }
  return results.map((result) => {
    if (result.mechanic !== "prospective") return null;
    const level = result.difficulty;
    const snapshot = prospectiveSnapshot(result);
    if (typeof level !== "number" || !snapshot) return null;
    const previous = previousByLevel.get(level);
    previousByLevel.set(level, snapshot);
    return previous ? { previous, current: snapshot } : null;
  });
}

function prospectiveSnapshot(result: MechanicResult): ProspectiveSnapshot | null {
  const ongoing = result.metrics.ongoing_accuracy;
  const cueHits = result.metrics.cue_hits;
  const cueTrials = result.metrics.cue_trials;
  const falseAlarms = result.metrics.false_alarms;
  if (
    typeof ongoing !== "number" ||
    !Number.isFinite(ongoing) ||
    typeof cueHits !== "number" ||
    !Number.isFinite(cueHits) ||
    typeof cueTrials !== "number" ||
    cueTrials <= 0 ||
    typeof falseAlarms !== "number" ||
    !Number.isFinite(falseAlarms)
  ) {
    return null;
  }
  return { ongoing, cueHits, cueTrials, falseAlarms };
}

function prospectiveChange(
  comparison: ProspectiveComparison | null,
  level: number | undefined,
): { direction: string; text: string } {
  if (comparison === null) {
    return {
      direction: "first",
      text:
        typeof level === "number"
          ? "First block at this level; no earlier Prospective Memory comparison."
          : "No earlier Prospective Memory comparison.",
    };
  }
  const { previous, current } = comparison;
  const ongoingDelta = Math.round((current.ongoing - previous.ongoing) * 100);
  const cueDelta = current.cueHits - previous.cueHits;
  const alarmDelta = current.falseAlarms - previous.falseAlarms;
  const direction =
    ongoingDelta > 0
      ? "improved"
      : ongoingDelta < 0
        ? "worsened"
        : cueDelta > 0 || alarmDelta < 0
          ? "improved"
          : cueDelta < 0 || alarmDelta > 0
            ? "worsened"
            : "same";
  if (direction === "same") {
    return {
      direction,
      text: `No change vs previous Level ${level} block: ongoing ${Math.round(current.ongoing * 100)}%, cues ${current.cueHits}/${current.cueTrials}, false alarms ${current.falseAlarms}.`,
    };
  }
  const deltaText = ongoingDelta > 0 ? `+${ongoingDelta}` : `${ongoingDelta}`;
  const prefix = direction === "improved" ? "Improved" : "Worsened";
  return {
    direction,
    text: `${prefix} vs previous Level ${level} block: ongoing ${Math.round(previous.ongoing * 100)}% → ${Math.round(current.ongoing * 100)}% (${deltaText} pp), cues ${previous.cueHits}/${previous.cueTrials} → ${current.cueHits}/${current.cueTrials}, false alarms ${previous.falseAlarms} → ${current.falseAlarms}.`,
  };
}

function ResultCard({
  result,
  index,
  isNewBest,
  confidence,
  switchCostComparison,
  interferenceCostComparison,
  spanComparison,
  rotationAccuracyComparison,
  rotationResponseComparison,
  prospectiveComparison,
  pairedAccuracyComparison,
  pairedResponseComparison,
}: {
  result: MechanicResult;
  index: number;
  isNewBest: boolean;
  confidence: Confidence | null;
  switchCostComparison: SwitchCostComparison | null;
  interferenceCostComparison: SwitchCostComparison | null;
  spanComparison: SwitchCostComparison | null;
  rotationAccuracyComparison: SwitchCostComparison | null;
  rotationResponseComparison: SwitchCostComparison | null;
  prospectiveComparison: ProspectiveComparison | null;
  pairedAccuracyComparison: SwitchCostComparison | null;
  pairedResponseComparison: SwitchCostComparison | null;
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
  const span = spanChange(
    spanComparison,
    result.difficulty,
    result.metrics.mean_span,
  );
  const rotationAccuracy = accuracyChange(
    rotationAccuracyComparison,
    result.difficulty,
    result.metrics.accuracy,
  );
  const rotationResponse = responseTimeChange(
    rotationResponseComparison,
    result.difficulty,
    result.metrics.mean_response_ms,
  );
  const prospective = prospectiveChange(
    prospectiveComparison,
    result.difficulty,
  );
  const pairedAccuracy = accuracyChange(
    pairedAccuracyComparison,
    result.difficulty,
    result.metrics.accuracy,
  );
  const pairedResponse = responseTimeChange(
    pairedResponseComparison,
    result.difficulty,
    result.metrics.mean_response_ms,
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
      {confidence ? (
        <p className="fine confidence-note" data-testid={`confidence-note-${index}`}>
          Confidence: {confidence[0]?.toUpperCase()}
          {confidence.slice(1)}. This is an optional reflection, not scored and not a diagnostic
          calibration.
        </p>
      ) : null}
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
      {result.mechanic === "spatial" ? (
        <p
          className={`fine switch-cost-change switch-cost-change-${span.direction}`}
          data-testid={`spatial-span-vs-previous-${index}`}
          data-direction={span.direction}
        >
          {span.text}
        </p>
      ) : null}
      {result.mechanic === "rotation" ? (
        <>
          <p
            className={`fine switch-cost-change switch-cost-change-${rotationAccuracy.direction}`}
            data-testid={`rotation-accuracy-vs-previous-${index}`}
            data-direction={rotationAccuracy.direction}
          >
            {rotationAccuracy.text}
          </p>
          <p
            className={`fine switch-cost-change switch-cost-change-${rotationResponse.direction}`}
            data-testid={`rotation-rt-vs-previous-${index}`}
            data-direction={rotationResponse.direction}
          >
            {rotationResponse.text}
          </p>
        </>
      ) : null}
      {result.mechanic === "prospective" ? (
        <p
          className={`fine switch-cost-change switch-cost-change-${prospective.direction}`}
          data-testid={`prospective-vs-previous-${index}`}
          data-direction={prospective.direction}
        >
          {prospective.text}
        </p>
      ) : null}
      {result.mechanic === "paired" ? (
        <>
          <p
            className={`fine switch-cost-change switch-cost-change-${pairedAccuracy.direction}`}
            data-testid={`paired-accuracy-vs-previous-${index}`}
            data-direction={pairedAccuracy.direction}
          >
            {pairedAccuracy.text}
          </p>
          <p
            className={`fine switch-cost-change switch-cost-change-${pairedResponse.direction}`}
            data-testid={`paired-rt-vs-previous-${index}`}
            data-direction={pairedResponse.direction}
          >
            {pairedResponse.text}
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
  confidences = [],
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
  const spanComparisonsByIndex = spanComparisons(history, sessionId, results);
  const rotationAccuracyComparisons = costComparisons(
    history,
    sessionId,
    results,
    "rotation",
    "accuracy",
  );
  const rotationResponseComparisons = costComparisons(
    history,
    sessionId,
    results,
    "rotation",
    "mean_response_ms",
  );
  const prospectiveComparisonsByIndex = prospectiveComparisons(history, sessionId, results);
  const pairedAccuracyComparisons = costComparisons(
    history,
    sessionId,
    results,
    "paired",
    "accuracy",
  );
  const pairedResponseComparisons = costComparisons(
    history,
    sessionId,
    results,
    "paired",
    "mean_response_ms",
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
            <ResultCard
              key={`${result.mechanic}-${index}`}
              result={result}
              index={index}
              isNewBest={newBests.includes(result.mechanic)}
              confidence={confidences[index] ?? null}
              switchCostComparison={switchComparisons[index] ?? null}
              interferenceCostComparison={interferenceComparisons[index] ?? null}
              spanComparison={spanComparisonsByIndex[index] ?? null}
              rotationAccuracyComparison={rotationAccuracyComparisons[index] ?? null}
              rotationResponseComparison={rotationResponseComparisons[index] ?? null}
              prospectiveComparison={prospectiveComparisonsByIndex[index] ?? null}
              pairedAccuracyComparison={pairedAccuracyComparisons[index] ?? null}
              pairedResponseComparison={pairedResponseComparisons[index] ?? null}
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
