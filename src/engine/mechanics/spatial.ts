import { stableHash } from "../hash";
import { normalizeSeed, sampleIndices } from "../rng";
import {
  clamp,
  currentStreak,
  longestStreak,
  mean,
  rate,
  round,
} from "../scoring";
import type {
  MechanicAction,
  MechanicResult,
  MechanicView,
  SpatialConfig,
  SpatialResponse,
  SpatialState,
  SpatialTrial,
} from "../types";

const START_SPANS = [3, 4, 5] as const;
const MIN_SPAN = 2;
const MAX_SPAN = 8;
const CELLS = 9;

export function spatialConfig(
  difficulty: number,
  trials = 8,
): SpatialConfig {
  const safeDifficulty = clamp(Math.round(difficulty), 1, 3);
  return {
    trials: Math.round(clamp(trials, 4, 30)),
    startSpan: START_SPANS[safeDifficulty - 1] ?? 4,
    showMs: 700 - (safeDifficulty - 1) * 100,
    gapMs: 300,
    feedbackMs: 800,
    recallLimitMs: 20_000,
  };
}

function makeTrial(span: number, rng: number): [SpatialTrial, number] {
  const [sequence, next] = sampleIndices(CELLS, span, rng);
  return [{ sequence, span }, next];
}

export function createSpatial(
  seed: number,
  config: SpatialConfig = spatialConfig(2),
): SpatialState {
  const normalizedSeed = normalizeSeed(seed);
  const [trial, rng] = makeTrial(config.startSpan, normalizedSeed);
  return {
    mechanic: "spatial",
    seed: normalizedSeed,
    rng,
    tick: 0,
    config,
    trials: [trial],
    index: 0,
    span: trial.span,
    phase: "show",
    phaseElapsed: 0,
    phaseDuration: config.showMs,
    showIndex: 0,
    selected: [],
    responses: [],
    completed: false,
  };
}

function currentTrial(state: SpatialState): SpatialTrial | null {
  return state.trials[state.index] ?? null;
}

function recordResponse(
  state: SpatialState,
  selected: number[],
  correct: boolean,
  timedOut: boolean,
): SpatialState {
  const trial = currentTrial(state);
  if (!trial) return state;
  const response: SpatialResponse = {
    trial: state.index,
    span: trial.span,
    selected,
    correct,
    timedOut,
  };
  return {
    ...state,
    responses: [...state.responses, response],
    selected,
    phase: "feedback",
    phaseElapsed: 0,
    phaseDuration: state.config.feedbackMs,
  };
}

function nextTrial(state: SpatialState): SpatialState {
  const last = state.responses[state.responses.length - 1];
  const span = clamp(state.span + (last?.correct ? 1 : -1), MIN_SPAN, MAX_SPAN);
  if (state.index >= state.config.trials - 1) {
    return {
      ...state,
      phase: "complete",
      phaseElapsed: 0,
      phaseDuration: 0,
      completed: true,
    };
  }
  const [trial, rng] = makeTrial(span, state.rng);
  return {
    ...state,
    rng,
    index: state.index + 1,
    span,
    trials: [...state.trials, trial],
    phase: "show",
    phaseElapsed: 0,
    phaseDuration: state.config.showMs,
    showIndex: 0,
    selected: [],
  };
}

function sanitizeMs(ms: number): number {
  if (!Number.isFinite(ms)) return 0;
  return clamp(Math.round(ms), 0, 10_000);
}

export function applySpatialAction(
  state: SpatialState,
  action: MechanicAction,
): SpatialState {
  if (state.completed) return state;
  if (action.type === "answer") {
    if (state.phase !== "recall") return state;
    const trial = currentTrial(state);
    if (!trial) return state;
    const option = Math.round(action.option);
    if (!Number.isInteger(option) || option < 0 || option >= CELLS) return state;
    const selected = [...state.selected, option];
    const position = state.selected.length;
    if (option !== trial.sequence[position]) {
      return recordResponse(state, selected, false, false);
    }
    if (selected.length === trial.sequence.length) {
      return recordResponse(state, selected, true, false);
    }
    return { ...state, selected };
  }
  if (action.type !== "advance") return state;
  const ms = sanitizeMs(action.ms);
  if (ms === 0) return state;
  let next: SpatialState = { ...state, tick: state.tick + ms };
  let remaining = ms;
  while (remaining > 0 && !next.completed) {
    const space = Math.max(0, next.phaseDuration - next.phaseElapsed);
    if (space > remaining) {
      next = { ...next, phaseElapsed: next.phaseElapsed + remaining };
      remaining = 0;
      break;
    }
    next = { ...next, phaseElapsed: next.phaseElapsed + space };
    remaining -= space;
    if (next.phase === "show") {
      if (next.showIndex + 1 < next.span) {
        next = {
          ...next,
          showIndex: next.showIndex + 1,
          phaseElapsed: 0,
          phaseDuration: next.config.showMs,
        };
      } else {
        next = {
          ...next,
          phase: "gap",
          phaseElapsed: 0,
          phaseDuration: next.config.gapMs,
        };
      }
    } else if (next.phase === "gap") {
      next = {
        ...next,
        phase: "recall",
        phaseElapsed: 0,
        phaseDuration: next.config.recallLimitMs,
      };
    } else if (next.phase === "recall") {
      next = recordResponse(next, next.selected, false, true);
    } else if (next.phase === "feedback") {
      next = nextTrial(next);
    } else {
      break;
    }
  }
  return next;
}

function computeMetrics(state: SpatialState): Record<string, number> {
  const seen = state.responses.length;
  const correct = state.responses.filter((response) => response.correct).length;
  const timedOut = state.responses.filter((response) => response.timedOut).length;
  const spans = state.responses.map((response) => response.span);
  const correctSpans = state.responses
    .filter((response) => response.correct)
    .map((response) => response.span);
  const correctness = state.responses.map((response) => response.correct);
  return {
    trials_seen: seen,
    correct,
    incorrect: seen - correct - timedOut,
    timed_out: timedOut,
    accuracy: rate(correct, seen),
    mean_span: spans.length === 0 ? 0 : round(mean(spans) ?? 0, 1),
    max_span: correctSpans.length === 0 ? 0 : Math.max(...correctSpans),
    current_streak: currentStreak(correctness, Boolean),
    max_streak: longestStreak(correctness, Boolean),
  };
}

export function spatialView(state: SpatialState): MechanicView {
  const trial = currentTrial(state);
  const last = state.responses[state.responses.length - 1] ?? null;
  const cells = Array.from({ length: CELLS }, () => "");
  if (trial && state.phase === "show") {
    const active = trial.sequence[state.showIndex];
    if (active !== undefined) cells[active] = "active";
  } else if (trial && state.phase === "recall") {
    for (const cell of state.selected) cells[cell] = "selected";
  } else if (trial && state.phase === "feedback") {
    for (const cell of trial.sequence) cells[cell] = "correct";
    state.selected.forEach((cell, position) => {
      if (cell !== trial.sequence[position]) cells[cell] = "wrong";
    });
  }
  const feedback =
    state.phase === "feedback" && last
      ? last.timedOut
        ? "Too slow"
        : last.correct
          ? "Correct"
          : "Incorrect"
      : null;
  const tone = feedback ? (last?.correct ? ("correct" as const) : ("incorrect" as const)) : null;
  return {
    mechanic: "spatial",
    name: "Spatial Span",
    phase: state.phase,
    prompt:
      state.phase === "complete"
        ? "Block complete"
        : state.phase === "show"
          ? `Watch the sequence · ${state.showIndex + 1} of ${state.span}`
          : state.phase === "gap"
            ? "Get ready to tap the same blocks"
            : state.phase === "recall"
              ? `Tap the blocks in the same order (${state.selected.length}/${state.span})`
              : "Sequence feedback",
    stimulus: null,
    options: cells,
    explanation:
      state.phase === "feedback" && trial
        ? trial.sequence.map((cell) => cell + 1).join(" → ")
        : null,
    progressCurrent: state.completed
      ? state.trials.length
      : Math.min(state.index + 1, state.trials.length),
    progressTotal: state.config.trials,
    feedback,
    feedbackTone: tone,
    canRespond: state.phase === "recall",
    controls: ["1", "2", "3", "4", "5", "6", "7", "8", "9"],
    metrics: computeMetrics(state),
    complete: state.completed,
  };
}

export function spatialResult(state: SpatialState): MechanicResult {
  const metrics = computeMetrics(state);
  const accuracy = metrics.accuracy ?? 0;
  const correct = metrics.correct ?? 0;
  return {
    mechanic: "spatial",
    domain: "working_memory",
    trials: state.config.trials,
    durationMs: state.tick,
    metrics,
    summary: `Spatial Span: ${Math.round(accuracy * 100)}% accuracy, ${correct}/${state.config.trials} correct, longest span ${metrics.max_span ?? 0}.`,
    seed: state.seed,
    stateHash: stableHash(state),
  };
}

export function spatialComplete(state: SpatialState): boolean {
  return state.completed;
}
