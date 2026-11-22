import { useState } from "react";
import { MECHANIC_META } from "../../engine/evidence";
import type { Confidence, Domain, MechanicId, MechanicResult } from "../../engine/types";
import type { AdherenceCounts } from "../../storage/adherence";
import type { SessionRecord } from "../../storage/history";
import { bestAccuracyFor } from "../../storage/history";
import type { SessionLength } from "../../storage/settings";
import { Button } from "../components/Button";
import { EvidenceBadge } from "../components/EvidenceBadge";

export type MenuTab = "tests" | "history";

const DOMAIN_ORDER: readonly Domain[] = [
  "working_memory",
  "inhibition",
  "reasoning",
  "processing_speed",
  "cognitive_flexibility",
  "executive_function",
  "episodic_memory",
];

const DOMAIN_LABELS: Record<Domain, string> = {
  working_memory: "Working memory",
  inhibition: "Inhibition",
  reasoning: "Reasoning",
  processing_speed: "Processing speed",
  cognitive_flexibility: "Cognitive flexibility",
  executive_function: "Executive function",
  episodic_memory: "Episodic memory",
};

interface PracticeMenuScreenProps {
  history: readonly SessionRecord[];
  adherenceCounts: AdherenceCounts;
  hasSession: boolean;
  sessionLength: SessionLength;
  initialTab?: MenuTab;
  onStartTest: (mechanic: MechanicId) => void;
  onStartSession: () => void;
  onResume: () => void;
  onExportHistory: () => void;
  onHome: () => void;
}

function percent(value: number | null): string {
  return value === null ? "—" : `${Math.round(value * 100)}%`;
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Unknown date";
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return "under 1 min";
  const minutes = ms / 60_000;
  return minutes < 1 ? "under 1 min" : `${Math.round(minutes)} min`;
}

function totalDuration(record: SessionRecord): number {
  return record.results.reduce((sum, result) => sum + result.durationMs, 0);
}

function resultFor(
  history: readonly SessionRecord[],
  mechanic: MechanicId,
): { blocks: number; last: MechanicResult | null; best: number | null } {
  let blocks = 0;
  let last: MechanicResult | null = null;
  for (const record of history) {
    for (const result of record.results) {
      if (result.mechanic !== mechanic) continue;
      blocks += 1;
      if (last === null) last = result;
    }
  }
  const best = last
    ? bestAccuracyFor(history, mechanic, last.difficulty)
    : bestAccuracyFor(history, mechanic);
  return { blocks, last, best };
}

interface SwitchCostLevel {
  level: number;
  values: number[];
  last: number;
  previous: number | null;
  delta: number | null;
  mean: number;
  best: number;
}

function costLevelsFor(
  history: readonly SessionRecord[],
  mechanic: MechanicId,
  metricKey: string,
): SwitchCostLevel[] {
  const levels = new Map<number, { values: number[]; lastSeen: number }>();
  let seen = 0;
  for (const record of [...history].reverse()) {
    for (const result of record.results) {
      if (result.mechanic !== mechanic) continue;
      const cost = result.metrics[metricKey];
      const level = result.difficulty;
      if (typeof level !== "number" || typeof cost !== "number" || !Number.isFinite(cost)) {
        continue;
      }
      const entry = levels.get(level) ?? { values: [], lastSeen: 0 };
      entry.values.push(cost);
      entry.lastSeen = seen;
      seen += 1;
      levels.set(level, entry);
    }
  }
  return [...levels.entries()]
    .sort((a, b) => b[1].lastSeen - a[1].lastSeen)
    .map(([level, entry]) => {
      const values = entry.values.slice(-10);
      const total = values.reduce((sum, value) => sum + value, 0);
      const last = values[values.length - 1] ?? 0;
      const previous = values.length >= 2 ? (values[values.length - 2] ?? null) : null;
      return {
        level,
        values,
        last,
        previous,
        delta: previous === null ? null : last - previous,
        mean: Math.round(total / values.length),
        best: Math.min(...values),
      };
    });
}

function switchCostLevels(history: readonly SessionRecord[]): SwitchCostLevel[] {
  return costLevelsFor(history, "switching", "switch_cost_ms");
}

function SwitchCostTrendLine({
  values,
  level,
  metricLabel = "switch cost",
  zeroBaseline = true,
}: {
  values: readonly number[];
  level: number;
  metricLabel?: string;
  zeroBaseline?: boolean;
}) {
  const width = 140;
  const height = 34;
  const pad = 4;
  const min = zeroBaseline ? Math.min(0, ...values) : Math.min(...values);
  const max = zeroBaseline ? Math.max(0, ...values) : Math.max(...values);
  const span = Math.max(1, max - min);
  const step = values.length === 1 ? 0 : (width - pad * 2) / (values.length - 1);
  const point = (value: number, index: number) => {
    const x = values.length === 1 ? width / 2 : pad + index * step;
    const y = height - pad - ((value - min) / span) * (height - pad * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  };
  const points = values.map(point);
  const zeroY = height - pad - ((0 - min) / span) * (height - pad * 2);
  return (
    <svg
      className="switch-cost-series"
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={`Level ${level} ${metricLabel} trend: ${values.join(", ")}`}
    >
      {zeroBaseline ? (
        <line x1={pad} y1={zeroY} x2={width - pad} y2={zeroY} className="switch-cost-zero" />
      ) : null}
      {values.length === 1 ? (
        <circle cx={width / 2} cy={Number(points[0]?.split(",")[1] ?? height / 2)} r="3" />
      ) : (
        <polyline points={points.join(" ")} />
      )}
    </svg>
  );
}

function flankerCostLevels(history: readonly SessionRecord[]): SwitchCostLevel[] {
  return costLevelsFor(history, "flanker", "interference_cost_ms");
}

function costLine(entry: SwitchCostLevel, label: string): string {
  if (entry.values.length <= 1) {
    return `${label} L${entry.level}: last ${entry.last} ms · first block at this level`;
  }
  const change =
    entry.delta === null || entry.delta === 0
      ? "no change"
      : entry.delta < 0
        ? `improved ${Math.abs(entry.delta)} ms`
        : `worsened +${entry.delta} ms`;
  return `${label} L${entry.level}: last ${entry.last} ms · ${
    entry.previous ?? 0
  } → ${entry.last} ms · ${change}`;
}

function changeCopy(entry: SwitchCostLevel): { direction: string; copy: string } {
  if (entry.previous === null) {
    return { direction: "first", copy: "First block at this level" };
  }
  if (entry.delta === 0) {
    return { direction: "same", copy: "No change vs previous block at this level" };
  }
  if (entry.delta !== null && entry.delta < 0) {
    return {
      direction: "improved",
      copy: `Improved ${Math.abs(entry.delta)} ms vs previous block at this level`,
    };
  }
  return {
    direction: "worsened",
    copy: `Worsened +${entry.delta} ms vs previous block at this level`,
  };
}

function CostTrendCard({
  testId,
  prefix,
  eyebrow,
  title,
  metricLabel,
  definition,
  levels,
}: {
  testId: string;
  prefix: string;
  eyebrow: string;
  title: string;
  metricLabel: string;
  definition: string;
  levels: readonly SwitchCostLevel[];
}) {
  return (
    <section className="card switch-cost-card" data-testid={testId}>
      <div className="card-top">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h2>{title}</h2>
        </div>
      </div>
      <p className="fine">{definition}</p>
      <div className="switch-cost-levels">
        {levels.map((entry) => {
          const change = changeCopy(entry);
          return (
            <div
              className="switch-cost-level"
              data-testid={`${prefix}-level-${entry.level}`}
              key={entry.level}
            >
              <div className="switch-cost-head">
                <span className="level-badge">Level {entry.level}</span>
                <span className="fine">
                  {entry.values.length} {entry.values.length === 1 ? "block" : "blocks"}
                </span>
              </div>
              <SwitchCostTrendLine
                values={entry.values}
                level={entry.level}
                metricLabel={metricLabel}
              />
              <p className="switch-cost-stats">
                Last <strong>{entry.last} ms</strong> · Mean {entry.mean} ms · Lowest{" "}
                {entry.best} ms
              </p>
              <p
                className={`switch-cost-change switch-cost-change-${change.direction}`}
                data-testid={`${prefix}-change-${entry.level}`}
                data-direction={change.direction}
              >
                {change.copy}
              </p>
            </div>
          );
        })}
      </div>
      <p className="fine">
        A single block is a baseline, not a trend; these are descriptive practice values, not
        a diagnosis.
      </p>
    </section>
  );
}

interface SpatialSpanLevel extends SwitchCostLevel {
  longest: number;
}

function formatMeanSpan(value: number): string {
  return value.toFixed(1);
}

function spatialSpanLevels(history: readonly SessionRecord[]): SpatialSpanLevel[] {
  const longestByLevel = new Map<number, number>();
  for (const record of history) {
    for (const result of record.results) {
      if (result.mechanic !== "spatial") continue;
      const level = result.difficulty;
      const maxSpan = result.metrics.max_span;
      if (
        typeof level === "number" &&
        typeof maxSpan === "number" &&
        Number.isFinite(maxSpan)
      ) {
        longestByLevel.set(level, Math.max(longestByLevel.get(level) ?? 0, maxSpan));
      }
    }
  }
  return costLevelsFor(history, "spatial", "mean_span").map((entry) => ({
    ...entry,
    delta: entry.delta === null ? null : Math.round(entry.delta * 10) / 10,
    longest: longestByLevel.get(entry.level) ?? 0,
  }));
}

function spanChange(entry: SpatialSpanLevel): { direction: string; copy: string } {
  if (entry.previous === null) {
    return { direction: "first", copy: "First block at this level" };
  }
  if (entry.delta === 0) {
    return { direction: "same", copy: "No change vs previous block at this level" };
  }
  if (entry.delta !== null && entry.delta > 0) {
    return {
      direction: "improved",
      copy: `Improved +${formatMeanSpan(entry.delta)} mean span vs previous block at this level`,
    };
  }
  return {
    direction: "worsened",
    copy: `Worsened ${formatMeanSpan(entry.delta ?? 0)} mean span vs previous block at this level`,
  };
}

function spatialSpanLine(entry: SpatialSpanLevel): string {
  const change =
    entry.previous === null
      ? "first block at this level"
      : entry.delta === 0
        ? "no change vs previous block"
        : entry.delta !== null && entry.delta > 0
          ? `improved +${formatMeanSpan(entry.delta)} vs previous block`
          : `worsened ${formatMeanSpan(entry.delta ?? 0)} vs previous block`;
  return `Spatial span L${entry.level}: last mean ${formatMeanSpan(entry.last)} · longest ${Math.round(entry.longest)} · ${change}`;
}

function SpanTrendCard({ levels }: { levels: readonly SpatialSpanLevel[] }) {
  return (
    <section className="card switch-cost-card" data-testid="spatial-span-trend">
      <div className="card-top">
        <div>
          <p className="eyebrow">Spatial Span</p>
          <h2>Mean span by level</h2>
        </div>
      </div>
      <p className="fine">
        Mean span = average sequence length attempted in a block. Longest span = longest sequence
        recalled correctly. Higher is better; compare blocks only within the same level.
      </p>
      <div className="switch-cost-levels">
        {levels.map((entry) => {
          const change = spanChange(entry);
          return (
            <div
              className="switch-cost-level"
              data-testid={`spatial-span-level-${entry.level}`}
              key={entry.level}
            >
              <div className="switch-cost-head">
                <span className="level-badge">Level {entry.level}</span>
                <span className="fine">
                  {entry.values.length} {entry.values.length === 1 ? "block" : "blocks"}
                </span>
              </div>
              <SwitchCostTrendLine
                values={entry.values}
                level={entry.level}
                metricLabel="mean span"
                zeroBaseline={false}
              />
              <p className="switch-cost-stats">
                Last mean <strong>{formatMeanSpan(entry.last)}</strong> · Longest{" "}
                <strong>{Math.round(entry.longest)}</strong>
              </p>
              <p
                className={`switch-cost-change switch-cost-change-${change.direction}`}
                data-testid={`spatial-span-change-${entry.level}`}
                data-direction={change.direction}
              >
                {change.copy}
              </p>
            </div>
          );
        })}
      </div>
      <p className="fine">
        A single block is a baseline, not a trend; these are descriptive practice values, not a
        diagnosis.
      </p>
    </section>
  );
}

interface DualMetricLevel {
  level: number;
  accuracies: number[];
  responseTimes: number[];
  lastAccuracy: number;
  bestAccuracy: number;
  lastResponse: number;
  meanResponse: number;
}

function dualMetricLevels(
  history: readonly SessionRecord[],
  mechanic: "rotation" | "paired" | "change",
): DualMetricLevel[] {
  const levels = new Map<
    number,
    { accuracies: number[]; responseTimes: number[]; lastSeen: number }
  >();
  let seen = 0;
  for (const record of [...history].reverse()) {
    for (const result of record.results) {
      if (result.mechanic !== mechanic) continue;
      const level = result.difficulty;
      const accuracy = result.metrics.accuracy;
      const response = result.metrics.mean_response_ms;
      if (
        typeof level !== "number" ||
        typeof accuracy !== "number" ||
        !Number.isFinite(accuracy) ||
        typeof response !== "number" ||
        !Number.isFinite(response)
      ) {
        continue;
      }
      const entry = levels.get(level) ?? { accuracies: [], responseTimes: [], lastSeen: 0 };
      entry.accuracies.push(accuracy);
      entry.responseTimes.push(response);
      entry.lastSeen = seen;
      seen += 1;
      levels.set(level, entry);
    }
  }
  return [...levels.entries()]
    .sort((a, b) => b[1].lastSeen - a[1].lastSeen)
    .map(([level, entry]) => {
      const accuracies = entry.accuracies.slice(-10);
      const responseTimes = entry.responseTimes.slice(-10);
      const total = responseTimes.reduce((sum, value) => sum + value, 0);
      return {
        level,
        accuracies,
        responseTimes,
        lastAccuracy: accuracies[accuracies.length - 1] ?? 0,
        bestAccuracy: Math.max(...accuracies),
        lastResponse: responseTimes[responseTimes.length - 1] ?? 0,
        meanResponse: Math.round(total / responseTimes.length),
      };
    });
}

function dualMetricLine(entry: DualMetricLevel, label: string): string {
  return `${label} L${entry.level}: last ${percent(entry.lastAccuracy)} accuracy · RT ${Math.round(entry.lastResponse)} ms · best ${percent(entry.bestAccuracy)}`;
}

function DualMetricTrendCard({
  levels,
  testId,
  prefix,
  eyebrow,
  title,
  description,
}: {
  levels: readonly DualMetricLevel[];
  testId: string;
  prefix: string;
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <section className="card switch-cost-card" data-testid={testId}>
      <div className="card-top">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h2>{title}</h2>
        </div>
      </div>
      <p className="fine">{description}</p>
      <div className="switch-cost-levels">
        {levels.map((entry) => (
          <div
            className="switch-cost-level"
            data-testid={`${prefix}-level-${entry.level}`}
            key={entry.level}
          >
            <div className="switch-cost-head">
              <span className="level-badge">Level {entry.level}</span>
              <span className="fine">
                {entry.accuracies.length} {entry.accuracies.length === 1 ? "block" : "blocks"}
              </span>
            </div>
            <p className="fine rotation-metric-label">Accuracy</p>
            <SwitchCostTrendLine
              values={entry.accuracies}
              level={entry.level}
              metricLabel="accuracy"
              zeroBaseline={false}
            />
            <p className="switch-cost-stats" data-testid={`${prefix}-accuracy-${entry.level}`}>
              Last <strong>{percent(entry.lastAccuracy)}</strong> · Best{" "}
              <strong>{percent(entry.bestAccuracy)}</strong>
            </p>
            <p className="fine rotation-metric-label">Response time</p>
            <SwitchCostTrendLine
              values={entry.responseTimes}
              level={entry.level}
              metricLabel="mean response time"
              zeroBaseline={false}
            />
            <p className="switch-cost-stats" data-testid={`${prefix}-rt-${entry.level}`}>
              Last <strong>{Math.round(entry.lastResponse)} ms</strong> · Mean{" "}
              <strong>{entry.meanResponse} ms</strong>
            </p>
          </div>
        ))}
      </div>
      <p className="fine">
        A single block is a baseline, not a trend; these are descriptive practice values, not a
        diagnosis.
      </p>
    </section>
  );
}

function rotationLevels(history: readonly SessionRecord[]): DualMetricLevel[] {
  return dualMetricLevels(history, "rotation");
}

function rotationLine(entry: DualMetricLevel): string {
  return dualMetricLine(entry, "Mental rotation");
}

function RotationTrendCard({ levels }: { levels: readonly DualMetricLevel[] }) {
  return (
    <DualMetricTrendCard
      levels={levels}
      testId="rotation-trend"
      prefix="rotation"
      eyebrow="Mental Rotation"
      title="Accuracy and response time by level"
      description="Accuracy is the share of correct rotation-versus-mirror judgements. Response time is the block mean. Higher accuracy and lower response time are better; compare blocks only within the same level."
    />
  );
}

function pairedLevels(history: readonly SessionRecord[]): DualMetricLevel[] {
  return dualMetricLevels(history, "paired");
}

function pairedLine(entry: DualMetricLevel): string {
  return dualMetricLine(entry, "Paired associates");
}

function PairedTrendCard({ levels }: { levels: readonly DualMetricLevel[] }) {
  return (
    <DualMetricTrendCard
      levels={levels}
      testId="paired-trend"
      prefix="paired"
      eyebrow="Paired Associates"
      title="Accuracy and response time by level"
      description="Accuracy is the share of correctly retrieved word partners. Response time is the block mean. Higher accuracy and lower response time are better; compare blocks only within the same level."
    />
  );
}

interface ChangeLevel extends DualMetricLevel {
  setSize: number;
}

function changeLevels(history: readonly SessionRecord[]): ChangeLevel[] {
  const setSizes = new Map<number, number>();
  for (const record of [...history].reverse()) {
    for (const result of record.results) {
      if (result.mechanic !== "change") continue;
      const level = result.difficulty;
      const setSize = result.metrics.set_size;
      if (typeof level === "number" && typeof setSize === "number" && Number.isFinite(setSize)) {
        setSizes.set(level, Math.round(setSize));
      }
    }
  }
  return dualMetricLevels(history, "change").map((entry) => ({
    ...entry,
    setSize: setSizes.get(entry.level) ?? 0,
  }));
}

function changeLine(entry: ChangeLevel): string {
  return `Change detection L${entry.level}: last ${percent(
    entry.lastAccuracy,
  )} accuracy · set ${entry.setSize} · RT ${Math.round(entry.lastResponse)} ms · best ${percent(
    entry.bestAccuracy,
  )}`;
}

function ChangeTrendCard({ levels }: { levels: readonly ChangeLevel[] }) {
  return (
    <section className="card switch-cost-card" data-testid="change-trend">
      <div className="card-top">
        <div>
          <p className="eyebrow">Change Detection</p>
          <h2>Accuracy, set size and response time by level</h2>
        </div>
      </div>
      <p className="fine">
        Accuracy is the share of correctly identified changed squares. Set size is the number of
        squares held in the array. Response time is the block mean. Higher accuracy and lower
        response time are better; compare blocks only within the same level.
      </p>
      <div className="switch-cost-levels">
        {levels.map((entry) => (
          <div
            className="switch-cost-level"
            data-testid={`change-level-${entry.level}`}
            key={entry.level}
          >
            <div className="switch-cost-head">
              <span className="level-badge">Level {entry.level}</span>
              <span className="fine">
                {entry.accuracies.length} {entry.accuracies.length === 1 ? "block" : "blocks"}
              </span>
            </div>
            <p className="fine rotation-metric-label">Accuracy</p>
            <SwitchCostTrendLine
              values={entry.accuracies}
              level={entry.level}
              metricLabel="accuracy"
              zeroBaseline={false}
            />
            <p className="switch-cost-stats" data-testid={`change-accuracy-${entry.level}`}>
              Last <strong>{percent(entry.lastAccuracy)}</strong> · Best{" "}
              <strong>{percent(entry.bestAccuracy)}</strong>
            </p>
            <p className="switch-cost-stats" data-testid={`change-set-size-${entry.level}`}>
              Set size <strong>{entry.setSize}</strong>
            </p>
            <p className="fine rotation-metric-label">Response time</p>
            <SwitchCostTrendLine
              values={entry.responseTimes}
              level={entry.level}
              metricLabel="mean response time"
              zeroBaseline={false}
            />
            <p className="switch-cost-stats" data-testid={`change-rt-${entry.level}`}>
              Last <strong>{Math.round(entry.lastResponse)} ms</strong> · Mean{" "}
              <strong>{entry.meanResponse} ms</strong>
            </p>
          </div>
        ))}
      </div>
      <p className="fine">
        A single block is a baseline, not a trend; these are descriptive practice values, not a
        diagnosis.
      </p>
    </section>
  );
}

interface ProspectiveLevel {
  level: number;
  blocks: number;
  ongoing: number[];
  cueAccuracy: number[];
  falseAlarms: number[];
  lastOngoing: number;
  bestOngoing: number;
  lastCueAccuracy: number;
  bestCueAccuracy: number;
  lastCueHits: number;
  lastCueTrials: number;
  lastFalseAlarms: number;
  totalFalseAlarms: number;
}

function prospectiveLevels(history: readonly SessionRecord[]): ProspectiveLevel[] {
  const levels = new Map<
    number,
    {
      ongoing: number[];
      cueAccuracy: number[];
      cueHits: number[];
      cueTrials: number[];
      falseAlarms: number[];
      lastSeen: number;
    }
  >();
  let seen = 0;
  for (const record of [...history].reverse()) {
    for (const result of record.results) {
      if (result.mechanic !== "prospective") continue;
      const level = result.difficulty;
      const ongoing = result.metrics.ongoing_accuracy;
      const cueHits = result.metrics.cue_hits;
      const cueTrials = result.metrics.cue_trials;
      const falseAlarms = result.metrics.false_alarms;
      if (
        typeof level !== "number" ||
        typeof ongoing !== "number" ||
        !Number.isFinite(ongoing) ||
        typeof cueHits !== "number" ||
        typeof cueTrials !== "number" ||
        cueTrials <= 0 ||
        typeof falseAlarms !== "number" ||
        !Number.isFinite(falseAlarms)
      ) {
        continue;
      }
      const entry = levels.get(level) ?? {
        ongoing: [],
        cueAccuracy: [],
        cueHits: [],
        cueTrials: [],
        falseAlarms: [],
        lastSeen: 0,
      };
      entry.ongoing.push(ongoing);
      entry.cueAccuracy.push(cueHits / cueTrials);
      entry.cueHits.push(cueHits);
      entry.cueTrials.push(cueTrials);
      entry.falseAlarms.push(falseAlarms);
      entry.lastSeen = seen;
      seen += 1;
      levels.set(level, entry);
    }
  }
  return [...levels.entries()]
    .sort((a, b) => b[1].lastSeen - a[1].lastSeen)
    .map(([level, entry]) => {
      const ongoing = entry.ongoing.slice(-10);
      const cueAccuracy = entry.cueAccuracy.slice(-10);
      const cueHits = entry.cueHits.slice(-10);
      const cueTrials = entry.cueTrials.slice(-10);
      const falseAlarms = entry.falseAlarms.slice(-10);
      return {
        level,
        blocks: ongoing.length,
        ongoing,
        cueAccuracy,
        falseAlarms,
        lastOngoing: ongoing[ongoing.length - 1] ?? 0,
        bestOngoing: Math.max(...ongoing),
        lastCueAccuracy: cueAccuracy[cueAccuracy.length - 1] ?? 0,
        bestCueAccuracy: Math.max(...cueAccuracy),
        lastCueHits: cueHits[cueHits.length - 1] ?? 0,
        lastCueTrials: cueTrials[cueTrials.length - 1] ?? 0,
        lastFalseAlarms: falseAlarms[falseAlarms.length - 1] ?? 0,
        totalFalseAlarms: falseAlarms.reduce((sum, value) => sum + value, 0),
      };
    });
}

function prospectiveLine(entry: ProspectiveLevel): string {
  return `Prospective memory L${entry.level}: ongoing ${percent(entry.lastOngoing)} · cues ${entry.lastCueHits}/${entry.lastCueTrials} · false alarms ${entry.lastFalseAlarms}`;
}

function ProspectiveTrendCard({ levels }: { levels: readonly ProspectiveLevel[] }) {
  return (
    <section className="card switch-cost-card" data-testid="prospective-trend">
      <div className="card-top">
        <div>
          <p className="eyebrow">Prospective Memory</p>
          <h2>Ongoing, cue and false-alarm trends by level</h2>
        </div>
      </div>
      <p className="fine">
        Ongoing accuracy covers non-cue letters; cue accuracy covers the Q Remember trials.
        False alarms are Remember responses on non-cue letters. Higher accuracy and cue hits are
        better; lower false alarms are better. Compare blocks only within the same level.
      </p>
      <div className="switch-cost-levels">
        {levels.map((entry) => (
          <div
            className="switch-cost-level"
            data-testid={`prospective-level-${entry.level}`}
            key={entry.level}
          >
            <div className="switch-cost-head">
              <span className="level-badge">Level {entry.level}</span>
              <span className="fine">
                {entry.blocks} {entry.blocks === 1 ? "block" : "blocks"}
              </span>
            </div>
            <p className="fine rotation-metric-label">Ongoing accuracy</p>
            <SwitchCostTrendLine
              values={entry.ongoing}
              level={entry.level}
              metricLabel="ongoing accuracy"
              zeroBaseline={false}
            />
            <p className="switch-cost-stats" data-testid={`prospective-ongoing-${entry.level}`}>
              Last <strong>{percent(entry.lastOngoing)}</strong> · Best{" "}
              <strong>{percent(entry.bestOngoing)}</strong>
            </p>
            <p className="fine rotation-metric-label">Cue accuracy</p>
            <SwitchCostTrendLine
              values={entry.cueAccuracy}
              level={entry.level}
              metricLabel="cue accuracy"
              zeroBaseline={false}
            />
            <p className="switch-cost-stats" data-testid={`prospective-cue-${entry.level}`}>
              Last <strong>{entry.lastCueHits}/{entry.lastCueTrials}</strong> ·{" "}
              {percent(entry.lastCueAccuracy)} · Best {percent(entry.bestCueAccuracy)}
            </p>
            <p className="fine rotation-metric-label">False alarms</p>
            <SwitchCostTrendLine
              values={entry.falseAlarms}
              level={entry.level}
              metricLabel="false alarms"
              zeroBaseline={false}
            />
            <p className="switch-cost-stats" data-testid={`prospective-false-alarms-${entry.level}`}>
              Last <strong>{entry.lastFalseAlarms}</strong> · Total{" "}
              <strong>{entry.totalFalseAlarms}</strong>
            </p>
          </div>
        ))}
      </div>
      <p className="fine">
        A single block is a baseline, not a trend; these are descriptive practice values, not a
        diagnosis.
      </p>
    </section>
  );
}

function TestCard({
  mechanic,
  history,
  onStartTest,
}: {
  mechanic: MechanicId;
  history: readonly SessionRecord[];
  onStartTest: (mechanic: MechanicId) => void;
}) {
  const meta = MECHANIC_META[mechanic];
  const stats = resultFor(history, mechanic);
  const level = typeof stats.last?.difficulty === "number" ? stats.last.difficulty : null;
  const source = meta.citations[0];
  const costLevel =
    mechanic === "switching" && level !== null
      ? (switchCostLevels(history).find((entry) => entry.level === level) ?? null)
      : null;
  const switchCostLine = costLevel ? costLine(costLevel, "Switch cost") : null;
  const interferenceLevel =
    mechanic === "flanker" && level !== null
      ? (flankerCostLevels(history).find((entry) => entry.level === level) ?? null)
      : null;
  const interferenceLine = interferenceLevel
    ? costLine(interferenceLevel, "Interference cost")
    : null;
  const spanLevel =
    mechanic === "spatial" && level !== null
      ? (spatialSpanLevels(history).find((entry) => entry.level === level) ?? null)
      : null;
  const spanLine = spanLevel ? spatialSpanLine(spanLevel) : null;
  const rotationLevel =
    mechanic === "rotation" && level !== null
      ? (rotationLevels(history).find((entry) => entry.level === level) ?? null)
      : null;
  const rotationTrendLine = rotationLevel ? rotationLine(rotationLevel) : null;
  const pairedLevel =
    mechanic === "paired" && level !== null
      ? (pairedLevels(history).find((entry) => entry.level === level) ?? null)
      : null;
  const pairedTrendLine = pairedLevel ? pairedLine(pairedLevel) : null;
  const changeLevel =
    mechanic === "change" && level !== null
      ? (changeLevels(history).find((entry) => entry.level === level) ?? null)
      : null;
  const changeTrendLine = changeLevel ? changeLine(changeLevel) : null;
  const prospectiveLevel =
    mechanic === "prospective" && level !== null
      ? (prospectiveLevels(history).find((entry) => entry.level === level) ?? null)
      : null;
  const prospectiveTrendLine = prospectiveLevel ? prospectiveLine(prospectiveLevel) : null;

  return (
    <article className="card menu-test-card" data-testid={`menu-test-${mechanic}`}>
      <div className="card-top">
        <div>
          <p className="eyebrow">{meta.tagline}</p>
          <h2>{meta.name}</h2>
        </div>
        <EvidenceBadge level={meta.claimLevel} />
      </div>
      <p>{meta.brief}</p>
      <details className="menu-evidence">
        <summary>Evidence &amp; claim</summary>
        <p className="fine">
          <strong>What the evidence supports:</strong> {meta.claim}
        </p>
        <p className="fine">
          <strong>What it does not claim:</strong> {meta.notClaimed.join(", ")}.
        </p>
        {source ? (
          <p className="fine">
            <strong>Primary source:</strong>{" "}
            <a
              href={`https://pubmed.ncbi.nlm.nih.gov/${source.pmid}/`}
              target="_blank"
              rel="noreferrer"
            >
              {source.label}
            </a>{" "}
            <span className="pmid">PMID {source.pmid}</span>
          </p>
        ) : null}
      </details>
      <p className="menu-stats">
        {stats.last
          ? `Last ${level !== null ? `L${level} ` : ""}${percent(
              stats.last.metrics.accuracy ?? null,
            )} · Best ${level !== null ? `L${level} ` : ""}${percent(stats.best)} · ${
              stats.blocks
            } ${stats.blocks === 1 ? "block" : "blocks"} practised`
          : "No blocks practised yet. The first block is a baseline, not a test you can fail."}
      </p>
      {switchCostLine ? (
        <p className="fine menu-switch-cost" data-testid="menu-switch-cost">
          {switchCostLine}
        </p>
      ) : null}
      {interferenceLine ? (
        <p className="fine menu-flanker-cost" data-testid="menu-flanker-cost">
          {interferenceLine}
        </p>
      ) : null}
      {spanLine ? (
        <p className="fine menu-spatial-span" data-testid="menu-spatial-span">
          {spanLine}
        </p>
      ) : null}
      {rotationTrendLine ? (
        <p className="fine menu-rotation-trend" data-testid="menu-rotation-trend">
          {rotationTrendLine}
        </p>
      ) : null}
      {pairedTrendLine ? (
        <p className="fine menu-paired-trend" data-testid="menu-paired-trend">
          {pairedTrendLine}
        </p>
      ) : null}
      {changeTrendLine ? (
        <p className="fine menu-change-trend" data-testid="menu-change-trend">
          {changeTrendLine}
        </p>
      ) : null}
      {prospectiveTrendLine ? (
        <p className="fine menu-prospective-trend" data-testid="menu-prospective-trend">
          {prospectiveTrendLine}
        </p>
      ) : null}
      <div className="hero-actions">
        <Button onClick={() => onStartTest(mechanic)} data-testid={`start-${mechanic}`}>
          Start {meta.name} test
        </Button>
      </div>
    </article>
  );
}

interface ConfidenceRow {
  mechanic: MechanicId;
  level: number;
  buckets: Record<Confidence, { count: number; total: number }>;
  lastSeen: number;
}

const CONFIDENCE_LABELS: Record<Confidence, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

const CONFIDENCE_ORDER: readonly Confidence[] = ["high", "medium", "low"];

function confidenceSummary(history: readonly SessionRecord[]): ConfidenceRow[] {
  const rows = new Map<string, ConfidenceRow>();
  let seen = 0;
  for (const record of [...history].reverse()) {
    for (const result of record.results) {
      const confidence = result.confidence;
      const level = result.difficulty;
      const accuracy = result.metrics.accuracy;
      if (
        typeof level !== "number" ||
        typeof accuracy !== "number" ||
        !Number.isFinite(accuracy) ||
        (confidence !== "low" && confidence !== "medium" && confidence !== "high")
      ) {
        continue;
      }
      const key = `${result.mechanic}-${level}`;
      const row =
        rows.get(key) ??
        {
          mechanic: result.mechanic,
          level,
          buckets: {
            low: { count: 0, total: 0 },
            medium: { count: 0, total: 0 },
            high: { count: 0, total: 0 },
          },
          lastSeen: 0,
        };
      row.buckets[confidence].count += 1;
      row.buckets[confidence].total += accuracy;
      row.lastSeen = seen;
      seen += 1;
      rows.set(key, row);
    }
  }
  return [...rows.values()].sort((a, b) => b.lastSeen - a.lastSeen);
}

function confidenceRowText(row: ConfidenceRow): string {
  const parts = CONFIDENCE_ORDER.filter(
    (confidence) => row.buckets[confidence].count > 0,
  ).map((confidence) => {
    const bucket = row.buckets[confidence];
    return `${CONFIDENCE_LABELS[confidence]} ${percent(
      bucket.total / bucket.count,
    )} (${bucket.count} ${bucket.count === 1 ? "block" : "blocks"})`;
  });
  return `${MECHANIC_META[row.mechanic]?.name ?? row.mechanic} L${row.level}: ${parts.join(
    " · ",
  )}`;
}

function ConfidenceSummary({ rows }: { rows: readonly ConfidenceRow[] }) {
  return (
    <section className="card confidence-summary" data-testid="confidence-summary">
      <div className="card-top">
        <div>
          <p className="eyebrow">Reflection</p>
          <h2>Confidence vs accuracy</h2>
        </div>
      </div>
      <p className="fine">
        Same-level blocks only. Confidence is an optional reflection, not a score or a
        diagnostic calibration. Confidence is often only a weak predictor of actual accuracy.
      </p>
      <div className="confidence-summary-rows">
        {rows.map((row) => (
          <p
            key={`${row.mechanic}-${row.level}`}
            data-testid={`confidence-summary-${row.mechanic}-${row.level}`}
          >
            {confidenceRowText(row)}
          </p>
        ))}
      </div>
    </section>
  );
}

function HistoryPanel({
  history,
  adherenceCounts,
  onExportHistory,
}: {
  history: readonly SessionRecord[];
  adherenceCounts: AdherenceCounts;
  onExportHistory: () => void;
}) {
  const completionRate =
    adherenceCounts.started === 0
      ? null
      : Math.round((adherenceCounts.completed / adherenceCounts.started) * 100);
  const costLevels = switchCostLevels(history);
  const interferenceLevels = flankerCostLevels(history);
  const spanLevels = spatialSpanLevels(history);
  const rotationTrendLevels = rotationLevels(history);
  const pairedTrendLevels = pairedLevels(history);
  const changeTrendLevels = changeLevels(history);
  const confidenceRows = confidenceSummary(history);
  const prospectiveTrendLevels = prospectiveLevels(history);

  return (
    <div
      className="stack"
      data-testid="menu-history"
      role="tabpanel"
      id="menu-panel-history"
      aria-labelledby="menu-tab-history"
    >
      <div className="menu-history-head">
        <div>
          <h2>Your history</h2>
          <p className="muted">
            Completed sessions stay on this device. Each block is reported separately; there
            is no combined score.
          </p>
        </div>
        <Button
          variant="ghost"
          onClick={onExportHistory}
          disabled={history.length === 0}
        >
          Export practice data
        </Button>
      </div>

      <section className="card adherence-card" data-testid="menu-adherence">
        <div className="card-top">
          <div>
            <p className="eyebrow">Your adherence</p>
            <h2>Session completion</h2>
          </div>
          {completionRate !== null ? (
            <span className="seed">{completionRate}% completed</span>
          ) : null}
        </div>
        {adherenceCounts.started === 0 ? (
          <p className="muted">No sessions started yet.</p>
        ) : (
          <p className="week-line">
            <strong>{adherenceCounts.started}</strong> started ·{" "}
            <strong>{adherenceCounts.completed}</strong> completed ·{" "}
            <strong>{adherenceCounts.aborted}</strong> ended early
          </p>
        )}
        <p className="fine">
          Stopping early is not a failure; it is recorded so the study team can understand
          real-world use. This summary stays on this device.
        </p>
        <p className="fine" data-testid="adherence-evidence">
          <strong>What the literature says:</strong> in a meta-analysis of 55 randomised trials
          (4,455 older adults), training effects were significant when engagement or persistence
          exceeded 60% or adherence exceeded 80%. Those are study-level subgroup observations, not
          a personal target or a promise of benefit.{" "}
          <a
            href="https://pubmed.ncbi.nlm.nih.gov/38266127/"
            target="_blank"
            rel="noreferrer"
          >
            Li et al. 2024
          </a>{" "}
          <span className="pmid">PMID 38266127</span>
        </p>
      </section>

      {costLevels.length > 0 ? (
        <CostTrendCard
          testId="switch-cost-trend"
          prefix="switch-cost"
          eyebrow="Task Switch"
          title="Switch cost by level"
          metricLabel="switch cost"
          definition="Switch cost = switch-trial reaction time minus repeat-trial reaction time. Lower is faster switching; a negative value is possible. Compare blocks only within the same level."
          levels={costLevels}
        />
      ) : null}

      {interferenceLevels.length > 0 ? (
        <CostTrendCard
          testId="flanker-cost-trend"
          prefix="flanker-cost"
          eyebrow="Flanker"
          title="Interference cost by level"
          metricLabel="interference cost"
          definition="Interference cost = incongruent-trial reaction time minus congruent-trial reaction time. Lower is less interference; a negative value is possible. Compare blocks only within the same level."
          levels={interferenceLevels}
        />
      ) : null}

      {spanLevels.length > 0 ? <SpanTrendCard levels={spanLevels} /> : null}

      {rotationTrendLevels.length > 0 ? (
        <RotationTrendCard levels={rotationTrendLevels} />
      ) : null}

      {pairedTrendLevels.length > 0 ? <PairedTrendCard levels={pairedTrendLevels} /> : null}

      {changeTrendLevels.length > 0 ? <ChangeTrendCard levels={changeTrendLevels} /> : null}

      {confidenceRows.length > 0 ? <ConfidenceSummary rows={confidenceRows} /> : null}

      {prospectiveTrendLevels.length > 0 ? (
        <ProspectiveTrendCard levels={prospectiveTrendLevels} />
      ) : null}

      {history.length === 0 ? (
        <section className="card" data-testid="menu-history-empty">
          <h3>No completed sessions yet</h3>
          <p className="muted">
            Finish a session and its blocks, levels and accuracies appear here. Nothing is
            sent to a server.
          </p>
        </section>
      ) : (
        <div className="history-list">
          {history.map((record) => (
            <article className="card history-card" data-testid="history-session" key={record.id}>
              <div className="card-top">
                <div>
                  <p className="eyebrow">Session</p>
                  <h3>{formatDate(record.finishedAt)}</h3>
                </div>
                <span className="seed">
                  {record.results.length} {record.results.length === 1 ? "block" : "blocks"} ·{" "}
                  {formatDuration(totalDuration(record))}
                </span>
              </div>
              <ul className="history-blocks">
                {record.results.map((result, index) => (
                  <li className="history-block" key={`${record.id}-${result.mechanic}-${index}`}>
                    <span className="history-mechanic">
                      {MECHANIC_META[result.mechanic]?.name ?? result.mechanic}
                    </span>
                    <span className="history-level">
                      {typeof result.difficulty === "number"
                        ? `Level ${result.difficulty}`
                        : "Level —"}
                    </span>
                    <span className="history-accuracy">
                      {percent(result.metrics.accuracy ?? null)}
                    </span>
                    <span className="fine">{result.summary}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export function PracticeMenuScreen({
  history,
  adherenceCounts,
  hasSession,
  sessionLength,
  initialTab = "tests",
  onStartTest,
  onStartSession,
  onResume,
  onExportHistory,
  onHome,
}: PracticeMenuScreenProps) {
  const [tab, setTab] = useState<MenuTab>(initialTab);
  const [domain, setDomain] = useState<Domain | "all">("all");
  const allMechanics = Object.keys(MECHANIC_META) as MechanicId[];
  const visibleMechanics = allMechanics.filter(
    (mechanic) => domain === "all" || MECHANIC_META[mechanic].domain === domain,
  );

  return (
    <section className="screen practice-menu-screen">
      <div className="hero menu-hero">
        <p className="eyebrow">Practice menu</p>
        <h1>Choose a test or review your history</h1>
        <p className="lede">
          Every test begins with a short explanation of what it measures, what the evidence
          supports and what it does not claim. Pick one task below, or run the interleaved
          session.
        </p>
        <button
          type="button"
          className="start-cta"
          onClick={hasSession ? onResume : onStartSession}
          data-testid="menu-start-session"
        >
          <span className="start-cta-label">
            {hasSession ? "Resume session" : "Start full session"}
          </span>
          <span className="start-cta-meta">
            {hasSession
              ? "Pick up where you paused"
              : `About ${sessionLength === "quick" ? "5" : "8"} minutes · ${
                  sessionLength === "quick" ? "2" : "4"
                } blocks · no flashing`}
          </span>
        </button>
      </div>

      <div className="menu-tabs" role="tablist" aria-label="Practice menu sections">
        <button
          type="button"
          role="tab"
          id="menu-tab-tests"
          aria-selected={tab === "tests"}
          aria-controls="menu-panel-tests"
          className={tab === "tests" ? "menu-tab menu-tab-active" : "menu-tab"}
          onClick={() => setTab("tests")}
        >
          Choose a test
        </button>
        <button
          type="button"
          role="tab"
          id="menu-tab-history"
          aria-selected={tab === "history"}
          aria-controls="menu-panel-history"
          className={tab === "history" ? "menu-tab menu-tab-active" : "menu-tab"}
          onClick={() => setTab("history")}
        >
          History ({history.length})
        </button>
      </div>

      {tab === "tests" ? (
        <div
          className="stack"
          role="tabpanel"
          id="menu-panel-tests"
          aria-labelledby="menu-tab-tests"
        >
          <div className="menu-filter" data-testid="menu-filter">
            <label htmlFor="domain-filter">Filter by domain</label>
            <select
              id="domain-filter"
              data-testid="domain-filter"
              value={domain}
              onChange={(event) => setDomain(event.target.value as Domain | "all")}
            >
              <option value="all">All tests</option>
              {DOMAIN_ORDER.map((entry) => (
                <option key={entry} value={entry}>
                  {DOMAIN_LABELS[entry]}
                </option>
              ))}
            </select>
            <span className="fine" data-testid="menu-filter-count">
              {visibleMechanics.length} of {allMechanics.length} tests
            </span>
          </div>
          {visibleMechanics.length === 0 ? (
            <p className="notice">No tests in this domain.</p>
          ) : (
            <div className="grid menu-test-grid">
              {visibleMechanics.map((mechanic) => (
                <TestCard
                  key={mechanic}
                  mechanic={mechanic}
                  history={history}
                  onStartTest={onStartTest}
                />
              ))}
            </div>
          )}
          <p className="fine">
            A single-test session runs three blocks of the same task. The full session
            interleaves the four tasks. Both begin each block with the same explanation, and
            neither changes the other&apos;s scores.
          </p>
        </div>
      ) : (
        <HistoryPanel
          history={history}
          adherenceCounts={adherenceCounts}
          onExportHistory={onExportHistory}
        />
      )}

      <Button variant="ghost" onClick={onHome}>
        Back to home
      </Button>
    </section>
  );
}
